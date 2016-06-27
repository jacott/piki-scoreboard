define(function(require, exports, module) {

  return function (mig) {
    mig.createTable('TeamType', {
      org_id: {type: 'varchar(24)'},
      name: {type: 'text'},
    });
  };
});
