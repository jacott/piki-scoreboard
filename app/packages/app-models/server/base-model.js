var BaseModel = AppModel.Base,
    _support = AppModel._support;

BaseModel.prototype.$save = function() {
  var doc = this,
      model = doc.constructor,
      _id = doc._id,
      changes = doc.changes,
      now = App.newDate();

  BaseModel._updateTimestamps(changes, model.updateTimestamps, now);
  if(_id == null) {
    doc.attributes._id = _id = (changes && changes._id) || Random.id();
    BaseModel._updateTimestamps(changes, model.createTimestamps, now);

    doc.changes = _.extend(doc.attributes,changes);
    _support.performInsert(doc);
  } else {
    _support.performUpdate(doc);
  }
  doc.changes = {};

  // TODO this.attributes not updated; should reload but costly when not needed.
  // Maybe lazy reload? Could do same for client.

  return doc;
};

BaseModel.prototype.$$save = function() {
  this.$assertValid();
  return this.$save();
};

var noTransform = {transform: null};

App.extend(_support, {
  attrFind: function (id) {
    return this.docs.find(id, noTransform);
  },

  pushRpc: function(model, field) {
    return function(_id, value) {
      check(_id, String);

      var doc = model.docs.findOne(_id);
      AppVal.allowAccessIf(doc && doc.authorizePush);
      doc.authorizePush(this.userId, field, value, 'push');

      var update = {};
      update[field] = value;
      model.docs.update(_id, {$push: update});
    };
  },

  pullRpc: function(model, field) {
    return function(_id, value) {
      check(_id, String);

      var doc = model.docs.findOne(_id);
      AppVal.allowAccessIf(doc && doc.authorizePull);
      doc.authorizePull(this.userId, field, value, 'pull');

      var update = {};
      update[field] = value;
      model.docs.update(_id, {$pull: update});
    };
  },

  bumpVersion: function () {
    _support.performBumpVersion(this.constructor, this._id, this._version);
  },

  bumpVersionRpc: function (modelName) {
    return function (_id, _version) {
      check(_id, String);
      check(_version, Number);
      var model = AppModel[modelName],
          doc = model.findOne({_id: _id, _version: _version});

      if (!doc) return;

      AppVal.allowAccessIf(doc.authorizeVersionUpdate);
      doc.authorizeVersionUpdate(this.userId);

      _support.performBumpVersion(model, _id, _version);
    };
  },

  saveRpc: function(modelName) {
    return function(_id,changes) {
      check(_id, String);
      var model = AppModel[modelName],
          doc = model.docs.findOne(_id) || new model();

      doc.changes = changes;
      if (! doc._id) {
        doc.changes._id = _id;
        BaseModel._addUserIds(doc.attributes, model.userIds, this.userId);
      }
      AppVal.allowAccessIf(doc.authorize);
      doc.authorize(this.userId);
      doc.$assertValid();
      doc.$save();
    };
  },

  remote: function (name,func) {
    return function (/* arguments */) {
      AppVal.allowAccessIf(this.userId);
      return func.apply(this,arguments);
    };
  },
});
