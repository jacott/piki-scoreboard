define((require, exports, module)=>{
  const Model           = require('model');

  class ChangeLog extends Model.BaseModel {
    get parentSubject () {
      const pm = Model[this.parent];
      return new pm(pm.attrFind(this.parent_id));
    }
  }

  ChangeLog.define({module, fields: {
    createdAt: 'auto_timestamp',
    model: 'text',
    model_id: 'id',
    parent: 'text',
    parent_id: 'id',
    type: 'text',
    before: 'text',
    after: 'text',
    aux: 'text',
  }});

  // Handle circular dependency
  require(['./user', './org'], ()=>{
    ChangeLog.defineFields({
      user_id: 'belongs_to',
      org_id: 'belongs_to',
    });
  });

  require('koru/env!./change-log')(ChangeLog);

  return ChangeLog;
});
