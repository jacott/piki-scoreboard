(function (test, v) {
  buster.testCase('lib/client/form:', {
    setUp: function () {
      test = this;
      v = {};
      _BartTest_form_form_test(Bart);
      v.selectList = Bart.Test.Form.TestSelect;
    },

    tearDown: function () {
      v = null;
    },

    "test selectList": function () {
      v.selectList.$helpers({
        fooList: function () {
          return [["1", "item 1"], ["2", "item 2"]];
        },
      });

      var doc = {
        foo_id: "2",
      };

      document.body.appendChild(v.selectList.$autoRender(doc));

      assert.dom("label", function () {
        assert.dom('select#fooId[name=foo_id]', function () {
          assert.domParent('.name', 'Foo');
          assert.dom('option', {value: "1", text: "item 1"});
          assert.dom('option[selected=selected]', {value: "2", text: "item 2"});
        });
      });
    },
  });
})();
