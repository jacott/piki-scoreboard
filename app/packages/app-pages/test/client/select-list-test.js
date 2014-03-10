(function (test, v) {
  var SelectList = Bart.Form.SelectList;

  buster.testCase('packages/app-pages/test/client/select-list:', {
    setUp: function () {
      test = this;
      v = {};
      Package['app-pages']._Test.FormList(Bart);
      v.List = Bart.Test.Form.List;
    },

    tearDown: function () {
      delete Bart.Test;
      v = null;
    },

    "defaults": {
      setUp: function () {
        SelectList.attach(v.List, {
          onChoose: function (elm, event) {
            v.currentTarget = event.currentTarget;
            v.elm = elm;
          },
        });
      },

      "test select by mouse click": function () {
        renderButton();

        assert.dom('#TestButton', function () {
          TH.trigger(this, 'mousedown');
          assert.dom('#TestList');
          TH.trigger(this, 'mouseup');

          assert.dom('#TestList', function () {
            assert.dom('li:first-child', function () {
              TH.trigger(this, 'mousedown');
              assert.same(v.elm, this);
            });

            assert.same(v.currentTarget, this);
          });
          TH.trigger(this, 'mousedown');
          TH.trigger(this, 'mouseup');
          refute.dom('#TestList');
          TH.trigger(this, 'mousedown');
          TH.trigger(this, 'mouseup');
          assert.dom('#TestList');
        });
      },

      "test blurring list closes list": function () {
        renderButton();

        assert.dom('#TestButton', function () {
          TH.trigger(this, 'mousedown');
          TH.trigger(this, 'mouseup');
          TH.trigger(this, 'blur');
        });

        refute.dom('#TestList');
      },

      "test clicking off list closes list": function () {
        renderButton();

        assert.dom('#TestButton', function () {
          TH.trigger(this, 'mousedown');
          TH.trigger(this, 'mouseup');
        });

        TH.trigger(document.body, 'mousedown');

        refute.dom('#TestList');
      },

      "test can't select disabled": function () {
        renderButton();

        assert.dom('#TestButton', function () {
          TH.trigger(this, 'mousedown');
          TH.trigger(this, 'mouseup');
          TH.trigger('li.disabled', 'mousedown');
        });

        refute(v.currentTarget);
      },
    },

    "test selector": function () {
      SelectList.attach(v.List, {
        selector: "#TestList>ul",
        onChoose: function (elm, event) {
          v.elm = elm;
        },
      });

      document.body.appendChild(v.listElm = v.List.$autoRender({}));

      assert.dom('#TestButton', function () {
        TH.trigger(this, 'mousedown');
        TH.trigger(this, 'mouseup');
        assert.dom('#TestList', function () {
          assert.dom('ul', function () {
            TH.trigger(this, 'mousedown');
            assert.same(v.elm, this);
          });
        });
      });
    },
  });

  function renderButton() {
    document.body.appendChild(v.selectElm = v.List.$autoRender({}));
  }
})();
