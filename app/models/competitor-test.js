define((require, exports, module)=>{
  const Team            = require('models/team');
  const TH              = require('test-helper');
  const Category        = require('./category');

  const Competitor = require('./competitor');

  TH.testCase(module, ({beforeEach, afterEach, group, test})=>{
    afterEach(()=>{
      TH.clearDB();
    });

    test("creation", ()=>{
      const team = TH.Factory.createTeam();
      const competitor=TH.Factory.createCompetitor();

      assert(Competitor.exists(competitor._id));

      assert(competitor.event);
      assert(competitor.climber);
      assert.equals(competitor.team_ids, [team._id]);
      assert(Category.exists({org_id: competitor.event.org_id, _id: competitor.category_ids[0]}));
    });

    test("null team_ids", ()=>{
      const competitor = new Competitor();

      assert.equals(competitor.team_ids, []);
    });

    test("standard validators", ()=>{
      const validators = Competitor._fieldValidators;

      assert.validators(validators.number, {number: [{integer: true, $gt: 0}]});
    });


    test("changing number updates climber", ()=>{
      let climber = TH.Factory.createClimber({number: 123});
      let competitor = TH.Factory.buildCompetitor({climber_id: climber._id, number: 345});
      competitor.$$save();
      assert.equals(climber.$reload().number, 345);

      competitor.$update('number', 567);
      assert.equals(climber.$reload().number, 567);

      competitor.$update('number', undefined);
      assert.equals(climber.$reload().number, undefined);
    });

    test("changing teams updates climber", ()=>{
      let tt1 = TH.Factory.createTeamType();
      let team1 = TH.Factory.createTeam({_id: 'team1'});
      let team2 = TH.Factory.createTeam({_id: 'team2'});
      let tt2 = TH.Factory.createTeamType();
      let team3 = TH.Factory.createTeam({_id: 'team3'});
      let climber = TH.Factory.createClimber({team_ids: [team3._id, team2._id]});
      TH.Factory.createEvent({teamType_ids: [tt1._id]});
      let competitor = TH.Factory.buildCompetitor({climber_id: climber._id, team_ids: [team1._id]});
      competitor.$$save();
      assert.equals(climber.$reload().team_ids, [team3._id, team1._id]);

      competitor.$update('team_ids', [team2._id]);
      assert.equals(climber.$reload().team_ids, [team3._id, team2._id]);

      competitor.$update('team_ids', []);
      assert.equals(climber.$reload().team_ids, [team3._id, team2._id]);
    });
  });
});
