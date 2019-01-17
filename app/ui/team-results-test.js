isClient && define((require, exports, module)=>{
  const Route           = require('koru/ui/route');
  const Ranking         = require('models/ranking');
  const EventSub        = require('pubsub/event-sub');
  const EventTpl        = require('ui/event');
  const TeamHelper      = require('ui/team-helper');
  const sut             = require('./team-results');
  const TH              = require('./test-helper');

  const {stub, spy, onEnd} = TH;

  let v = {};
  TH.testCase(module, ({beforeEach, afterEach, group, test})=>{
    beforeEach(()=>{
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
      v.tt3 = TH.Factory.createTeamType({_id: 'tt3'});

      v.eventSub = stub(EventSub, 'subscribe').returns({stop: v.stop = stub()});
      v.results = {tt1: {team1: 260, team2: 300}, tt2: {team3: 160}};
      stub(Ranking, 'getTeamScores').withArgs(v.event).returns(v.results);
    });

    afterEach(()=>{
      TeamHelper.teamType_id = null;
      TH.tearDown();
      v = {};
    });

    test("show event team results", ()=>{
      Route.gotoPage(EventTpl.Show, {eventId: v.event._id});

      assert.dom('#Event', function () {
        TH.click('[name=TeamResults]');
      });

      assert.dom('#TeamResults', function () {
        assert.dom('table.list>thead', function () {
          assert.dom('th.name', function () {
            assert.dom('span', v.tt1.name);
            assert.dom('[name=selectTeamType]');
          });
        });
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

        TH.selectMenu('[name=selectTeamType]', 'tt2', function () {
          assert.dom(this.parentNode, function () {
            assert.dom('li', {count: 2});
            assert.dom('li', v.tt1.name);
          });
          TH.click(this);
        });

        assert.dom('th.name>span', v.tt2.name);

         assert.dom('table.list>tbody', function () {
          assert.dom('tr:first-child', function () {
            assert.dom('td.name', v.team3.name);
            assert.dom('td.points', 160);
          });
        });
      });
    });
  });
});
