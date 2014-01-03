(function () {
  buster.testCase('packages/app-models/format:', {
    'when compiling': {
      'test constant': function () {
        assert.equals(App.format.compile("no args"), ["no args"]);
      },

      'test simple': function () {
        assert.equals(App.format.compile("abc {1} de\nf {0}"), ['abc ','s1',' de\nf ','s0', '']);
      },

      'test edge': function () {
        assert.equals(App.format.compile("{3}edge args{4}"), ["", "s3", "edge args", "s4", '']);
      },

      'test escaped': function () {
        assert.equals(App.format.compile("abc {}1} de\nf {0}}"), ['abc {1} de\nf ','s0', '}']);
      },
      'test html escape': function () {
        assert.equals(App.format.compile("abc{e1}"), ['abc','e1', '']);
      },

      "test nested objects": function () {
         assert.equals(App.format.compile("abc{e$foo.bar.baz}"), ['abc','e$foo.bar.baz', '']);
      },
    },
    'when formatting': {
      'test constant': function () {
        assert.equals(App.format("no args"), "no args");
      },

      "test missing arg": function () {
        assert.same(App.format("abc {1} de\nf {0}", '00'), 'abc  de\nf 00');
      },

      'test simple': function () {
        assert.same(App.format("abc {1} de\nf {0}", '00', 11), 'abc 11 de\nf 00');
      },

      'test edge': function () {
        assert.equals(App.format("{1}edge{} args{2}", 'ww', 'xx', 'yy'), 'xxedge{ argsyy');
      },
      'test html escape': function () {
        assert.equals(App.format("abc{e0}", '<\'he llo"`&>'), 'abc&lt;&#x27;he llo&quot;&#x60;&amp;&gt;');
      },
      'test pre compiled': function () {
        assert.same(App.format(['abc ','s1',' def ','s0'], '00', 11), 'abc 11 def 00');
      },

      "test nested objects": function () {
        assert.equals(App.format("{1}abc{e$foo.bar.baz}", 1, 2, {foo: {bar: {baz: "<fnord>"}}}), "2abc&lt;fnord&gt;");
      },
    },
  });
})();