(function (test, v) {
  buster.testCase('packages/app-pages/test/client/markdown:', {
    setUp: function () {
      test = this;
      v = {};
      Package['app-pages']._Test.MarkdownEditor(Bart);
      v.tpl = Bart.Test.MarkdownEditor;
    },

    tearDown: function () {
      v = null;
    },

    "fromHtml": {
      setUp: function () {
        v.c = function (html) {
          return App.Markdown.fromHtml(Bart.html(html));
        };
      },

      "test null": function () {
        assert.same(App.Markdown.fromHtml(null), '');

      },

      "test href": function () {
        assert.same(v.c('<div><a href="http://obeya.co">Obeya <b>Limited</b></a> link</div>'),
                    '[Obeya **Limited**](http://obeya.co) link');
      },

      "test simple nesting": function () {
        assert.same(v.c('<div><b>Brave <i>new</i> World</b></div>'),
                    '**Brave _new_ World**');

      },

      "test complex": function () {
        assert.same(v.c('<div><div><b>So<i>m</i>e</b>Text</div><p>As<i>html</i></p> Testing&nbsp;with spaces</div>'),
                  '\n**So _m_ e** Text\n\nAs *html* Testing with spaces');
      },

      "test buttons": function () {
        assert.same(v.c('<div>Hello <span data-a="j2">Josiah&lt;JG&gt;</span></div>'), 'Hello @[Josiah<JG>](j2)');
        assert.same(v.c('<div>Hello <span data-h="s1">Foo <b>bar</b></span></div>'), 'Hello #[Foo **bar**](s1)');
      },
    },

    "toHtml": {
      setUp: function () {
        v.c = function (text) {
          var elm = document.createElement('div');
          elm.appendChild(App.Markdown.toHtml(text));
          return elm.innerHTML;
        };
      },

      "test links": function () {
        assert.same(v.c('Hello @[Josiah<JG>](j2)'), 'Hello <span data-a="j2" contenteditable="false">Josiah&lt;JG&gt;</span>');
        assert.same(v.c('#[Foo **bar**](s1)'), '<span data-h="s1" contenteditable="false">Foo <b>bar</b></span>');
      },


      "test wrapper": function () {
        assert.dom(App.Markdown.toHtml("hello _world_", 'span'), function () {
          assert.same(this.tagName, 'SPAN');
          assert.dom('i', "world");
        });
      },

      "test simple italic": function () {
        assert.same(v.c('*italic* text'), "<i>italic</i> text");
      },

      "test simple bold": function () {
        assert.same(v.c('**bold** text'), "<b>bold</b> text");
      },

      "test nested italic in bold": function () {
        assert.same(v.c('**bold _italic_ ** text'), "<b>bold <i>italic</i> </b> text");
        assert.same(v.c('__bold *italic* __ text'), "<b>bold <i>italic</i> </b> text");
      },

      "test nested bold in italic": function () {
        assert.same(v.c('*italic __bold__ * text'), "<i>italic <b>bold</b> </i> text");
      },

      "test hyperlink": function () {
        assert.same(v.c('[l1](/l1) text [O][b\n]eya](http://obeya.co)[link2](/a)'),
                    '<a href="/l1">l1</a> text [O]<a href="http://obeya.co">b<br>]eya</a><a href="/a">link2</a>');
      },

      "test complex": function () {
        assert.same(v.c('**So _m_ e** Text\n\nAs *html*  Test\ning with\n\n spaces'),
                    "<b>So <i>m</i> e</b> Text<p>As <i>html</i>  Test<br>ing with</p><p> spaces</p>");
      },
    },
  });
})();
