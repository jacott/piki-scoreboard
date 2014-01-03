(function () {
  buster.testCase('packages/app-models/validators/text-validators:', {
    setUp: function () {
    },

    tearDown: function () {
    },

    "normalize": {
      "test downcase": function () {
        var doc = {name: 'mixedCase'};

        AppVal.validators('normalize')(doc,'name', 'downcase');

        refute(doc._errors);

        assert.same(doc.name, 'mixedcase');

        AppVal.validators('normalize')(doc,'noName', 'downcase');

        refute(doc._errors);

        assert.equals(doc, {name: 'mixedcase'});
      },
    },

    'boolean': {
      "test set true": function () {
        var doc;

        ['trUe  ', 'T', ' 1', 'on'].forEach(function (val) {
          doc = {isSet: val};
          AppVal.validators('boolean')(doc,'isSet');
          refute(doc._errors);

          assert.same(doc.isSet, true, 'for val "'+val+'"');
        });

      },

      "test set false": function () {
        var doc;

        [' FALSE  ', 'f', ' 0', 'off'].forEach(function (val) {
          doc = {isSet: val};
          AppVal.validators('boolean')(doc,'isSet');
          refute(doc._errors);

          assert.same(doc.isSet, false, 'for val "'+val+'"');
        });

      },

      "test if null": function () {
        var doc = {};

        AppVal.validators('boolean')(doc,'isSet');
        refute(doc._errors);
      },

      "test set invalid": function () {
        var doc;

        [' FALS  ', 'tru', '  '].forEach(function (val) {
          doc = {isSet: val};
          AppVal.validators('boolean')(doc,'isSet');
          assert(doc._errors);
          assert.equals(doc._errors['isSet'],[['not_a_boolean']]);

          assert.same(doc.isSet, val);
        });

      },
    },

    'number': {
      "test min value": function () {
        var doc = {order: 123};

        AppVal.validators('number')(doc,'order', {$gte: 123});
        refute(doc._errors);

        AppVal.validators('number')(doc,'order', {$gt: 122});
        refute(doc._errors);

        AppVal.validators('number')(doc,'order', {$gte: 124});
        assert(doc._errors);
        assert.equals(doc._errors['order'],[['cant_be_less_than', 124]]);

        doc = {order: 123};

        AppVal.validators('number')(doc,'order', {$gt: 123});
        assert(doc._errors);
        assert.equals(doc._errors['order'],[['must_be_greater_than', 123]]);
      },

      "test negative": function () {
        var doc = {order: -4};
        AppVal.validators('number')(doc,'order', {integer: true, $gte: 0, $lt: 999});
        assert(doc._errors);
        assert.equals(doc._errors['order'],[['cant_be_less_than', 0]]);
      },

      "test max value": function () {
        var doc = {order: 123};

        AppVal.validators('number')(doc,'order', {$lte: 123});
        refute(doc._errors);

        AppVal.validators('number')(doc,'order', {$lt: 124});
        refute(doc._errors);

        AppVal.validators('number')(doc,'order', {$lte: 122});
        assert(doc._errors);
        assert.equals(doc._errors['order'],[['cant_be_greater_than', 122]]);

        doc = {order: 123};

        AppVal.validators('number')(doc,'order', {$lt: 123});
        assert(doc._errors);
        assert.equals(doc._errors['order'],[['must_be_less_than', 123]]);
      },

      "test integer": function () {
        var doc = {order: 123};

        AppVal.validators('number')(doc,'order', {integer: true});
        refute(doc._errors);

        doc.order = 123.45;

        AppVal.validators('number')(doc,'order', {integer: true});
        assert(doc._errors);
        assert.equals(doc._errors['order'],[['not_an_integer']]);
      },

      'test valid': function () {
        var doc = {order: 123};

        AppVal.validators('number')(doc,'order');
        refute(doc._errors);

        doc.order = 0;
        AppVal.validators('number')(doc,'order');
        refute(doc._errors);
      },

      'test string as number': function () {
         var doc = {order: '0xabc'};

        AppVal.validators('number')(doc,'order');
        refute(doc._errors);

        assert.same(doc.order,0xabc);
      },

      'test invalid': function () {
        var doc = {order: 'abc'};

        AppVal.validators('number')(doc,'order');
        assert(doc._errors);
        assert.equals(doc._errors['order'],[['not_a_number']]);
      },
    },

    'trim': {
      'test invalid': function () {
        var doc = {name: 123};

        AppVal.validators('trim')(doc,'name');
        assert(doc._errors);
        assert.equals(doc._errors['name'],[['not_a_string']]);
      },

      "test toNull": function () {

        var doc = {name: '  '};

        AppVal.validators('trim')(doc,'name', 'toNull');

        refute(doc._errors);
        assert.same(doc.name, null);

      },

      'test trims': function () {
        var doc = {name: '  in  the middle  '};

        AppVal.validators('trim')(doc,'name');
        refute(doc._errors);
        assert.same(doc.name, 'in  the middle');
      },
    },

    'color': {
      'test valid': function () {
        var colors = ['#acb', '#000', '#000000', '#12ab34', '#fff', '#ffffff'],
            doc = {color: ''};

        for(var i=0,item;item=colors[i];++i) {
          doc.color = item;
          AppVal.validators('color')(doc,'color');
          refute(doc._errors);
        }
      },

      'test invalid': function () {
        var colors = ['#ac', '#0000', '#0000001', '#12ab3g', 'fff', '#Ffffff'],
            doc = {color: ''};

        for(var i=0,item;item=colors[i];++i) {
          doc.color = item;
          doc._errors = {};
          AppVal.validators('color')(doc,'color');

          assert.equals(doc._errors['color'],[['is_invalid']]);
        }
      },
    },
  });
})();