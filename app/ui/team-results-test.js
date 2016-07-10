isClient && define(function (require, _, module) {
  var test, v;
  const Route       = require('koru/ui/route');
  const TeamRanking = require('models/team-ranking');
  const App         = require('ui/app');
  const EventTpl    = require('ui/event');
  const TeamHelper  = require('ui/team-helper');
  const sut         = require('./team-results');
  const TH          = require('./test-helper');

  TH.testCase(module, {
    setUp() {
      test = this;
      v = {};
      v.org =  TH.Factory.createOrg();
      TH.login();
      TH.setOrg(v.org);
      v.tt1 = TH.Factory.createTeamType({_id: 'tt1'});
      v.team1 = TH.Factory.createTeam({_id: 'team1'});
      v.team2 = TH.Factory.createTeam({_id: 'team2'});
      v.tt2 = TH.Factory.createTeamType({_id: 'tt2'});
      v.team3 = TH.Factory.createTeam({_id: 'team3'});
      TeamHelper.teamType_id = 'tt1';
      v.event = TH.Factory.createEvent({teamType_ids: ['tt1', 'tt2']});

      v.eventSub = test.stub(App, 'subscribe').withArgs('Event').returns({stop: v.stop = test.stub()});
      v.results = {tt1: {team1: 260, team2: 300}, tt2: {team3: 160}};
      test.stub(TeamRanking, 'getTeamScores').withArgs(v.event).returns(v.results);
    },

    tearDown() {
      TH.tearDown();
      v = null;
    },

    "test show event team results"() {
      Route.gotoPage(EventTpl.Show, {eventId: v.event._id});

      assert.dom('#Event', function () {
        TH.click('.link[name=teamResults]');
      });

      assert.dom('#TeamResults', function () {
        assert.dom('table.list>tbody', function () {
          assert.dom('tr:first-child', function () {
            assert.dom('td.name', v.team2.name);
            assert.dom('td.points', 300);
          });
          assert.dom('tr:last-child', function () {
            assert.dom('td.name', v.team1.name);
            assert.dom('td.points', 260);
          });
        });

        TH.selectMenu('[name=selectTeamType]', 'tt2');

         assert.dom('table.list>tbody', function () {
          assert.dom('tr:first-child', function () {
            assert.dom('td.name', v.team3.name);
            assert.dom('td.points', 160);
          });
        });
      });
    },
  });
});
