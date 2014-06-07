define(function(require, exports, module) {
  var util = require('koru/util');
  var Model = require('model');
  var Random = require('koru/random');
  var env = require('koru/env');
  var User = require('./user');

  Model.prototype.$parentId = parentId;

  return function (model) {
    util.extend(model, {
      logChanges: function (subject, options) {
        options = options || {};
        subject._parent = options.parent;
        subject._parentIdField = options.parent && (options.parentIdField || util.uncapitalize(options.parent.modelName)+'_id');

        observeChanges(subject, options.aux, options.callback);
      },

      create: function (attributes) {
        var now = util.newDate();
        Model._updateTimestamps(attributes, model.updateTimestamps, now);
        attributes._id = Random.id();
        Model._updateTimestamps(attributes, model.createTimestamps, now);
        model.docs.insert(attributes);
        return new model(attributes);
      },
    });

    // FIXME model.docs._ensureIndex({createdAt: -1, parent_id: 1});

    function observeChanges(subject, aux, callback) {
      subject.onChange(function (doc, was) {
        if (! doc) {
          // FIXME remove all change logs
        } else {
          var cl = createChangeLog(subject, aux, doc, was);
          cl && callback && callback(cl, doc, was);
        }
      });
    }

    function createChangeLog(subject, aux, doc, was) {
      var userId = env.userId();
      if (! userId) return;

      var attributes = doc.attributes;

      var params = {
        type: was ? 'update' : 'create',
        model: subject.modelName,
        model_id: attributes._id,
        parent: subject._parent ? subject._parent.modelName : subject.modelName,
        parent_id: subject._parent ? doc.$parentId() : attributes._id,
        user_id: userId,
        org_id: User.findById(userId).org_id,
      };


      if (was) {
        var after = {};
        var count = 0;
        for(var key in was) {
          ++count;
          if (key.match(/\./)) {
            var val = Model.lookupDottedValue(key, attributes);
          } else {
            var val = attributes[key];
          }

          if (val !== undefined)
            after[key] = val;
        }
        if (count === 0) return;

        params.before = JSON.stringify(was);
        params.after = JSON.stringify(after);
      } else {
        params.after = JSON.stringify(attributes);
      }

      aux && aux(params, doc, was);
      if (typeof params.aux === 'object')
        params.aux = JSON.stringify(params.aux);

      return model.create(params);
    }

  };

  function parentId() {
    return this.constructor._parentIdField && this[this.constructor._parentIdField];
  }
});
