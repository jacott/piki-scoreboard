var Fiber = Npm.require('fibers');

App.require('AppModel.ChangeLog', function (model) {
  AppModel.Base.prototype.$parentId = parentId;

  model.logChanges = logChanges;

  model.registerObserveField('parent');
  model.registerObserveField('model');

  model.create = function (attributes) {
    var now = App.newDate();
    AppModel.Base._updateTimestamps(attributes, model.updateTimestamps, now);
    attributes._id = Random.id();
    AppModel.Base._updateTimestamps(attributes, model.createTimestamps, now);
    model.docs.insert(attributes);
    return new model(attributes);
  };

  model.registerObserveModel = function (subject) {
    if (subject.observeChangeLog) throw new Error('registerObserveModel already called for ' + subject.modelName);
    var observers = {};
    var key = 0;
    var clParentObserver, clModelObserver;

    subject.observeChangeLog = function(ids, callbacks) {
      clParentObserver || initClObserver();

      return stopObservers(ids.map(function (id) {
        return observeId(id, callbacks);
      }), callbacks);


      function observeId(id, callbacks) {
        var obs = observers[id] || (observers[id] = {});
        obs[++key] = callbacks;
        return stopObserver(id, obs, key, callbacks);
      };

      function stopObserver(id, obs, key, callbacks) {
        return {
          stop: function() {
            delete obs[key];
            callbacks.removed && callbacks.removed(id);
            for(key in obs) return;
            delete observers[id];
            for(key in observers) return;
            clParentObserver && (clParentObserver.stop(), clModelObserver.stop());
            clParentObserver = clModelObserver = null;
          },

          id: id
        };
      }

      function stopObservers(obs, callbacks) {
        return {
          stop: function() {
            for(var i = 0; i < obs.length; ++i) {
              obs[i].stop();
            }
          },

          replaceIds: function (newIds) {
            var set = {};
            for(var i=0;i < obs.length;++i) {
              var ob = obs[i];
              set[ob.id]=ob;
            }

            obs = [];
            var newObs = [];
            for(var i=0;i < newIds.length;++i) {
              var newId = newIds[i];
              if (newId in set) {
                obs.push(set[newId]);
                delete set[newId];
              } else {
                newObs.push(newId);
                obs.push(observeId(newId, callbacks));
              }
            }
            for(var key in set) {
              set[key].stop();
              callbacks.removed && callbacks.removed(key);
            }
            return newObs;
          },
        };
      }
    };

    function initClObserver() {
      var modelName = subject.modelName;
      clParentObserver = model.observeParent(modelName, {
        added: function (id, attrs) {
          if (attrs.parent_id in observers) {
            var cbs = observers[attrs.parent_id];
            for(var i in cbs) {
              var cb = cbs[i];
              cb && cb.added && cb.added(id, attrs);
            }
          }
        },
      });
      clModelObserver = model.observeModel(modelName, {
        added: function (id, attrs) {
          if (attrs.parent !== modelName && attrs.model_id in observers) {
            var cbs = observers[attrs.model_id];
            for(var i in cbs) {
              var cb = cbs[i];
              cb && cb.added && cb.added(id, attrs);
            }
          }
        },
      });
    }
  };

  model.docs._ensureIndex({createdAt: -1, parent_id: 1});

  App.loaded('models/server/change-log', model);
});

function observeChanges(subject, aux, callback) {
  subject.afterCreate(function (doc) {
    var cl = createChangeLog(subject, aux, doc.attributes);
    cl && callback && callback(doc, cl);
  });

  subject.afterUpdate(function (doc) {
    var cl = createChangeLog(subject, aux, doc.attributes, doc.changes);
    cl && callback && callback(doc, cl);
  });
}

function createChangeLog(subject, aux, attributes, changes) {
  if (! Fiber.current) return;

  var userId = App.userId();
  if (! userId) return;

  var params = {
    type: changes ? 'update' : 'create',
    model: subject.modelName,
    model_id: attributes._id,
    parent: subject._parent ? subject._parent.modelName : subject.modelName,
    parent_id: subject._parent ? new subject(attributes).$parentId() : attributes._id,
    user_id: userId,
    org_id: AppModel.User.findById(userId).org_id,
  };


  if (changes) {
    var cl = AppModel.ChangeLog.findOne({$and: [params, {createdAt: {$gt: new Date(App.dateNow() - 10000)}}]}, {transform: null});
    var before = {};
    var count = 0;
    for(var key in changes) {
      ++count;
      if (key.match(/\./)) {
        var val = AppModel.lookupDottedValue(key, attributes);
      } else {
        var val = attributes[key];
      }
      if (val !== undefined)
        before[key] = val;
    }
    if (count === 0) return;
    if (! cl) {
      params.before = JSON.stringify(before);
      params.after = JSON.stringify(changes);
    }
    attributes = _.extend({}, attributes, changes);
  } else {
    params.after = JSON.stringify(attributes);
  }

  aux && aux(params, attributes, changes);
  if (typeof params.aux === 'object')
    params.aux = JSON.stringify(params.aux);

  if (cl) {
    params.before = JSON.stringify(_.extend(before, JSON.parse(cl.before)));
    params.after = JSON.stringify(_.extend(JSON.parse(cl.after), changes));
    params.createdAt = App.newDate();
    var result = AppModel.ChangeLog.create(params);
    AppModel.ChangeLog.docs.remove(cl._id);
    return result;
  } else {
    return AppModel.ChangeLog.create(params);
  }
}

function parentId() {
  return this.constructor._parentIdField && this[this.constructor._parentIdField];
}

function logChanges(subject, options) {
  options = options || {};
  subject._parent = options.parent;
  subject._parentIdField = options.parent && (options.parentIdField || Apputil.uncapitalize(options.parent.modelName)+'_id');

  observeChanges(subject, options.aux, options.callback);
}
