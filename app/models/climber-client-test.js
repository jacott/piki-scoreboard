define(function (require, exports, module) {
  var test, v;
  var TH = require('test-helper');
  var Climber = require('./climber');
  var util = require('koru/util');

  TH.testCase(module, {
    setUp: function () {
      test = this;
      v = {};
    },

    tearDown: function () {
      TH.clearDB();
      v = null;
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
