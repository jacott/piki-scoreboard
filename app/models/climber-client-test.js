define(function (require, exports, module) {
  var test, v;
  const session    = require('koru/session');
  const message    = require('koru/session/message');
  const util       = require('koru/util');
  const Competitor = require('models/competitor');
  const Result     = require('models/result');
  const TH         = require('test-helper');
  const Climber    = require('./climber');

  TH.testCase(module, {
    setUp: function () {
      test = this;
      v = {};
    },

    tearDown: function () {
      TH.clearDB();
      v = null;
    },

    "test broadcasted mergeClimbers"() {
      const dest = TH.Factory.createClimber();

      const c2 = TH.Factory.createClimber();
      const comp21 = TH.Factory.createCompetitor();
      const comp22 = TH.Factory.createCompetitor();
      const result21 = TH.Factory.createResult();

      const c3 = TH.Factory.createClimber();
      const comp31 = TH.Factory.createCompetitor();
      const result31 = TH.Factory.createResult();

      const c4 = TH.Factory.createClimber();
      const comp41 = TH.Factory.createCompetitor();
      const result41 = TH.Factory.createResult();

      session._onMessage(v.conn, message.encodeMessage('B', ['mergeClimbers', dest._id, [c2._id, c3._id]], session.globalDict));

      assert.same(Climber.query.count(), 2);
      assert.same(comp41.$reload(true).climber_id, c4._id);
      assert.same(comp22.$reload(true).climber_id, dest._id);
      assert.same(comp31.$reload(true).climber_id, dest._id);
      assert.same(comp21.$reload(true).climber_id, dest._id);

      assert.same(result21.$reload(true).climber_id, dest._id);
      assert.same(result31.$reload(true).climber_id, dest._id);
      assert.same(result41.$reload(true).climber_id, c4._id);
    },

    "test team"() {
      v.tt = TH.Factory.createList(2, 'createTeamType');
      v.teams1 = TH.Factory.createList(2, 'createTeam', function (index, options) {
        options.teamType_id = v.tt[0]._id;
      });

      v.teams2 = TH.Factory.createList(2, 'createTeam', function (index, options) {
        options.teamType_id = v.tt[1]._id;
      });

      let climber = TH.Factory.createClimber({team_ids: [v.teams1[0]._id]});
      let climber2 = TH.Factory.createClimber();

      assert.equals(climber.team(v.tt[0]), TH.matchModel(v.teams1[0]));
      assert.equals(climber2.team(v.tt[0]), undefined);

    },

    "test search": function () {
      var names = ['Bob', 'brendon', 'bobby', 'robert'];
      v.climbers = TH.Factory.createList(4, 'createClimber', function (index, options) {
        options.name = names[index];
      });

      assert.equals(Climber.search('berty'), []);

      assert.equals(util.mapField(Climber.search('e'), 'name'),
                    ['brendon', 'robert']);

      assert.equals(util.mapField(Climber.search('bo'), 'name'),
                    ['Bob', 'bobby']);

      assert.equals(util.mapField(Climber.search('b'), 'name'),
                    ['Bob', 'bobby', 'brendon', 'robert']);

      assert.equals(util.mapField(Climber.search('b',2), 'name'),
                    ['Bob', 'brendon']);

      assert.equals(
        util.mapField(Climber.search('b',2, function (climber) {
          return climber.name !== 'Bob';
        }), 'name'),
        ['bobby', 'brendon']);
    },
  });
});
