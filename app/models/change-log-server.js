define(function(require, exports, module) {
  var util = require('koru/util');
  var Model = require('model');
  var Random = require('koru/random');
  var koru = require('koru');
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

    koru.Fiber(function () {
      model.addIndex('createdAt', -1, 'parent_id');
    }).run();

    function observeChanges(subject, aux, callback) {
      subject.onChange(function (doc, was) {
        var userId = koru.userId();
        if (! userId) return;

        var sub = doc || was;
        var params = {
          model: subject.modelName,
          model_id: sub.attributes._id,
          parent: subject._parent ? subject._parent.modelName : subject.modelName,
          parent_id: subject._parent ? sub.$parentId() : sub.attributes._id,
          user_id: userId,
          org_id: User.findById(userId).org_id,
        };
        if (! doc) {
          params.type= 'remove';
          params.before = JSON.stringify(was.attributes);
          var cl = model.create(params);
        } else {
          var cl = createChangeLog(params, subject, aux, doc, was);
        }
        callback && callback(cl, doc, was);
      });
    }

    function createChangeLog(params, subject, aux, doc, was) {
      var attributes = doc.attributes;

      params.type = was ? 'update' : 'create';

      if (was) {
        var after = {};
        var count = 0;
        for(var key in was) {
          ++count;
          if (key.match(/\./)) {
            var val = util.lookupDottedValue(key, attributes);
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
