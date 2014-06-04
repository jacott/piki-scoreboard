define(function (require, exports, module) {
  var test, v;
  var TH = require('test-helper');
  var Event = require('./event');
  var env = require('koru/env');

  TH.testCase(module, {
    setUp: function () {
      test = this;
      v = {};
      test.stub(env, 'info');
    },

    tearDown: function () {
      TH.clearDB();
      v = null;
    },

    'test creation': function () {
      var event=TH.Factory.createEvent();

      assert(Event.exists(event._id));

      assert(event.org);
    },

    'test standard validators': function () {
      var validators = Event._fieldValidators;

      assert.validators(validators.name, {maxLength: [200], required: [true], trim: [true], unique: [{scope: 'org_id'}]});
      assert.validators(validators.date, {inclusion: [{matches: /^\d{4}-[01]\d-[0-3]\d$/ }]});
    },

    "heat validation": {
      setUp: function () {
        v.oOrg = TH.Factory.createOrg();
        v.oCat = TH.Factory.createCategory();

        v.org = TH.Factory.createOrg();
        v.cat = TH.Factory.createCategory();

        v.event = TH.Factory.createEvent();
        v.heats = v.event.$change('heats');
      },

      "test okay": function () {
        v.heats[v.cat._id] = 'LQF8F2';

        assert(v.event.$isValid(), TH.showErrors(v.event));
      },

      "test wrong org": function () {
        delete v.heats[v.cat._id];
        v.heats[v.oCat._id] = 'LQF8F2';

        assert.accessDenied(function () {
          v.event.$isValid();
        });
      },

      "test wrong heat format": function () {
        v.heats[v.cat._id] = 'LQF8F2X';

        refute(v.event.$isValid());

        assert.modelErrors(v.event, {heats: 'is_invalid'});
      },

      "test wrong category type": function () {
        v.heats[v.cat._id] = 'BQF8F2';

        refute(v.event.$isValid());

        assert.modelErrors(v.event, {heats: 'is_invalid'});
      },

    },
  });
});
