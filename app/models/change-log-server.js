define(function(require, exports, module) {
  var util = require('koru/util');
  var Model = require('model');
  var Random = require('koru/random');
  var env = require('koru/env');
  var User = require('./user');

  Model.prototype.$parentId = parentId;

  return function (model) {
    model.logChanges = logChanges;

    model.registerObserveField('parent');
    model.registerObserveField('model');

    model.create = function (attributes) {
      var now = util.newDate();
      Model._updateTimestamps(attributes, model.updateTimestamps, now);
      attributes._id = Random.id();
      Model._updateTimestamps(attributes, model.createTimestamps, now);
      model.docs.insert(attributes);
      return new model(attributes);
    };

    model.registerObserveModel = function (subject) {
      return;
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

    // FIXME model.docs._ensureIndex({createdAt: -1, parent_id: 1});

    function observeChanges(subject, aux, callback) {
      return; // FIXME
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
      var userId = env.userId();
      if (! userId) return;

      var params = {
        type: changes ? 'update' : 'create',
        model: subject.modelName,
        model_id: attributes._id,
        parent: subject._parent ? subject._parent.modelName : subject.modelName,
        parent_id: subject._parent ? new subject(attributes).$parentId() : attributes._id,
        user_id: userId,
        org_id: User.findById(userId).org_id,
      };


      if (changes) {
        var cl = new model(model.docs.findOne({$and: [params, {createdAt: {$gt: new Date(util.dateNow() - 10000)}}]}));
        var before = {};
        var count = 0;
        for(var key in changes) {
          ++count;
          if (key.match(/\./)) {
            var val = Model.lookupDottedValue(key, attributes);
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
        attributes = util.extend(util.extend({}, attributes), changes);
      } else {
        params.after = JSON.stringify(attributes);
      }

      aux && aux(params, attributes, changes);
      if (typeof params.aux === 'object')
        params.aux = JSON.stringify(params.aux);

      if (cl) {
        params.before = JSON.stringify(_.extend(before, JSON.parse(cl.before)));
        params.after = JSON.stringify(_.extend(JSON.parse(cl.after), changes));
        params.createdAt = util.newDate();
        var result = model.create(params);
        model.query.onId(cl._id).remove();
        return result;
      } else {
        return model.create(params);
      }
    }

    function logChanges(subject, options) {
      options = options || {};
      subject._parent = options.parent;
      subject._parentIdField = options.parent && (options.parentIdField || util.uncapitalize(options.parent.modelName)+'_id');

      observeChanges(subject, options.aux, options.callback);
    }

  };

  function parentId() {
    return this.constructor._parentIdField && this[this.constructor._parentIdField];
  }
});
