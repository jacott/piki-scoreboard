(function (test, v) {
  buster.testCase('client/dialog:', {
    setUp: function () {
      test = this;
      v = {};
    },

    tearDown: function () {
      v = null;
    },

    "test open and close": function () {
      Bart.Dialog.open(Bart.html('<form id="Foo"></form>'));
      assert.dom('.Dialog>div', function () {
        assert.dom('form#Foo');
      });

      Bart.Dialog.close();

      refute.dom('.Dialog');
    },
  });
})();
