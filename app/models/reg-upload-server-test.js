define(function (require, exports, module) {
  var test, v;
  const koru       = require('koru');
  const session    = require('koru/session');
  const Climber    = require('models/climber');
  const Event      = require('models/event');
  const Team       = require('models/team');
  const User       = require('models/user');
  const TH         = require('test-helper');
  const Competitor = require('./competitor');
  require('./reg-upload-server');

  TH.testCase(module, {
    setUp: function () {
      test = this;
      v = {};
      v.org =TH.Factory.createOrg();
      v.user = TH.Factory.createUser({role: User.ROLE.admin});
      v.event = TH.Factory.createEvent({heats: undefined});
      v.clubType = TH.Factory.createTeamType({name: 'Club'});
      v.team = TH.Factory.createTeam({name: 'Rock Hoppers'});
      v.fjl = TH.Factory.createCategory({shortName: 'FJL', gender: 'f', name: 'Female Junior Lead', group: 'Youth Lead'});
      v.mjl = TH.Factory.createCategory({shortName: 'MJL', gender: 'm', name: 'Male Junior Lead', group: 'Youth Lead'});
      v.fol = TH.Factory.createCategory({shortName: 'FOL', gender: 'f', name: 'Female Open Lead', group: 'Open Lead'});
      v.sam = TH.Factory.createClimber({name: 'Sam Smith', dateOfBirth: '1996-04-16'});
      TH.loginAs(v.user);

      v.rpc = TH.mockRpc();
    },

    tearDown: function () {
      TH.clearDB();
      v = null;
    },

    'test access denied': function () {
      test.stub(koru, 'info');
      assert.exception(function () {
        v.rpc('Reg.upload', '123', "this ain't valid csv;");
      }, {error: 403, reason: 'Access denied'});
    },

    'test invalid file': function () {
      test.stub(koru, 'info');
      assert.exception(function () {
        v.rpc('Reg.upload', v.event._id, "this ain't valid csv;");
      }, {error: 415, reason: 'unsupported_import_format'});
    },

    "test uploading": function () {
      var csv =
            '"Fee level","First Name","Last Name","Birth Date","Participant ID"\n' +
            '"Rock Hoppers,Junior (Early Bird) [FJL,FOL]","Anna","Smith","1996-04-16","149"\n' +
            '"Rock Hoppers,Junior (Early Bird) [MJL]","Sam","Smith","1996-04-16","148"\n' +
            '"Mountain Goats,Junior (Early Bird) [MJL]","Mark","Ford","1995-11-26","230"\n' +
            '"Rock Hoppers,Junior (Early Bird)","Henry","Smith","2002-04-16","147"\n';

      v.rpc('Reg.upload', v.event._id, csv);

      assert.equals(v.event.$reload().attributes.errors, [[
        3, {
          'Fee level': 'Mountain Goats,Junior (Early Bird) [MJL]',
          'First Name': 'Mark',
          'Last Name': 'Ford',
          'Birth Date': '1995-11-26',
          'Participant ID': '230'}, "Can't find club 'Mountain Goats'"
      ],[
        4, {
          'Fee level': "Rock Hoppers,Junior (Early Bird)",
          'First Name': 'Henry',
          'Last Name': 'Smith',
          'Birth Date': '2002-04-16',
          'Participant ID': '147'}, "Invalid or missing codes",
      ]]);

      var club = Team.findBy('name', 'Rock Hoppers');
      assert(club);

      var climber = Climber.findBy('name', 'Anna Smith');
      assert(climber);

      assert.same(climber.dateOfBirth, '1996-04-16');
      assert.same(climber.org_id, v.org._id);
      assert.equals(climber.team_ids, [v.team._id]);
      assert.same(climber.uploadId, '149');
      assert.same(climber.gender, 'f');


      var competitor = Competitor.findBy('climber_id', climber._id);
      assert(competitor);

      assert.equals(competitor.team_ids, [v.team._id]);
      assert.same(competitor.event_id, v.event._id);
      assert.equals(competitor.category_ids, [v.fjl._id, v.fol._id].sort());

      assert.equals(Object.keys(v.event.heats).sort(), [v.fjl._id, v.mjl._id, v.fol._id].sort());

      assert.same(Competitor.query.count(), 2);

      // check idempotencey
      v.rpc('Reg.upload', v.event._id, csv);

      assert.same(Competitor.query.count(), 2);
    },
  });
});
