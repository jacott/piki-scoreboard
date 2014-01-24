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

    "test rendering": function () {
      assert.dom(v.List.$autoRender({}), function () {
        assert.dom('[name=name]', function () {
          Bart.Form.completeList(this, [{name: 'abc'}, {name: 'def'}]);
        });
        assert.dom('[name=name]+ul.complete', function () {
          assert.dom('li', 'abc');
          assert.dom('li', 'def');
        });
        assert.dom('[name=name]', function () {
          Bart.Form.completeList(this, [{name: 'foo'}]);
        });
        refute.dom('li', 'abc');
        assert.dom('[name=name]+ul.complete', function () {
          assert.dom('li', 'foo');
        });

        assert.dom('[name=name]', function () {
          Bart.Form.completeList(this);
        });
        refute.dom('.complete');
      });
    },

    "callback": {
      setUp: function () {
        document.body.appendChild(v.List.$autoRender({}));
        assert.dom('[name=name]', function () {
          Bart.Form.completeList(this, [v.result = {name: 'abc'}, {name: 'def'}], v.callback = test.stub());
        });
      },

      "test clicking": function () {
        assert.dom('li', 'abc', function () {
          TH.trigger(this, 'mousedown');
        });
        assert.dom('[name=name]', {value: 'abc'});
        refute.dom('.complete');

        assert.calledWith(v.callback, v.result);
      },

      "test enter": function () {
        TH.trigger('[name=name]', 'keydown', {whiich: 13});
        assert.dom('[name=name]', {value: 'abc'});
        refute.dom('.complete');

        assert.calledWith(v.callback, v.result);
      },
    },

    "test blur": function () {
      document.body.appendChild(v.List.$autoRender({}));
      assert.dom('[name=name]', function () {
        Bart.Form.completeList(this, [{name: 'abc'}, {name: 'def'}]);
        TH.trigger(this, 'blur');
      });
      refute.dom('ul');
    },
  });
})();
