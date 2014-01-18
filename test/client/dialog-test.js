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

    'test confirmDialog': function () {
      var data = {
        classes: 'small',
        content: {
          $render: function () {
            return Bart.html('<h1>This is the message</h1>');
          },
        },
        okay: 'Foo',
        callback: function (result) {
          assert.same(this, data);
          v.result = result;
        }
      };
      Bart.Dialog.confirm(data);

      assert.dom('.Dialog.Confirm .dialogContainer .ui-dialog.small', function () {
        assert.dom('h1', 'This is the message');
        assert.dom('fieldset', function () {
          assert.dom('button#okay[name=okay]', 'Foo', function () {
            TH.click(this);
          });
        });
      });
      refute.dom('#confirmWin');
      assert.isTrue(v.result);
    },

    'test cancel confirmDialog with defaults ': function () {
      var data = {
        content: '<span>bla</span>',
        callback: function(value) {
          v.result = value;
        }
      };

      Bart.Dialog.confirm(data);

      assert.dom('.Dialog.Confirm .dialogContainer .ui-dialog', function () {
        assert.dom('span', 'bla');
        assert.dom('fieldset', function () {
          assert.dom('button#cancel[name=cancel]', 'Cancel', function () {
            TH.click(this);
          });
        });
      });
      refute.dom('#confirmWin');
      assert.isFalse(v.result);
    },
  });
})();
