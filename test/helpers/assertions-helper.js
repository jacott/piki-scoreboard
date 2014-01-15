(function () {
  var ga = geddon.assertions,
      gu = geddon._u;

  ga.add('userGroupsEqual', {
    assert: function (expected, actual) {
      return gu.deepEqual(AppModel.AccessProfile.groupHash(expected), AppModel.AccessProfile.groupHash(actual));
    },

    message: "userGroup {i0} to equal {i1}",
  });

  ga.add('between', {
    assert: function (sut, from, to) {
      return sut >= from && sut <= to;
    },

    assertMessage: "Expected {0} to be between {1} and {2}",
    refuteMessage: "Expected {0} not to be between {1} and {2}",
  });

  ga.add('difference', {
    assert: function (count, diffFunc, func) {
      if (diffFunc.modelName) {
        var args = Apputil.slice(arguments, 2, -1);
        func = arguments[arguments.length - 1];
        var model = diffFunc;
        diffFunc = function () {
          return model.find.apply(model, args).count();
        };
      }
      this.before = +diffFunc();
      func();
      this.after = +diffFunc();
      return this.after - this.before === count;
    },

    message: "a difference of {0}. Before {$before}, after {$after}",
  });

  ga.add('specificAttributesEqual', {
    assert: function (actual, expected) {
      if (! (actual && expected)) {
        this.actual = actual;
        this.expected = expected;
        return ! this._asserting;
      }
      if (actual && actual.attributes)
        actual = actual.attributes;

      this.actual = actual;
      this.expected = expected;

      for(var key in expected) {
        if (! gu.deepEqual(actual[key], expected[key])) {
          this.diff = key;
          return false;
        }
      }

      return true;
    },

    message: "attribute {i$diff} in {i$actual} to equal the specified attributes: {i$expected}",
  }),

  ga.add('attributesEqual', {
    assert: function (actual, expected, exclude) {
      if (! (actual && expected)) {
        this.actual = actual;
        this.expected = expected;
        return ! this._asserting;
      }
      if (! (actual instanceof Array)) actual = [actual];
      if (! (expected instanceof Array)) expected = [expected];
      if (actual[0] && actual[0].attributes) {
        actual = actual.map(function (i) {
          return i.attributes;
        });
      }
      if (expected[0] && expected[0].attributes) {
        expected = expected.map(function (i) {
          return i.attributes;
        });
      }
      actual = mapFields(actual, exclude);
      expected = mapFields(expected, exclude);
      this.actual = actual;
      this.expected = expected;

      return gu.deepEqual(actual, expected);
    },

    message: "attributes in {i$actual} to equal {i$expected}",
  });

  function mapFields(list, exclude) {
    var result = {};
    if (list.length === 0) return result;
    var useId = (! exclude || exclude.indexOf('_id') === -1) && !! list[0]._id;
    for(var i=0;i < list.length;++i) {
      var row = list[i];
      if (exclude) {
        var attrs = {};
        for(var key in row) {
          if (exclude.indexOf(key) === -1) {
            attrs[key] = row[key];
          }
        }
      } else {
        var attrs = row;
      }
      result[useId ? row._id : i] = attrs;
    }
    return result;
  }

  ga.add('modelIndex', {
    assert: function (modelName /*, arguments */) {
      var enIdx = Meteor.Collection.prototype._ensureIndex,
          count = enIdx.callCount,
          tv = enIdx.thisValues,
          expected = Apputil.slice(arguments, 1),
          docs = AppModel[modelName].docs,
          result = false;

      for(var i=0;i < tv.length;++i) {
        if (tv[i] === docs) {
          var call = enIdx.getCall(i);
          if (call.calledWith.apply(call,expected)) {
            result = true;
            break;
          }
        }
      }

      if (this._asserting !== result) {
        this.expected = expected;
        this.spy = enIdx.printf("%n");
        this.calls = enIdx.printf("%C");
      }

      return result;
    },

    message: "{$spy} to be calledWith {i$expected}{$calls}"
  });

  ga.add('modelErrors', {
    assert: function (doc, expected) {
      var result = {}, errors = doc._errors || {};

      for(var field in errors) {
        var msgs = errors[field].map(function (m) {
          return m.join(', ');
        });

        result[field] = msgs.join('; ');
      }

      this.result = result;
      return gu.deepEqual(result, expected);
    },

    message: "{i$result} to be {i1}",
  });

  ga.add('validators', {
    assert: function (validators, expected) {
      this.actual = validators;
      this.expected = expected;
      if (Object.keys(expected).length !== Object.keys(validators).length) {
        this.key = Object.keys(validators);
        return false;
      }
      for(var key in expected) {
        var val = validators[key];
        this.key = key;
        this.actual = val.slice(1,2);
        this.expected = expected[key];
        if (! (val && gu.deepEqual(val.slice(1,2), expected[key]))) return false;
      }
      return true;
    },

    assertMessage: "Expected {i$actual} to match {i$expected}. {i$key}",
    refuteMessage: "Did not expect {i0} to match {i1}"
  });

  ga.add('accessDenied', {
    assert: function (func) {
      var error;
      try {
        func.call();
      } catch(e) {error = e;}
      if (error) {
        if (error.error === 403 && error.reason === "Access denied")
          return true;

        throw error;
      }
      return false;
    },

    assertMessage: "Expected AccessDenied",
    refuteMessage: "Did not expect AccessDenied",
  });

  ga.add('invalidRequest', {
    assert: function (func) {
      var error;
      try {
        func.call();
      } catch(e) {error = e;}
      if (error) {
        if (error.error === 400 && error.reason.match(/^Invalid request/))
          return true;

        throw error;
      }
      return false;
    },

    assertMessage: "Expected Invalid request",
    refuteMessage: "Did not expect Invalid request",
  });

  ga.add('permitSpec', {
    assert: function (spec, changes, func, isNewRec) {
      var spy = sinon.spy(AppVal,'permitParams'),
          cSpec = this.cSpec = AppVal.permitSpec.apply(AppVal,spec);

      try {
        func.call();
        this.args = spy.getCall(0);

        return spy.calledWith(changes, cSpec, isNewRec);
      } finally {
        spy.restore();
      }
    },

    assertMessage: "Expected AppVal.permitSpec to be called like:\npermitParams({i1}, {i$cSpec})\nbut was called with:\n{$args}",
    refuteMessage: "Did not expect AppVal.permitSpec to be called like:\npermitParams({i1}, {i$cSpec})"
  });

  // assert.cssNear
  ga.add('cssNear', {
    assert: function (elm,styleAttr, expected, delta, unit) {
      delta = this.delta = delta  || 1;
      unit = this.unit = unit || 'px';
      var actual = this.actual = TH.styleAttr(elm, styleAttr);

      if(!actual || actual.length < unit.length+1) return false;
      actual = actual.slice(0,-unit.length);

      return actual > expected-delta && actual < expected+delta;
    },

    assertMessage: "Expected css({1}) {$actual} to be near {2}{$unit} by delta {$delta}",
    refuteMessage: "Expected css({1}) {$actual} not to be near {2}{$unit} by delta {$delta}",
  });
})();
