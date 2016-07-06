define(function(require, exports, module) {
  const Random = require('koru/random');

  return function (mig) {
    mig.createTable('Series', {
      org_id: {type: 'varchar(24)'},
      name: {type: 'text'},
      date: {type: 'text'},
      teamType_ids: {type: 'varchar(24)[]'},
      closed: {type: 'boolean'},
    });
  };
});
