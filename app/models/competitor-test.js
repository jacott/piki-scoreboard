define((require, exports, module) => {
  const Category        = require('./category');
  const Team            = require('models/team');
  const TH              = require('test-helper');
  const Factory         = require('test/factory');

  const Competitor = require('./competitor');

  TH.testCase(module, ({beforeEach, afterEach, group, test}) => {
    beforeEach(async () => {
      await TH.startTransaction();
    });

    afterEach(async () => {
      await TH.rollbackTransaction();
    });

    test('creation', async () => {
      const team = await Factory.createTeam();
      const competitor = await Factory.createCompetitor();

      assert(await Competitor.exists(competitor._id));

      assert(competitor.event);
      assert(competitor.climber);
      assert.equals(competitor.team_ids, [team._id]);
      assert(await Category.exists({org_id: competitor.event.org_id, _id: competitor.category_ids[0]}));
    });

    test('null team_ids', () => {
      const competitor = new Competitor();

      assert.equals(competitor.team_ids, []);
    });

    test('standard validators', () => {
      const validators = Competitor._fieldValidators;

      assert.validators(validators.number, {number: [{integer: true, $gt: 0}]});
    });

    test('changing number updates climber', async () => {
      let climber = await Factory.createClimber({number: 123});
      let competitor = await Factory.buildCompetitor({climber_id: climber._id, number: 345});
      await competitor.$$save();
      assert.equals(climber.$reload().number, 345);

      await competitor.$update('number', 567);
      assert.equals(climber.$reload().number, 567);

      await competitor.$update('number', undefined);
      assert.equals(climber.$reload().number, undefined);
    });

    test('changing teams updates climber', async () => {
      let tt1 = await Factory.createTeamType();
      let team1 = await Factory.createTeam({_id: 'team1'});
      let team2 = await Factory.createTeam({_id: 'team2'});
      let tt2 = await Factory.createTeamType();
      let team3 = await Factory.createTeam({_id: 'team3'});
      let climber = await Factory.createClimber({team_ids: [team3._id, team2._id]});
      await Factory.createEvent({teamType_ids: [tt1._id]});
      let competitor = await Factory.buildCompetitor({climber_id: climber._id, team_ids: [team1._id]});
      await competitor.$$save();
      assert.equals(climber.$reload().team_ids, [team3._id, team1._id]);

      await competitor.$update('team_ids', [team2._id]);
      assert.equals(climber.$reload().team_ids, [team3._id, team2._id]);

      await competitor.$update('team_ids', []);
      assert.equals(climber.$reload().team_ids, [team3._id, team2._id]);
    });
  });
});
