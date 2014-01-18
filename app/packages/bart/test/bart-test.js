// Client only
Meteor.isClient && (function (test, v) {
  var _private = Package.bart._private;

  buster.testCase('packages/bart/test/bart:', {
    setUp: function () {
      test = this;
      v = {};
    },

    tearDown: function () {
      v = null;
      delete Bart.Foo;
    },

    "evalArgs": {
      "test constant": function () {
        assert.equals(_private.evalArgs({}, ['"name', ['=', 'type', '"text'], ['=', 'count', '"5']]), ['name', {type: 'text', count: '5'}]);
      },
    },

    "partial": {
      setUp: function () {
        Bart.newTemplate({
          name: "Foo",
          nodes:[{
            name:"section",
            children:[' ', ['>', '/Bar']],
          }],
        });

        Bart.newTemplate({
          name: "Bar",
          nodes:[{
            name:"div",
            children:[' ', ['>', 'Baz', ['=', 'initials', 'myFunc']]],
          }],
        });

        Bart.newTemplate({
          name: "Bar.Baz",
          nodes:[{
            name:"i",
            children:[['', 'initials']]
          }],
        });
      },

      tearDown: function () {
        delete Bart.Bar;
      },

      "test default arg is data": function () {
        Bart.Bar.$created = test.stub();

        var data = {arg: 'me'};
        Bart.Foo.$render(data);

        assert.calledWith(Bart.Bar.$created, sinon.match(function (ctx) {
          assert.same(ctx.data, data);
          return true;
        }));
      },

      "test scoping": function () {
        var initials = 'BJ';
        Bart.Bar.$helpers({
          myFunc: function () {
            return initials;
          },
        });
        var result = Bart.Foo.$render({});

        assert.dom(result, function () {
          assert.dom('>div>i', 'BJ');
        });
      },
    },

    "//Bart.current": {
      "test data": function () {

      },
    },


    "test html": function () {
      var elm = Bart.html('<div id="top"><div class="foo"><div class="bar"><button type="button" id="sp">Hello</button></div></div></div>');

      document.body.appendChild(elm);

      assert.dom('#top', function () {
        assert.same(elm, this);

        assert.dom('>.foo', function () { // doubles as a test for assert.dom directChild
          assert.dom('>.bar>button#sp', 'Hello');
        });
      });
    },

    "test classList": function () {
      var elm = document.createElement('div');

      refute(Bart.hasClass(null, 'foo'));
      refute(Bart.hasClass(elm, 'foo'));

      Bart.addClass(elm, 'foo');
      assert(Bart.hasClass(elm, 'foo'));

      Bart.addClass(null, 'foo');
      Bart.addClass(elm, 'foo');
      Bart.addClass(elm, 'bar');
      assert(Bart.hasClass(elm, 'foo'));
      assert(Bart.hasClass(elm, 'bar'));

      Bart.removeClass(null, 'bar');
      Bart.removeClass(elm, 'bar');
      assert(Bart.hasClass(elm, 'foo'));
      refute(Bart.hasClass(elm, 'bar'));
    },

    "test parentOf": function () {
      var elm = Bart.html('<div id="top"><div class="foo"><div class="bar"><button type="button" id="sp">Hello</button></div></div></div>');

      assert.same(Bart.parentOf(elm, elm.querySelector('.bar')), elm);
      assert.same(Bart.parentOf(elm.querySelector('.bar'), elm), null);
    },

    "test $getClosest": function () {
      document.body.appendChild(Bart.html('<div><div class="foo"><div class="bar"><button type="button" id="sp"></button></div></div></div>'));

      var button = document.getElementById('sp');

      var foobar = document.querySelector('.foo>.bar');

      test.stub(Bart, 'getCtx').withArgs(foobar).returns('the ctx');

      assert.same(Bart.getClosest(button, '.foo>.bar'), foobar);
      assert.same(Bart.getClosestCtx(button, '.foo>.bar'), 'the ctx');
    },

    "test $actions": function () {
      Bart.newTemplate({name: "Foo"});
      Bart.Foo.$actions({
        one: v.one = test.stub(),
        two: test.stub(),
      });

      assert.same(Bart.Foo._events.length, 2);
      assert.same(Bart.Foo._events[0][0], 'click');
      assert.same(Bart.Foo._events[0][1], '[name=one]');

      var event = {};

      Bart.Foo._events[0][2](event);

      assert.calledWithExactly(v.one, event);


    },

    "newTemplate": {
      "test simple": function () {
        assert.same(Bart.newTemplate({name: "Foo", nodes: "nodes"}), Bart);

        var tpl = Bart.Foo;
        assert.same(tpl.name, "Foo");
        assert.same(tpl.nodes, "nodes");
        assert.equals(tpl._helpers, {});
        assert.equals(tpl._events, []);
      },

      "test nest by name": function () {
        Bart.newTemplate({name: "Foo.Bar.Baz"});

        var tpl = Bart.Foo.Bar;
        assert.same(tpl.name, undefined);
        assert.same(Bart.lookupTemplate("Foo.Bar"), tpl);


        assert.same(tpl.Baz.name, 'Baz');

        Bart.newTemplate({name: "Foo"});

        assert.same(Bart.Foo.name, 'Foo');
        assert.same(Bart.Foo.Bar.Baz.name, 'Baz');

        Bart.newTemplate({name: "Foo.Bar"});

        assert.same(Bart.Foo.Bar.name, 'Bar');
        assert.same(Bart.Foo.Bar.Baz.name, 'Baz');
      },
    },

    "with rendered": {
      setUp: function () {
        Bart.newTemplate({
          name: "Foo",
          nodes:[{name: "div", attrs:[["=","id",'foo']],}],
        });

        v.foo = Bart.Foo.$render();

        document.body.appendChild(v.foo);
      },

      "test focus": function () {
        document.body.appendChild(Bart.html('<form><button name="bt"><input type="text" name="inp"><button name="b2"></form>'));
        assert.dom('form', function () {
          assert.dom('[name=b2]', function () {
            this.focus();
            assert.same(document.activeElement, this);
          });
          Bart.focus(this);
          assert.dom('[name=inp]', function () {
            assert.same(document.activeElement, this);
          });
          Bart.focus(this, '[name=bt]');
          assert.dom('[name=bt]', function () {
            assert.same(document.activeElement, this);
          });
        });
      },

      "test replace element": function () {
        Bart.newTemplate({name: 'Foo.Bar', nodes: [{name: 'span'}]});
        Bart.newTemplate({name: 'Foo.Baz', nodes: [{name: 'h1'}]});

        var dStub = Bart.Foo.Bar.$destroyed = function () {
          if (v) v.args = arguments;
        };

        var bar = Bart.Foo.Bar.$render();
        var baz = Bart.Foo.Baz.$render();

        v.foo.appendChild(bar);

        assert.dom('#foo', function () {
          assert.dom('>span', function () {
            v.barCtx = this._bart;
          });
          Bart.replaceElement(baz, bar);
          var ctx = this._bart;
          assert.dom('>h1', function () {
            assert.same(ctx, this._bart.parentCtx);
          });
          refute.dom('>span');
          assert.same(v.args[0], v.barCtx);
          assert.isNull(bar._bart);

          bar = Bart.Foo.Bar.$render();

          Bart.replaceElement(bar, baz, 'noRemove');

          assert.dom('>span', function () {
            assert.same(ctx, this._bart.parentCtx);
          });
          refute.dom('>h1');
          assert.same(v.args[0], v.barCtx);
          refute.isNull(baz._bart);
        });
      },
    },

    "$render": {
      "test autostop": function () {
        Bart.newTemplate({
          name: "Foo",
          nodes:[{name: "div"}],
        });

        var elm = Bart.Foo.$render({});
        var ctx = Bart.getCtx(elm);
        var stub1 = test.stub();
        var stub2 = test.stub();
        ctx.onDestroy({stop: stub1})
          .onDestroy(stub2);

        Bart.remove(elm);

        assert.called(stub1);
        assert.called(stub2);

        stub1.reset();
        Bart.remove(elm);

        refute.called(stub1);
      },


      "test no frag if only one child node": function () {
        Bart.newTemplate({
          name: "Foo",
          nodes:[{name: "div"}],
        });

        var elm = Bart.Foo.$render({});
        assert.same(elm.nodeType, document.ELEMENT_NODE);
        assert.same(elm.tagName, 'DIV');
      },

      "test frag if multi childs": function () {
        Bart.newTemplate({
          name: "Foo",
          nodes:[{name: "div",}, {name: 'span'}, {name: 'section'}],
        });
        var frag = Bart.Foo.$render({});
        assert.same(frag.nodeType, document.DOCUMENT_FRAGMENT_NODE);

        var ctx = frag.firstChild._bart;
        assert.same(frag.firstChild.tagName, 'DIV');

        assert.same(ctx, frag.firstChild.nextSibling._bart);
        assert.same(ctx, frag.lastChild._bart);
      },


      "test attributes": function () {
        Bart.newTemplate({
          name: "Foo",
          nodes:[{
            name:"div",attrs:[
              ["=","id",["","id"]],
              ["=","class",["","classes"]],
              ["=","data-id",["","user._id"]],
              ["","draggable"]
            ],
            children:[],
          }],
        });

        Bart.Foo.$helpers({
          classes: function () {
            return "the classes";
          },

          draggable: function () {
            Bart.current.element.setAttribute('draggable', 'true');
          },
        });

        assert.dom(Bart.Foo.$render({id: 'foo', user: {_id: '123'}}), function () {
          assert.same(this.getAttribute('id'), 'foo');
          assert.same(this.getAttribute('class'), 'the classes');
          assert.same(this.getAttribute('data-id'), '123');

          assert.same(this.getAttribute('draggable'), 'true');
        });
      },

      "test parent": function () {
        Bart.newTemplate({
          name: "Foo.Bar",
          nested: [{
            name: "Baz",
          }],
        });

        assert.same(undefined, Bart.Foo.parent);
        assert.same(Bart.Foo, Bart.Foo.Bar.parent);
        assert.same(Bart.Foo.Bar, Bart.Foo.Bar.Baz.parent);
      },

      "test body": function () {
        Bart.newTemplate({
          name: "Foo",
          nodes:[{
            name:"div",
            children:[['', 'user.initials']],
          }],
        });

        assert.dom(Bart.Foo.$render({user: {initials: 'fb'}}), 'fb');
      },
    },
  });
})();
