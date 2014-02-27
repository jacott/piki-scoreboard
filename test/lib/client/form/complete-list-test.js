(function (test, v) {
  buster.testCase('lib/client/form/complete-list:', {
    setUp: function () {
      test = this;
      v = {};
      _BartTest_form_complete_list_test(Bart);
      v.CompleteList = Bart.Test.Form.CompleteList;
    },

    tearDown: function () {
      v = null;
    },

    "test rendering": function () {
      assert.dom(v.CompleteList.$autoRender({}), function () {
        assert.dom('[name=name]', function () {
          Bart.Form.completeList({input: this, completeList: [{name: 'abc'}, {name: 'def'}]});
        });
        assert.dom('[name=name]+ul.complete', function () {
          assert.dom('li.selected', 'abc');
          assert.dom('li', 'def');
        });
        assert.dom('[name=name]', function () {
          Bart.Form.completeList({input: this, completeList: [{name: 'foo'}]});
        });
        refute.dom('li', 'abc');
        assert.dom('[name=name]+ul.complete', function () {
          assert.dom('li', 'foo');
        });

        assert.dom('[name=name]', function () {
          Bart.Form.completeList({input: this});
        });
        refute.dom('.complete');
      });
    },

    "callback": {
      setUp: function () {
        document.body.appendChild(v.CompleteList.$autoRender({}));
        assert.dom('[name=name]', function () {
          Bart.Form.completeList({input: this,  completeList: v.list = [{name: 'abc'}, {name: 'def'}], callback: v.callback = test.stub()});
        });

        v.inp = document.querySelector('[name=name]');
      },

      "test clicking": function () {
        assert.dom('li', 'abc', function () {
          TH.trigger(this, 'mousedown');
        });

        refute.dom('.complete');

        assert.calledWith(v.callback, v.list[0]);

        assert.dom('[name=name]', {value: ''}, function () {
          Bart.Form.completeList({input: this,  completeList: v.list = [{name: 'abc'}, {name: 'def'}]});
        });
        assert.dom('li', 'abc', function () {
          TH.trigger(this, 'mousedown');
        });
        assert.dom('[name=name]', {value: 'abc'});
      },

      "test enter no select": function () {
        TH.trigger(v.inp, 'keydown', {which: 65});
        assert.dom('.complete');

        var inpCallback = test.stub();
        v.inp.addEventListener('keydown', inpCallback);
        test.onEnd(function () {
          v.inp.removeEventListener('keydown', inpCallback);
        });

        TH.trigger(v.inp, 'keydown', {which: 13});

        refute.dom('.complete');

        assert.calledWith(v.callback, v.list[0]);

        refute.called(inpCallback);
      },

      "test enter after select": function () {
        TH.trigger(v.inp, 'keydown', {which: 40}); // down
        TH.trigger(v.inp, 'keydown', {which: 13});

        refute.dom('.complete');

        assert.calledWith(v.callback, v.list[1]);
      },

      "test up/down arrow": function () {
        assert.dom('.complete', function () {
          assert.dom('li.selected', 'abc');
          TH.trigger(v.inp, 'keydown', {which: 40}); // down
          assert.dom('li.selected', 'def');

          TH.trigger(v.inp, 'keydown', {which: 38}); // up
          assert.dom('li.selected', 'abc');
        });

      },
    },

    "test blur": function () {
      document.body.appendChild(v.CompleteList.$autoRender({}));
      assert.dom('[name=name]', function () {
        Bart.Form.completeList({input: this,  completeList: [{name: 'abc'}, {name: 'def'}]});
        TH.trigger(this, 'blur');
      });
      refute.dom('ul');
    },
  });
})();
