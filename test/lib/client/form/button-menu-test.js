(function (test, v) {
  buster.testCase('lib/client/form/button-menu:', {
    setUp: function () {
      test = this;
      v = {};
      _BartTest_form_test_button_menu(Bart);
      v.menu = Bart.Test.Form.TestButtonMenu;
    },

    tearDown: function () {
      delete Bart.Test;
      v = null;
    },

    "test rendering": function () {
      document.body.appendChild(v.menu.$autoRender({}));

      assert.dom('#TestButtonMenu', function () {
        assert.dom('#FooMenu.buttonMenu', function () {
          assert.dom('>button[name=foo]+button[name=dropMenu]');
        });
      });
    },

    "test dropMenu": function () {
      document.body.appendChild(v.menu.$autoRender({}));

      assert.dom('#FooMenu.buttonMenu', function () {
        TH.trigger('[name=dropMenu]', 'click');
        assert.dom('div.dropMenu', function () {
          assert.dom('button[name=bar]');
        });
      });
    },
  });
})();
