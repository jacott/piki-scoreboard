(function (test, v) {
  buster.testCase('client/disconnected:', {
    setUp: function () {
      test = this;
      v = {};
    },

    tearDown: function () {
      v = null;
    },

    "test try now": function () {
      test.stub(Meteor, 'reconnect');

      document.body.appendChild(Bart.Disconnected.$autoRender({}));

      TH.click('#Disconnected [name=connect]');

      assert.called(Meteor.reconnect);
    },
  });
})();
