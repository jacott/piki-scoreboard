define(function(require, exports, module) {
  var publish = require('koru/session/publish');
  var env = require('koru/env');
  var Org = require('models/org');

  env.onunload(module, function () {
    publish._destroy('Org');
  });

  publish('Org', function (shortName) {
    var sub = this;

    var org = Org.findByField('shortName', shortName);
    if (! org) return sub.error(new env.Error(404, 'org not found'));

    sub.match('User', function (doc) {
      return org._id === doc.org_id;
    });
  });
});
