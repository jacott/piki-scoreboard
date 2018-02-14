define(function(require, exports, module) {

  module.exports = mig =>{
    mig.addColumns("Event", "ruleVersion:smallint default 0");
  };
});
