define(function(require, exports, module) {

  return function (mig) {
    mig.createTable('TeamType', {
      org_id: {type: 'varchar(24)'},
      name: {type: 'text'},
    });

    mig.createTable('Team', {
      org_id: {type: 'varchar(24)'},
      teamType_id: {type: 'varchar(24)'},
      name: {type: 'text'},
      shortName: {type: 'text'},
    });
  };
});
