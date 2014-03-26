var BaseModel = AppModel.Base,
    _support = AppModel._support;

/**
 * Save if valid. If force is set to 'force' then save even if invalid.
 */
App.extend(BaseModel.prototype, {
  $save: function(force) {
    var doc = this;
    doc.$isValid();
    if (force === 'force' || !doc._errors)
      return save(doc);

    return false;
  },

  $$save: function() {
    var doc = this;
    doc.$assertValid();

    return save(doc);
  },
});

function save(doc) {
  var _id = doc.attributes._id;

  if(_id == null) {
    _id = (doc.changes && doc.changes._id) || Random.id();
    Meteor.call(remoteName(doc,'save'), _id, _.extend(doc.attributes,doc.changes), logError);
    doc.attributes._id = _id;
  } else if (! _.isEmpty(doc.changes)) {
    // only call if at least one change
    Meteor.call(remoteName(doc,'save'), doc._id, doc.changes, logError);
  }

  return doc.$reload();
}

AppModel._support.setupExtras.push(function (model) {
  model.addRemoveRpc = function () {
    var origRemove = model.prototype.$remove;
    model.prototype.$remove = removeFunc(model.modelName+".remove");

    model.remote({
      remove: function (id) {
        var doc = model.findOne(id);
        return origRemove.call(doc);
      },
    });
  };

  model.attrDocs = function () {
    return model.docs._collection._docs._map;
  };

  model.fencedInsert = function (attrs) {
    return model.docs.insert(attrs);
  };

  model.fencedUpdate = function (id /* args */) {
    if (typeof id !== 'string') throw new Meteor.Error(500, "Invalid arguments");
    return model.docs.update.apply(model.docs, arguments);
  };

  model.fencedRemove = function (id /* args */) {
    if (typeof id !== 'string') throw new Meteor.Error(500, "Invalid arguments");
    return model.docs.remove.apply(model.docs, arguments);
  };
});

function removeFunc(method) {
  return function () {
    Meteor.call(method, this._id);
  };
}

App.extend(AppModel, {
  beginWaitFor: function (colName, id, func) {
    return func();
  },

  endWaitFor: function (colName, id) {},
});


App.extend(_support, {
  attrFind: function (id) {
    return this.attrDocs()[id];
  },

  pushRpc: function(model, field) {
    addPushField(model);
    return function(_id, value) {
      var update = {};
      update[field] = value;
      model.docs.update(_id, {$push: update});
    };
  },

  pullRpc: function(model, field) {
    addPullField(model);
    return function(_id, value) {
      var update = {};
      update[field] = value;
      model.docs.update(_id, {$pull: update});
    };
  },

  bumpVersion: function () {
    var doc = this;
    Meteor.call(remoteName(doc,'bumpVersion'), doc._id, doc._version);
  },

  bumpVersionRpc: function (modelName) {
    return function (_id, _version) {
      _support.performBumpVersion(AppModel[modelName], _id, _version);
    };
  },

  saveRpc: function(modelName) {
    return function(_id,changes) {
      try {
        var model = AppModel[modelName],
            docs = model.docs,
            doc = docs.findOne(_id),
            now = App.newDate();

        BaseModel._updateTimestamps(changes, model.updateTimestamps, now);

        if(doc) {
          doc.changes = changes;
          _support.performUpdate(doc);
        } else {
          BaseModel._addUserIds(changes, model.userIds, this.userId);
          BaseModel._updateTimestamps(changes, model.createTimestamps, now);
          changes._id = _id;
          doc = new model();
          doc.attributes = doc.changes = changes;

          _support.performInsert(doc, changes);
        }
      } catch(e) {
        console.log('Error: ',[modelName,_id,changes,e]);
        throw e;
      }
    };
  },

  remote: function (name,func) {
    return func;
  },
});

function remoteName(doc,name) {
  return _support.modelName(doc) + '.' + name;
}

function logError(err, result) {
  if (err != null) {
    console.log('ERROR: ', err);
    App.globalErrorCatch && App.globalErrorCatch(err);
  }
}

function addPushField(model) {
  if (model.prototype.$push) return;
  model.prototype.$push = function (field, value) {
    Meteor.call(model.modelName+'.push.'+field, this._id, value, logError);
    return this;
  };
}

function addPullField(model) {
  if (model.prototype.$pull) return;
  model.prototype.$pull = function (field, value) {
    Meteor.call(model.modelName+'.pull.'+field, this._id, value, logError);
    return this;
  };
}
