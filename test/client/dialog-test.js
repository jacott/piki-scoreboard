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
      assert.dom('.Dialog>div', function () {
        assert.dom('form#Foo');
      });
    },
  });
})();
