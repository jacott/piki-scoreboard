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

    const observeChanges = (subject, callback)=>{
      subject.afterLocalChange(dc =>{
        const userId = koru.userId();
        if (userId == null) return;
        const user = User.findById(userId);
        if (user === undefined) return;

        const {doc, _id} = dc;
        const params = {
          model: subject.modelName,
          model_id: _id,
          parent: subject._parent ? subject._parent.modelName : subject.modelName,
          parent_id: subject._parent ? doc.$parentId() : _id,
          user_id: userId,
          org_id: doc.org_id,
        };
        let cl;
        if (dc.isDelete) {
          params.type= 'remove';
          params.before = JSON.stringify(doc.attributes);
          cl = ChangeLog.create(params);
        } else {
          cl = createChangeLog(params, subject, dc);
        }
        callback && callback(cl, doc, dc.undo);
      });
    };

    const createChangeLog = (params, subject, dc)=>{
      const {doc} = dc, {attributes} = doc;

      params.type = dc.isChange ? 'update' : 'create';

      if (dc.isChange) {
        const after = dc.changes;

        for (const _ in after) {
          params.before = JSON.stringify(dc.was.changes);
          params.after = JSON.stringify(after);
          break;
        }
      } else {
        params.after = JSON.stringify(attributes);
      }

      if (typeof params.aux === 'object')
        params.aux = JSON.stringify(params.aux);

      return ChangeLog.create(params);
    };

    util.merge(ChangeLog, {
      logChanges(subject, options={}) {
        subject._parent = options.parent;
        subject._parentIdField = options.parent && (options.parentIdField || util.uncapitalize(options.parent.modelName)+'_id');

        observeChanges(subject, options.callback);
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
