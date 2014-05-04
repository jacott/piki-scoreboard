(function (test, v) {
  buster.testCase('packages/app-pages/test/client/form:', {
    setUp: function () {
      test = this;
      v = {};
      Package['app-pages']._Test.Form(Bart);
      v.selectList = Bart.Test.Form.TestSelect;
    },

    tearDown: function () {
      v = null;
    },

    "modalize": {
      setUp: function () {
        document.body.appendChild(Bart.html(
          '<div id="top">' +
            '<div class="ta"><input type="text" id="os" value="outside txt"></div>' +
            '<div class="foo"><div class="bar">' +
            '<textarea id="sta">ta</textarea>' +
            '<div id="sce" contenteditable="true">ce</div>' +
            '<button type="button" id="sb" value="notme">' +
            '<input type="password" id="sp" value="hidden">' +
            '<input type="text" id="st" value="txt">' +
            '</div></div></div>'
        ));
        v.func = test.stub();
        Bart.Form.modalize(document.querySelector('.bar'), v.func);
      },

      tearDown: function () {
        Bart.Form.cancelModalize('all');
      },


      "test mousedown and nesting": function () {
        var removeEventListener = test.spy(document, 'removeEventListener');
        TH.trigger('#sp', 'mousedown');

        refute.called(v.func);

        TH.trigger('.foo', 'mousedown');

        assert.calledWith(v.func, sinon.match(function (event) {
          assert.same(event.type, 'mousedown');
          assert.same(event.target, document.querySelector('.foo'));
          return true;
        }));

        // testing replacement

        Bart.Form.modalize('.foo', v.func2 = test.stub());

        v.func.reset();

        TH.trigger('#top', 'mousedown');

        refute.called(v.func);
        assert.called(v.func2);

        assert.same(Bart.Form.cancelModalize(), document.querySelector('.bar'));

        refute.called(removeEventListener);

         v.func2.reset();

        TH.trigger('.foo', 'mousedown');

        assert.called(v.func);
        refute.called(v.func2);

        assert.same(Bart.Form.cancelModalize(), null);

        assert.called(removeEventListener);
      },

      "test keyup": function () {
        TH.trigger('#sp', 'keyup', {which: 26});
        TH.trigger('.foo', 'keyup', {which: 26});
        TH.trigger('#st', 'keyup', {which: 27});
        TH.trigger('#sta', 'keyup', {which: 27});
        TH.trigger('#sce', 'keyup', {which: 27});
        TH.trigger('#sp', 'keyup', {which: 27});

        refute.called(v.func);

        TH.trigger('.foo', 'keyup', {which: 27});
        TH.trigger('#sb', 'keyup', {which: 27});
        TH.trigger('#os', 'keyup', {which: 27});

        assert.calledWith(v.func, sinon.match(function (event) {
          assert.same(event.type, 'keyup');
          return event.target === document.querySelector('.foo');
        }));

        assert.same(v.func.callCount, 3);
      },
    },

    "test empty MarkdownEditor": function() {
      document.body.appendChild(Bart.Test.Form.TestMarkdownEditor.$autoRender({}));

      assert.dom('#TestMarkdownEditor>label', function () {
        assert.dom('span.name', 'Name');
        assert.dom('#nameId.mdEditor.bar.empty[data-errorfield="name"]:not([type])>.input');
      });
    },

    "SelectList": {
      setUp: function () {
        v.list = [["1", "item 1"], ["2", "item 2"]];
        v.doc = {
          foo_id: "2",
        };
      },

      "test with Array": function () {
        v.selectList.$helpers({fooList: function () {return v.list}});

        document.body.appendChild(v.selectList.$autoRender(v.doc));

        assert.dom("label", function () {
          assert.dom('select#fooId[name=foo_id]', function () {
            assert.domParent('.name', 'Foo');
            assert.dom('option', {value: "1", text: "item 1"});
            assert.dom('option[selected]', {value: "2", text: "item 2"});
          });
        });
      },

      "test radio with Array": function () {
        v.selectList = Bart.Test.Form.TestRadio;
        v.selectList.$helpers({fooList: function () {return v.list}});

        document.body.appendChild(v.selectList.$autoRender(v.doc));

        assert.dom("label", function () {
          assert.dom('span#fooId[data-errorField=foo_id].errorField.radioGroup', function () {
            assert.domParent('.name', 'Foo');
            assert.dom('label>input[type=radio][value="1"]+span', {text: "item 1"});
            assert.dom('[type=radio][checked]', {value: "2"});
          });
        });
      },

      "test with object": function () {
        v.selectList.$helpers({
          fooList: function () {
            return [{_id: "1", name: "item 1"}, {_id: "2", name: "item 2"}];
          },
        });

        document.body.appendChild(v.selectList.$autoRender(v.doc));

        assert.dom("label", function () {
          assert.dom('select#fooId[name=foo_id]', function () {
            assert.domParent('.name', 'Foo');
            assert.dom('option', {value: "1", text: "item 1"});
            assert.dom('option[selected]', {value: "2", text: "item 2"});
          });
        });
      },

      "includeBlank": {
        setUp: function () {
          v.call = function (arg) {
            v.elm = Bart.Form.Select.$autoRender({
              name: 'foo_id',
              doc: v.doc,
              options: {
                includeBlank: arg,
                selectList: v.list,
              }
            });
          };
        },

        "test msg": function () {
          v.call('hello world');

          assert.dom(v.elm, function () {
            assert.dom('option:first-child', {value: '', text: 'hello world'});
          });
        },

        "test 'true'": function () {
          v.call('true');

          assert.dom(v.elm, function () {
            assert.dom('option:first-child', {value: '', text: ''});
          });
        },

        "test empty": function () {
          v.call('');
          assert.dom(v.elm, function () {
            assert.dom('option:first-child', {value: '', text: ''});
          });
        },
      },
    },
  });
})();
