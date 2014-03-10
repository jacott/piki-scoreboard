(function (test, v) {
  buster.testCase('packages/app-pages/test/client/button-menu:', {
    setUp: function () {
      test = this;
      v = {};
      Package['app-pages']._Test.ButtonMenu(Bart);
      v.menu = Bart.Test.ButtonMenu;
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
