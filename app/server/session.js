var sessions = {};

Meteor.publish("Session", function () {new Session(this)});

Session = function (sub) {
  var sess = this;
  if (sub._session.id  in sessions) {
    sessions[sub._session.id].sub.stop();
  }

  sess.sub = sub;
  var user = sub.userId ? AppModel.User.attrFind(sub.userId) : AppModel.User.guestUser();
  if (! user) {
    sub.error(new Meteor.Error(404, 'User not found'));
    return;
  }

  sess.user = user;
  var _models = sess._models = {};
  sess.userId = user._id;
  sess.observers = {};
  sub.onStop(sess.stop.bind(sess));
  sess.conn = sub._session;
  sessions[sess.conn.id] = sess;

  sess.added('User', sess.userId, user);
  sess.user = user = new AppModel.User(user);

  Session.notify(user.attributes, sess);

  sess.addObserver('User', AppModel.User.observeId(sess.userId, {
    changed: function (id, fields) {
      sess.changed('User', id, fields);
      Session.notify(fields, sess);
    },
    removed: function (id) {
      sub.stop();
    },
  }));

  if (user.org_id)
    sess.addObserver('Org', AppModel.Org.observeId(user.org_id, sess.buildUpdater('Org')));

  sub.ready();
};

Session._private = {};

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

App.extend(Session, {
  get: function (sub) {
    var result = sessions[sub._session.id];
    AppVal.allowAccessIf(result);
    return result;
  },
});


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
    if (old) old.stop();
    this.observers[name] = handle;
  },

  stop: function () {
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
        conn.sendRemoved(name, id);
      }
    }
  },

  added: function(name, id, fields) {
    if (! fields) return;
    var docs = this.docs(name);
    var doc = docs[id];
    if (doc) {
      this.conn.sendChanged(name, id, fields);
    } else {
      docs[id] = fields;
      AppModel[name].addMemDoc(fields);
      this.conn.sendAdded(name, id, fields);
    }
  },

  changed: function(name, id, fields) {
    var docs = this.docs(name);
    var doc = docs[id];
    if (doc) {
      this.conn.sendChanged(name, id, fields);
    } else {
      var model =  AppModel[name];
      doc = model.memFind(id);
      if (doc) {
        docs[id] = doc;
        model.addMemDoc(doc);
        this.conn.sendAdded(name, id, App.extend(App.extend({}, doc), fields));
      } else {
        doc = model.attrFind(id);
        if (doc) {
          docs[id] = doc;
          model.addMemDoc(doc);
          this.conn.sendAdded(name, id, doc);
        }
      }
    }
  },

  removed: function(name, id) {
    var docs = this.docs(name);
    var doc = docs[id];
    if (doc) {
      delete docs[id];
      AppModel[name].delMemDoc(id);
      this.conn.sendRemoved(name, id);
    }
  },

  buildUpdater: function (name, options) {
    var sess = this;
    return App.extend({
      added: function (id, fields) {
        sess.added(name, id, fields);
      },
      changed: function (id, fields) {
        sess.changed(name, id, fields);
      },
      removed: function (id) {
        sess.removed(name, id);
      }
    }, options || {});
  },
};

App.loaded('Session', Session);
