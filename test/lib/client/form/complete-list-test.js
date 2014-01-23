(function (test, v) {
  buster.testCase('lib/client/form/complete-list:', {
    setUp: function () {
      test = this;
      v = {};
      _BartTest_form_complete_list_test(Bart);
      v.List = Bart.Test.Form.CompleteList;
    },

    tearDown: function () {
      v = null;
    },

    "test typing": function () {
      v.List.$events({
        'input [name=name]': function (event) {


        },
      });
      assert.dom(v.List.$autoRender({}), function () {
        assert.dom('[name=name]', function () {
          Bart.Form.completeList(this, [{name: 'abc'}, {name: 'def'}]);
        });
        assert.dom('[name=name]+ul.complete', function () {
          assert.dom('li', 'abc');
        });
      });
    },
  });
})();
