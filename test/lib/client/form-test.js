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
            assert.dom('option[selected=selected]', {value: "2", text: "item 2"});
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
            assert.dom('option[selected=selected]', {value: "2", text: "item 2"});
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
