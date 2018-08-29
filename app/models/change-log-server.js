define(function(require, exports, module) {
  const koru            = require('koru');
  const Random          = require('koru/random');
  const util            = require('koru/util');
  const Model           = require('model');
  const User            = require('./user');

  return model =>{
    Model.BaseModel.prototype.$parentId = function () {
      return this.constructor._parentIdField && this[this.constructor._parentIdField];
    };

    util.merge(model, {
      logChanges(subject, options) {
        options = options || {};
        subject._parent = options.parent;
        subject._parentIdField = options.parent && (options.parentIdField || util.uncapitalize(options.parent.modelName)+'_id');

        observeChanges(subject, options.aux, options.callback);
      },

      create(attributes) {
        var now = util.newDate();
        Model._support._updateTimestamps(attributes, model.updateTimestamps, now);
        attributes._id = Random.id();
        Model._support._updateTimestamps(attributes, model.createTimestamps, now);
        model.docs.insert(attributes);
        return new model(attributes);
      },
    });

    koru.runFiber(()=>{model.addIndex('createdAt', -1, 'parent_id')});

    function observeChanges(subject, aux, callback) {
      subject.onChange((doc, undo)=>{
        const userId = koru.userId();
        if (userId == null) return;
        const user = User.findById(userId);
        if (user === undefined) return;

        const sub = doc || undo;
        const params = {
          model: subject.modelName,
          model_id: sub.attributes._id,
          parent: subject._parent ? subject._parent.modelName : subject.modelName,
          parent_id: subject._parent ? sub.$parentId() : sub.attributes._id,
          user_id: userId,
          org_id: sub.org_id,
        };
        if (! doc) {
          params.type= 'remove';
          params.before = JSON.stringify(undo.attributes);
          var cl = model.create(params);
        } else {
          var cl = createChangeLog(params, subject, aux, doc, undo);
        }
        callback && callback(cl, doc, undo);
      });
    }

    function createChangeLog(params, subject, aux, doc, was) {
      const {attributes} = doc;

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
});
