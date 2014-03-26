(function (test, v) {
  buster.testCase('packages/app-pages/test/client/dialog:', {
    setUp: function () {
      test = this;
      v = {};
    },

    tearDown: function () {
      v = null;
    },

    "test open / close": function () {
      Bart.Dialog.open(Bart.html('<form id="Foo"></form>'));
      assert.dom('.Dialog', function () {
        assert.dom('form#Foo');
      });

      assert.isTrue(Bart.Dialog.isOpen());

      Bart.Dialog.open(Bart.html('<div id="Nested"></div>'));

      assert.dom('#Nested');

      assert.isTrue(Bart.Dialog.isOpen());

      Bart.Dialog.close();

      refute.dom('#Nested');

      assert.isTrue(Bart.Dialog.isOpen());

      Bart.Dialog.close('Foo');

      refute.dom('.Dialog');

      assert.isFalse(Bart.Dialog.isOpen());
    },

    "test full wrapping": function () {
      Bart.Dialog.open(Bart.html('<div id="foo">Foo!!</div>'));

      assert.dom('.Dialog', function () {
        assert.dom('>.dialogContainer>.ui-dialog>#foo', 'Foo!!');
      });
    },

    "test partial wrapping": function () {
      Bart.Dialog.open(Bart.html('<div id="foo" class="ui-dialog">Foo!!</div>'));

      assert.dom('.Dialog', function () {
        assert.dom('>.dialogContainer>#foo.ui-dialog', 'Foo!!');
      });
    },

    'test confirmDialog': function () {
      var data = {
        classes: 'small',
        content: {
          $autoRender: function (arg) {
            v.data = arg;
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

      assert.same(v.data, data);

      assert.dom('.Dialog.Confirm .dialogContainer .ui-dialog.small', function () {
        assert.dom('h1', 'This is the message');
        assert.dom('fieldset', function () {
          assert.dom('button#okay[name=okay]', 'Foo', function () {
            TH.click(this);
          });
        });
      });
      refute.dom('.Dialog');
      assert.isTrue(v.result);
    },

    "test modalize": function () {
      Bart.Dialog.open(Bart.html('<form id="Foo"></form>'));

      assert.dom('.Dialog', function () {
        TH.trigger(this, 'keyup', {which: 27});
      });

      refute.dom('.Dialog');
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
      refute.dom('.Dialog');
      assert.isFalse(v.result);
    },
  });
})();
