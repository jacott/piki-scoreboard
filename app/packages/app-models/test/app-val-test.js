(function () {
  var test;
  buster.testCase('packages/app-models/app-val:', {
    setUp: function () {
      test = this;
    },

    tearDown: function () {
    },

    "test validateName": function () {
      assert.equals(AppVal.validateName(), ['is_required']);
      assert.equals(AppVal.validateName(' ', 300), ['is_required']);
      assert.equals(AppVal.validateName('1234', 3), ['cant_be_greater_than', 3]);
      assert.equals(AppVal.validateName('   1234  ', 4), '1234');
    },

    "test allowIfSimple": function () {
      assert.accessDenied(function () {AppVal.allowIfSimple([12, {}])});
      assert.accessDenied(function () {AppVal.allowIfSimple({})});
      refute.accessDenied(function () {AppVal.allowIfSimple('sdfs')});
      refute.accessDenied(function () {AppVal.allowIfSimple(123)});
      refute.accessDenied(function () {AppVal.allowIfSimple([], ['abc', 1234])});
    },

    "test allowAccessIf": function () {
      assert.accessDenied(function () {AppVal.allowAccessIf(false);});
      refute.accessDenied(function () {AppVal.allowAccessIf(true);});
    },

    "test invalidRequest": function () {
      assert.invalidRequest(function () {AppVal.allowIfValid(false);});
      refute.invalidRequest(function () {AppVal.allowIfValid(true);});
    },

    'test validators': function () {
      var fooStub = {};
      AppVal.register('fooVal', fooStub);

      assert.same(AppVal.validators('fooVal'),fooStub);
    },

    'with permitParams': {
      "test permitDoc": function () {
        var stub = test.stub(AppVal, 'permitParams');
        var doc = {$isNewRecord: function () {return 'isNewRecordCalled'}, changes: 'changesArg'};
        AppVal.permitDoc(doc, 'params', 'filter');

        assert.calledWithExactly(stub, doc.changes, 'params', 'isNewRecordCalled', 'filter');
      },

      'with nested arrays': {
        setUp: function () {
          test.ps = AppVal.permitSpec('baz', [{things: ['heading', [{items: ['name']}]]}]);
        },

        "test change to null": function () {
          assertPermitted({name: null, }, AppVal.permitSpec('name'));
        },

        'test okay full change': function () {
          assertPermitted({'things': [{items: [{name: 'foo'},{name: 'bar'}]}]}, test.ps);
        },

        'test okay diff changes': function () {
          assert.equals(test.ps, {baz: true, things: [{heading: true, items: [{name: true}]}]});

          assertPermitted({'things.0.heading': 'head', 'things.0.items.0.name': 'foo'}, test.ps);
        },

        'test okay substructure': function () {
          assertPermitted({'things.1': {items: [{name: 'foo'},{name: 'bar'}]}}, test.ps);
        },

        'test bad full change': function () {
          refutePermitted({'things': [{items: [{name: 'foo'},{names: 'bar'}]}]}, test.ps);
        },

        'test bad diff changes': function () {
          refutePermitted({'things.0.heading': 'head', 'things.0.items.0.named': 'foo'}, test.ps);

          refutePermitted({'things.0.heading': 'head', 'things.0.items.0a.name': 'foo'}, test.ps);
        },

        'test bad substructure': function () {
          refutePermitted({'things.1': {items: [{name: 'foo'},{names: 'bar'}]}}, test.ps);
        },
      },

      'test none allowed': function () {
        refutePermitted({abc: '123'},AppVal.permitSpec());
      },

      'test only string of number': function () {
        refutePermitted({name: {nau: 'ghty'}, size: {width: 123, height: 456, deep: {val: 'a'}}},
                        AppVal.permitSpec('name', {size: [{deep: ['val']}, 'width', 'height']}));
      },

      'test okay string': function () {
        assertPermitted({name: 'text', size: {width: 123, height: 456, deep: {val: 'a'}}},
                        AppVal.permitSpec('name', {size: [{deep: ['val']}, 'width', 'height']}));
      },

      'test okay number': function () {
        assertPermitted({name: 1234, size: {width: 123, height: 456, deep: {val: 'a'}}},
                        AppVal.permitSpec('name', {size: [{deep: ['val']}, 'width', 'height']}));
      },

      'test nearly okay': function () {
        refutePermitted({name: 'nm', size: {width: 123, height: 456, deep: {val: 'a', bad: 1}}},
                        AppVal.permitSpec('name', {size: [{deep: ['val']}, 'width', 'height']}));
      },

      'test wrong type': function () {
        refutePermitted({name: 'nm', size: {width: 123, height: 456, deep: 'wt'}},
                        AppVal.permitSpec('name', {size: [{deep: ['val']}, 'width', 'height']}));
      },
    },
  });

  function assertPermitted(params, spec) {
    refute.accessDenied(function () {
      AppVal.permitParams(params, spec);
    });
  }

  function refutePermitted(params, spec) {
    assert.accessDenied(function () {
      AppVal.permitParams(params, spec);
    });
  }
})();
