(function (test, v) {
  TH.initMarkdownEditor = function (v) {
    Package['app-pages']._Test.MarkdownEditor(Bart);
    v.tpl = Bart.Test.MarkdownEditor;
    v.setCaret = function (elm, offset) {
      var range = document.createRange();
      range.selectNode(elm);
      offset && range.setEnd(elm.firstChild, offset);
      range.collapse(! offset);
      var sel = getSelection();
      sel.removeAllRanges();
      sel.addRange(range);
      return range;
    };
  };

  buster.testCase('packages/app-pages/test/client/markdown-editor:', {
    setUp: function () {
      test = this;
      v = {};

      TH.initMarkdownEditor(v);
    },

    tearDown: function () {
      v = null;
    },

    "test getCaretRect": function () {
      var getCaretRect = Bart.MarkdownEditor.getCaretRect;

      document.body.appendChild(Bart.html('<div id="top">start <br> right <p>here</p></div>'));

      assert.dom('#top', function () {
        v.range = document.createRange();
        v.range.setStart(this, 0);
        v.range.setEnd(this, 0);
        v.bb = getCaretRect(v.range);

        v.range.selectNode(this.firstChild);
        assert.equals(v.bb, v.range.getClientRects()[0]);

        v.range.selectNode(this.childNodes[2]);

        assert.equals(getCaretRect(v.range), v.range.getClientRects()[0]);

        assert.dom('p', function () {
          v.range = document.createRange();
          v.range.selectNode(this);
          assert.equals(getCaretRect(v.range), this.getBoundingClientRect());
        });
      });
    },

    "test rendering": function () {
      document.body.appendChild(v.tpl.$autoRender({content: "**Hello** *world*", foos: "boo"}));

      assert.dom('#TestMarkdownEditor', function () {
        assert.dom('.mdEditor.foo.bar:not([atList])', function () {
          assert.dom('>.input[contenteditable=true]', 'Hello world', function () {
            TH.trigger(this, 'focusin');
            assert.className(this.parentNode, 'focus');
            assert.dom('b' ,'Hello');
            assert.dom('i' ,'world', function () {
              v.setCaret(this, 2);
              document.execCommand('insertText', false, ' foo ');
            });
            TH.trigger(this, 'focusout');
            refute.className(this.parentNode, 'focus');
          });
          assert.same(this.value, '**Hello** *wo foo rld*');
        });
      });
    },

    "test getRange": function () {
      getSelection().removeAllRanges();
      assert.isNull(Bart.MarkdownEditor.getRange());
      assert.isNull(Bart.MarkdownEditor.getTag('A'));
    },

    "paste": {
      setUp: function () {
        v.ec = test.stub(document, 'execCommand');
        v.event = {
          clipboardData: {
            items: [{type: 'text/html'}],
            getData: test.stub().withArgs('text/html').returns('<b>bold</b>'),
          },
        };

        v.slot = TH.findBartEvent(Bart.MarkdownEditor.Input, 'paste')[0];
        v.paste = v.slot[2];
        v.slot[2] = test.stub();
        test.stub(Bart, 'stopEvent');

        document.body.appendChild(v.tpl.$autoRender({content: ''}));

        v.input = document.body.getElementsByClassName('input')[0];
      },

      tearDown: function () {
        v.slot[2] = v.paste;
      },

      "test wiried": function () {
        TH.trigger(v.input, 'paste', v.event);

        assert.called(v.slot[2]);
      },

      "test no clipboard": function () {
        delete v.event.clipboardData;

        v.paste(v.event);

        refute.called(Bart.stopEvent);
      },

      "test no insertHTML": function () {
        var insertHTML = v.ec.withArgs('insertHTML').returns(false);
        var insertText = v.ec.withArgs('insertText').returns(true);

        v.paste(v.event);

        assert.called(Bart.stopEvent);

        assert.calledWith(insertText, 'insertText', null, '**bold**');
      },

      "test insertHTML": function () {
        var insertHTML = v.ec.withArgs('insertHTML').returns(true);
        var insertText = v.ec.withArgs('insertText').returns(true);

        v.paste(v.event);

        assert.called(Bart.stopEvent);

        refute.called(insertText);
        assert.calledWith(insertHTML, 'insertHTML', null, '<b>bold</b>');
      },
    },

    "test empty class": function () {
      document.body.appendChild(v.tpl.$autoRender({content: ''}));

      assert.dom('#TestMarkdownEditor', function () {
        assert.dom('.mdEditor.empty>.input[contenteditable=true]', '', function () {
          this.innerHTML = '<b>Brave <i>new</i> World</b>';
          TH.trigger(this, 'input');

          assert.same(App.Markdown.fromHtml(this), "**Brave _new_ World**");
          refute.className(this.parentNode, 'empty');

          TH.input(this, ' ');
          refute.className(this.parentNode, 'empty');

          TH.input(this, '');
          assert.className(this.parentNode, 'empty');
        });
      });
    },
  });
})();
