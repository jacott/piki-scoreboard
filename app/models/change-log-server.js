define((require, exports, module)=>{
  const koru            = require('koru');
  const Random          = require('koru/random');
  const util            = require('koru/util');
  const Model           = require('model');
  const User            = require('./user');

  return ChangeLog =>{
    Model.BaseModel.prototype.$parentId = function () {
      return this.constructor._parentIdField && this[this.constructor._parentIdField];
    };

    const observeChanges = (subject, aux, callback)=>{
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
        let cl;
        if (! doc) {
          params.type= 'remove';
          params.before = JSON.stringify(undo.attributes);
          cl = ChangeLog.create(params);
        } else {
          cl = createChangeLog(params, subject, aux, doc, undo);
        }
        callback && callback(cl, doc, undo);
      });
    };

    const createChangeLog = (params, subject, aux, doc, was)=>{
      const {attributes} = doc;

      params.type = was ? 'update' : 'create';

      if (was) {
        const after = {};
        let count = 0;
        for(const key in was) {
          ++count;
          const val = key.match(/\./)
                ? util.lookupDottedValue(key, attributes) :  attributes[key];

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

      return ChangeLog.create(params);
    };

    util.merge(ChangeLog, {
      logChanges(subject, options) {
        options = options || {};
        subject._parent = options.parent;
        subject._parentIdField = options.parent && (options.parentIdField || util.uncapitalize(options.parent.modelName)+'_id');

        observeChanges(subject, options.aux, options.callback);
      },

      create(attributes) {
        const now = util.newDate();
        Model._support._updateTimestamps(attributes, ChangeLog.updateTimestamps, now);
        attributes._id = Random.id();
        Model._support._updateTimestamps(attributes, ChangeLog.createTimestamps, now);
        ChangeLog.docs.insert(attributes);
        return new ChangeLog(attributes);
      },
    });
  };
});
