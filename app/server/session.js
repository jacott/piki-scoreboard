var sessions = {};

Meteor.publish("Session", function () {
  var sess = Session.get(this);

  this.onStop(function () {
    sess.release();
  });

  this.ready();
});

Session = function(sub) {
  var sess = this;

  sess._count = 0;
  sess.sub = sub;
  sess.user = sub.userId ? AppModel.User.attrFind(sub.userId) : AppModel.User.guestUser().attributes;

  if (! sess.user) {
    var error = new Meteor.Error(403, "Access denied");
    sub.error(error);
    throw error;
  }

  var _models = sess._models = {};
  sess.userId = sub.userId;
  sess.observers = {};
  sess.conn = sub._session;
  sessions[sess.conn.id] = sess;

  sess.added('User', sess.user._id, sess.user);
  sess.user = new AppModel.User(sess.user);

  Session.notify({"on.start": true}, sess);
  Session.notify(sess.user.attributes, sess);

  sess.addObserver('User', AppModel.User.observeId(sess.userId, {
    changed: function (id, fields) {
      sess.changed('User', id, fields);
      Session.notify(fields, sess);
    },
    removed: function (id) {
      sub.stop();
    },
  }));
};

Session._private = {
  get: function (sub) {
    return sessions[sub._session.id];
  }
};

(function () {
  var observers = {};

  Session._private.observers = function () {
    return observers;
  };

  Session.notify = function (fields, sess) {
    for(var field in fields) {
      var fieldOb = observers[field];
      if (fieldOb) {
        var value = fields[field];
        for(var key in fieldOb) {
          fieldOb[key](sess, value);
        }
      }
    }
  };

  Session.observe = function (field, key, callback) {
    var fieldOb = observers[field] || (observers[field] = {});
    if (key in fieldOb) throw new Error('Duplicate observe key! '+key);
    fieldOb[key] = callback;
    return stopFunc(fieldOb, key);
  };

  function stopFunc(fieldOb, key) {
    return {
      stop: function () {
        delete fieldOb[key];
      }
    };
  }
})();

Session.get = function (sub) {
  var sess = sessions[sub._session.id] || new Session(sub);
  ++sess._count;
  return sess;
};


Session.prototype = {
  constructor: Session,

  docs: function (name) {
    var _models= this._models;
    return _models[name] || (_models[name] = {});
  },

  doc: function (name, id) {
    return this.docs(name)[id];
  },

  hasDoc: function(name, id) {
    return id in this.docs(name);
  },

  addObserver: function (name, handle) {
    var old = this.observers[name];
    this.observers[name] = handle;
    if (old) old.stop();
  },

  removeObserver: function () {
    if (! this.observers) return;
    var observers = this.observers;
    for(var i = 0; i < arguments.length; ++i) {
      var name = arguments[i];
      var ob = observers[name];
      delete observers[name];
      ob && ob.stop();
    }
  },

  release: function () {
    if (--this._count !== 0) return;
    var obs = this.observers;
    if (! obs) return;
    this.observers = null;

    delete sessions[this.conn.id];

    for(var key in obs) {
      var handle = obs[key];
      handle && handle.stop();
    }

    var _models = this._models;
    this._models = {};

    var conn = this.conn;
    for(var name in _models) {
      var docs = _models[name];
      var delMemDoc = AppModel[name].delMemDoc;
      for(var id in docs) {
        delMemDoc(id);
        conn.send({msg: 'removed', collection: name, id: id});
      }
    }
  },

  added: function(name, id, fields, filter) {
    if (! (this.observers && fields)) return;
    var docs = this.docs(name);
    var doc = docs[id];
    var send = filter ? filterFields(fields, filter) : fields;
    if (doc) {
      if ('_id' in send) {
        if (send === fields) send = App.extend({}, send); // copy
        delete send._id;
      }
    } else {
      docs[id] = fields;
      AppModel[name].addMemDoc(fields);
    }
    this.conn.send({msg: doc ? 'changed' : 'added', collection: name, id: id, fields: send});
  },

  changed: function(name, id, fields, filter) {
    if (! this.observers) return;
    var docs = this.docs(name);
    var doc = docs[id];
    fields = filter ? filterFields(fields, filter) : fields;
    if (doc) {
      this.conn.send({msg: 'changed', collection: name, id: id, fields: fields});
    } else {
      var model =  AppModel[name];
      doc = model.memFind(id);
      if (doc) {
        docs[id] = doc;
        model.addMemDoc(doc);
          this.conn.send({msg: 'added', collection: name, id: id,
                          fields: App.extend(App.extend({}, doc), fields)});
      } else {
        doc = model.attrFind(id);
        if (doc) {
          docs[id] = doc;
          model.addMemDoc(doc);
          this.conn.send({msg: 'added', collection: name, id: id, fields: doc});
        }
      }
    }
  },

  removed: function(name, id) {
    if (! this.observers) return;
    var docs = this.docs(name);
    if (id in docs) {
      delete docs[id];
      AppModel[name].delMemDoc(id);
      this.conn.send({msg: 'removed', collection: name, id: id});
    }
  },

  buildUpdater: function (name, options) {
    var sess = this;
    options = options || {};
    var filter = options.fields;
    return App.extend({
      added: function (id, fields) {
        sess.added(name, id, fields, filter);
      },
      changed: function (id, fields) {
        sess.changed(name, id, fields, filter);
      },
      removed: function (id) {
        sess.removed(name, id);
      }
    }, options);
  },
};

App.loaded('Session', Session);

function filterFields(fields, filter) {
  var res = {};
  for(var i = 0; i < filter.length; ++i) {
    var f = filter[i];
    if (f in fields) {
      res[f] = fields[f];
    }
  }
  return res;
}
