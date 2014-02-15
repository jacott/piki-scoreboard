(function (test) {
  buster.testCase('packages/app-models/test/apputil:', {
    setUp: function () {
      test = this;
    },

    tearDown: function () {
    },

    "test includesAttributes": function () {
      var doc = {a: '1', b: '2'};
      var other = {a: '1', b: '3'};

      assert.isTrue(Apputil.includesAttributes({a: 1}, doc, other, null));
      assert.isFalse(Apputil.includesAttributes({a: 1, b: '4'}, doc, other, null));
      assert.isTrue(Apputil.includesAttributes({a: 1, b: '3'}, doc, other, null));
      assert.isTrue(Apputil.includesAttributes({a: 1, b: '2'}, doc, other, null));
      assert.isFalse(Apputil.includesAttributes({a: 2, b: '2'}, doc, other, null));
    },

    "test compareByName": function () {
      var a = {name: "Bob"};
      var b = {name: "Bob"};

      assert.same(Apputil.compareByName(a,b), 0);

      b.name = 'Cary';
      assert.same(Apputil.compareByName(a,b), -1);

      b.name = 'Arnold';
      assert.same(Apputil.compareByName(a,b), 1);
    },

    "test compareByField": function () {
      var a = {f1: "Bob", f2: 1};
      var b = {f1: "Bob", f2: 2};

      assert.same(Apputil.compareByField('f1')(a,b), 0);

      b.f1 = 'Cary';
      assert.same(Apputil.compareByField('f1')(a,b), -1);

      b.f1 = 'Arnold';
      assert.same(Apputil.compareByField('f1')(a,b), 1);

      assert.same(Apputil.compareByField('f2')(a,b), -1);

      assert.same(Apputil.compareByField('f2')(b,a), 1);
    },

    "test TwoIndex": function () {
      var sut = new Apputil.TwoIndex();

      assert.same(sut.add(1, 2, '12'), '12');
      sut.add(2, 2, '22');
      sut.add(2, 3, '23');

      assert.isTrue(sut.has(1));
      assert.isFalse(sut.has(3));
      assert.isFalse(sut.has(1, 3));
      assert.isTrue(sut.has(1, 2));

      assert.same(sut.get(4), undefined);
      assert.equals(sut.get(1), {2: '12'});

      assert.equals(sut.get(1, 2), '12');
      assert.equals(sut.get(1, 3), undefined);
      assert.equals(sut.get(2, 2), '22');
      assert.equals(sut.get(2, 3), '23');
      assert.equals(sut.get(3, 2), undefined);

      sut.remove(2);

      assert.same(sut.get(2), undefined);


      sut.add(2, 2,'22');
      sut.add(2, 3,'23');

      sut.remove(2, 2);
      assert.equals(sut.get(2), {3: '23'});

       sut.add(2, 3,'24');

      assert.equals(sut.get(2), {3: '24'});

      sut.remove(1, 2);

      assert.isFalse(sut.has(1));
    },

    "test deepCopy": function () {
      assert.same(Apputil.deepCopy(1), 1);
      assert.same(Apputil.deepCopy(true), true);
      assert.same(Apputil.deepCopy(null), null);
      assert.same(Apputil.deepCopy(undefined), undefined);
      assert.same(Apputil.deepCopy("a"), "a");

      function func() {}
      assert.same(Apputil.deepCopy(func), func);

      var orig = new Date(123);
      assert.equals(Apputil.deepCopy(orig), orig);
      refute.same(Apputil.deepCopy(orig), orig);


      var orig = [1, "2", {three: [4, {five: 6}]}];

      var result = Apputil.deepCopy(orig);

      assert.equals(orig, result);

      result[2].three[1].five = 'changed';

      assert.equals(orig, [1, "2", {three: [4, {five: 6}]}]);
    },

    "test toMap": function () {
      assert.equals(Apputil.toMap(), {});
      assert.equals(Apputil.toMap(['a', 'b']), {a: true, b: true});
      assert.equals(Apputil.toMap([{foo: 'a'}, {foo: 'b'}], 'foo', true), {a: true, b: true});
      assert.equals(Apputil.toMap([{foo: 'a'}, {foo: 'b'}], 'foo'), {a: {foo: 'a'}, b: {foo: 'b'}});
      assert.equals(Apputil.toMap([{foo: 'a', baz: 1}, {foo: 'b', baz: 2}], 'foo', 'baz'), {a: 1, b: 2});
    },

    "test findBy": function () {
      var list = [{foo: 'a', _id: 2}, {foo: 'b', _id: 1}];
      assert.same(Apputil.findBy(list, 1), list[1]);
      assert.same(Apputil.findBy(list, 2), list[0]);
      assert.same(Apputil.findBy(list, 'a', 'foo'), list[0]);
      assert.same(Apputil.findBy(list, 'b', 'foo'), list[1]);
    },

    "test mapField": function () {
      assert.same(Apputil.mapField(null), null);

      assert.equals(Apputil.mapField([]), []);
      assert.equals(Apputil.mapField([{_id: 1}, {_id: 2}]), [1, 2]);
      assert.equals(Apputil.mapField([{foo: 2, bar: 4}, {foo: "ab"}], 'foo'), [2, "ab"]);
    },

    "test titleize": function () {
      assert.same(Apputil.titleize(""), "");
      assert.same(Apputil.titleize("abc"), "Abc");
      assert.same(Apputil.titleize("abc-def_xyz.qqq+foo%bar"), "Abc Def Xyz Qqq Foo Bar");
      assert.same(Apputil.titleize("CarlySimon"), "Carly Simon");
    },

    "test humanize": function () {
      assert.same(Apputil.humanize('camelCaseCamel_id'), "camel case camel");
      assert.same(Apputil.humanize('Hyphens-and_underscores'), "hyphens and underscores");

    },

    "test initials": function () {
      assert.same(Apputil.initials(null, 2), "");
      assert.same(Apputil.initials("Sam THE BIG Man", 2), "SM");
      assert.same(Apputil.initials("Sam the BIG man"), "STM");
      assert.same(Apputil.initials("Prince"), "P");
    },

    'test intersectp': function () {
      assert(Apputil.intersectp([1,4],[4,5]));
      refute(Apputil.intersectp([1,2],['a']));
    },

    "test parseEmailAddresses": function () {
      assert.isNull(Apputil.parseEmailAddresses("foo@bar baz"));
      assert.isNull(Apputil.parseEmailAddresses("foo@ba_r.com"));


      assert.equals(Apputil.parseEmailAddresses("foo@bar.baz.com fnord"),
                    {addresses: ["foo@bar.baz.com"], remainder: "fnord"});

      assert.equals(Apputil.parseEmailAddresses("a b c <abc@def.com> foo-_+%bar@obeya-test.co, "),
                    {addresses: ["a b c <abc@def.com>", "foo-_+%bar@obeya-test.co"], remainder: "" });
    },
  });
})();
