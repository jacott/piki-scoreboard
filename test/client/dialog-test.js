(function (test, v) {
  buster.testCase('client/dialog:', {
    setUp: function () {
      test = this;
      v = {};
    },

    tearDown: function () {
      v = null;
    },

    "test open": function () {
      Bart.Dialog.open(Bart.html('<form id="Foo"></form>'));
      assert.select('.Dialog>div', function () {
        assert.select('form#Foo');
      });
    },
  });
})();
