define(function (require, exports, module) {
  var test, v;
  var TH = require('./test-helper');
  require('./publish-self');
  var publish = require('koru/session/publish');

  TH.testCase(module, {
    setUp: function () {
      test = this;
      v = {};
      v.sub = TH.mockClientSub();
    },

    tearDown: function () {
      v = null;
    },

    "test publish": function () {
      var sut = publish._pubs.Self;
      var matchUser = v.sub.match.withArgs('User', TH.match.func);
      var matchOrg = v.sub.match.withArgs('Org', TH.match.func);

      sut.call(v.sub, 'o1');

      assert.calledOnce(matchUser);
      assert.calledOnce(matchOrg);

      var mu = matchUser.args[0][1];
      var mo = matchOrg.args[0][1];

      v.sub.userId = 'ufoo';

      assert.isTrue(mu({_id: 'ufoo'}));
      assert.isFalse(mu({_id: 'xfoo'}));

      assert.isTrue(mo());
    },
  });
});
