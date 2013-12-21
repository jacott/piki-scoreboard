(function (test) {
  buster.testCase('lib/client/ready:', {
    "test ready": function () {
      test = this;
      var stub;
      var handle = App.Ready.onReady(stub = test.stub());
      test.onEnd(function () {handle.stop()});

      App.Ready.notifyReady();

      assert.called(stub);
    },
  });
})();
