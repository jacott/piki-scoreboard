define(function (require, exports, module) {
  var test, v;
  var TH = require('test-helper');
  var Event = require('./event');
  var koru = require('koru');

  TH.testCase(module, {
    setUp: function () {
      test = this;
      v = {};
      test.stub(koru, 'info');
    },

    tearDown: function () {
      TH.clearDB();
      v = null;
    },

    'test creation': function () {
      var teamType = TH.Factory.createTeamType({_id: 'tt1'});
      var event=TH.Factory.createEvent();

      assert(Event.exists(event._id));

      assert(event.org);
      assert.equals(event.teamType_ids, ['tt1']);
    },

    'test standard validators': function () {
      var validators = Event._fieldValidators;

      assert.validators(validators.name, {maxLength: [200], required: [true], trim: [true], unique: [{scope: 'org_id'}]});
      assert.validators(validators.date, {inclusion: [{matches: /^\d{4}-[01]\d-[0-3]\d$/ }]});
      assert.validators(validators.closed, {boolean: ['trueOnly']});
    },

    "test describeFormat": function () {
      // All types of rounds included
      assert.same(Event.describeFormat('LQQF201F101F90F26F8'), 'Qualifier 1; Qualifier 2; Round of 201 competitors; '+
                  'Round of 101 competitors; Quarter-final (90 competitors); Semi-final (26 competitors); Final (8 competitors)');
      assert.same(Event.describeFormat('BQ:18F100:6F30:6F20:4F6:4'), 'Qualifier 1 (18 problems); '+
                  'Round of 100 competitors (6 problems); Quarter-final (30 competitors; 6 problems); '+
                  'Semi-final (20 competitors; 4 problems); Final (6 competitors; 4 problems)');

      // No qualification rounds
      assert.same(Event.describeFormat('LF201F101F90F26F8'), 'Round of 201 competitors; Round of 101 competitors; '+
                  'Quarter-final (90 competitors); Semi-final (26 competitors); Final (8 competitors)');
      assert.same(Event.describeFormat('BF100:6F30:6F20:4F6:4'), 'Round of 100 competitors (6 problems); '+
                  'Quarter-final (30 competitors; 6 problems); Semi-final (20 competitors; 4 problems); '+
                  'Final (6 competitors; 4 problems)');

      // No final rounds
      assert.same(Event.describeFormat('LQQ'), 'Qualifier 1; Qualifier 2');
      assert.same(Event.describeFormat('BQ:18'), 'Qualifier 1 (18 problems)');

      // IFSC usual format
      assert.same(Event.describeFormat('LQQF26F8'), 'Qualifier 1; Qualifier 2; Semi-final (26 competitors); '+
                  'Final (8 competitors)');
      assert.same(Event.describeFormat('BQ:5F20:4F6:4'), 'Qualifier 1 (5 problems); '+
                  'Semi-final (20 competitors; 4 problems); Final (6 competitors; 4 problems)');

      // CNZ usual format
      assert.same(Event.describeFormat('LQQF8'), 'Qualifier 1; Qualifier 2; Final (8 competitors)');
      assert.same(Event.describeFormat('BQ:8F6:3'), 'Qualifier 1 (8 problems); Final (6 competitors; 3 problems)');

    },

    "//test Team score simple"() {
      let tt1 = TH.Factory.createTeamType();
      let team1 = TH.Factory.createTeam();
      let team2 = TH.Factory.createTeam();
      let tt2 = TH.Factory.createTeamType();
      let team3 = TH.Factory.createTeam();
      let cat1 = TH.Factory.createCategory();
      let cat2 = TH.Factory.createCategory();


      let event = TH.Factory.createEvent({teamType_ids: [tt1._id, tt2._id]});
      let compet1 = TH.Factory.createCompetitor({team_ids: [team1._id, team3._id], category_ids: [cat1._id, cat2._id]});
      let compet2 = TH.Factory.createCompetitor({team_ids: [team2._id], category_ids: [cat1._id]});
      let compet3 = TH.Factory.createCompetitor({team_ids: [team1._id, team3._id]});
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
