define((require, exports, module)=>{
  const session         = require('koru/session');
  const message         = require('koru/session/message');
  const util            = require('koru/util');
  const Competitor      = require('models/competitor');
  const Result          = require('models/result');
  const TH              = require('test-helper');
  const Factory         = require('test/factory');
  const Climber         = require('./climber');

  TH.testCase(module, ({beforeEach, afterEach, group, test})=>{
    afterEach(()=>{
      TH.clearDB();
    });

    test("broadcasted mergeClimbers", ()=>{
      const dest = Factory.createClimber();

      const c2 = Factory.createClimber();
      const comp21 = Factory.createCompetitor();
      const comp22 = Factory.createCompetitor();
      const result21 = Factory.createResult();

      const c3 = Factory.createClimber();
      const comp31 = Factory.createCompetitor();
      const result31 = Factory.createResult();

      const c4 = Factory.createClimber();
      const comp41 = Factory.createCompetitor();
      const result41 = Factory.createResult();

      session._onMessage(undefined, message.encodeMessage('B', [
        'mergeClimbers', dest._id, [c2._id, c3._id]], session.globalDict));

      assert.same(Climber.query.count(), 2);
      assert.same(comp41.$reload(true).climber_id, c4._id);
      assert.same(comp22.$reload(true).climber_id, dest._id);
      assert.same(comp31.$reload(true).climber_id, dest._id);
      assert.same(comp21.$reload(true).climber_id, dest._id);

      assert.same(result21.$reload(true).climber_id, dest._id);
      assert.same(result31.$reload(true).climber_id, dest._id);
      assert.same(result41.$reload(true).climber_id, c4._id);
    });

    test("team", ()=>{
      const tt = Factory.createList(2, 'createTeamType');
      const teams1 = Factory.createList(2, 'createTeam', (index, options)=>{
        options.teamType_id = tt[0]._id;
      });

      const teams2 = Factory.createList(2, 'createTeam', (index, options)=>{
        options.teamType_id = tt[1]._id;
      });

      let climber = Factory.createClimber({team_ids: [teams1[0]._id]});
      let climber2 = Factory.createClimber();

      assert.equals(climber.getTeam(tt[0]), TH.matchModel(teams1[0]));
      assert.equals(climber2.getTeam(tt[0]), undefined);

    });

    test("search", ()=>{
      const names = ['Bob', 'brendon', 'bobby', 'robert'];
      const climbers = Factory.createList(4, 'createClimber', (index, options)=>{
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
        util.mapField(Climber.search('b',2, climber => climber.name !== 'Bob'), 'name'),
        ['bobby', 'brendon']);
    });
  });
});
