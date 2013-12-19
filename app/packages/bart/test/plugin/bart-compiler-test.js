(function (test, v) {
  buster.testCase('packages/bart/plugin/bart-compiler:', {
    setUp: function () {
      test = this;
      v = {};
      if (Meteor.isClient) {
        _BartTest(Bart);
        v.template = Bart.Test;
      } else {
        var sut = {
          newTemplate: test.stub(),
        };
        _BartTest(sut);
        assert.calledOnce(sut.newTemplate);
        v.template = sut.newTemplate.args[0][0].nested;
      }
    },

    tearDown: function () {
      if (Meteor.isClient) {
        delete Bart.Test;
      }
      v = null;
    },

    "test compile hash": function () {
      if (Meteor.isClient) {
        var t0 = v.template.TOne;
      } else {
        var t0 = v.template[0];
      }
      assert.equals(t0.nodes[1].slice(0,2), ['', 'field']);
      assert.equals(t0.nodes[1].slice(2), ['"name', ['=', 'type', '"simple'], ['=', 'count', 2]]);
    },
  });
})();
