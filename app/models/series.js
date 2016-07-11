define(function(require, exports, module) {
  const {BaseModel} = require('model');
  const Org         = require('models/org');
  const TeamType    = require('models/team-type');

  class Series extends BaseModel {
    get displayName() {return this.name;}
  }
  module.exports = Series.define({
    module,
    fields: {
      name: {type:  'text', trim: true, required: true, maxLength: 200, unique: {scope: 'org_id'}},
      org_id: 'belongs_to',
      date: {type: 'text', inclusion: {matches: /^\d{4}-[01]\d-[0-3]\d$/}},
      closed: {type: 'boolean', boolean: 'trueOnly'},
      teamType_ids: 'has_many',
    },
  });

  require('koru/env!./series')(Series);

});
