define((require, exports, module)=>{
  const TH              = require('test-helper');

  const Event = require('./event');

  TH.testCase(module, ({before, beforeEach, afterEach, group, test})=>{
    before(()=>{
      TH.noInfo();
    });

    afterEach(()=>{
      TH.clearDB();
    });

    test("creation", ()=>{
      var teamType = TH.Factory.createTeamType({_id: 'tt1'});
      var event=TH.Factory.createEvent();

      assert(Event.exists(event._id));

      assert(event.org);
      assert.equals(event.teamType_ids, ['tt1']);
      assert.equals(event.ruleVersion, 1);
    });

    test("standard validators", ()=>{
      var validators = Event._fieldValidators;

      assert.validators(validators.name, {
        maxLength: [200], required: [true], trim: [true],
        unique: [{scope: ['org_id', 'series_id']}]});
      assert.validators(validators.ruleVersion, {
        required: ['not_null'], number: [{integer: true, $gte: 0, $lte: 1}]});
      assert.validators(validators.date, {inclusion: [{matches: /^\d{4}-[01]\d-[0-3]\d$/ }]});
      assert.validators(validators.closed, {boolean: ['trueOnly']});
    });

    test("describeFormat", ()=>{
      // All types of rounds included
      assert.same(Event.describeFormat('LQQF201F101F90F26F8'),
                  'Qualifier 1; Qualifier 2; Round of 201 competitors; '+
                  'Round of 101 competitors; Quarter-final (90 competitors); '+
                  'Semi-final (26 competitors); Final (8 competitors)');
      assert.same(Event.describeFormat('BQ:18F100:6F30:6F20:4F6:4'), 'Qualifier 1 (18 problems); '+
                  'Round of 100 competitors (6 problems); Quarter-final (30 competitors; 6 problems); '+
                  'Semi-final (20 competitors; 4 problems); Final (6 competitors; 4 problems)');

      // No qualification rounds
      assert.same(Event.describeFormat('LF201F101F90F26F8'),
                  'Round of 201 competitors; Round of 101 competitors; '+
                  'Quarter-final (90 competitors); Semi-final (26 competitors); Final (8 competitors)');
      assert.same(Event.describeFormat('BF100:6F30:6F20:4F6:4'),
                  'Round of 100 competitors (6 problems); '+
                  'Quarter-final (30 competitors; 6 problems); '+
                  'Semi-final (20 competitors; 4 problems); '+
                  'Final (6 competitors; 4 problems)');

      // No final rounds
      assert.same(Event.describeFormat('LQQ'), 'Qualifier 1; Qualifier 2');
      assert.same(Event.describeFormat('BQ:18'), 'Qualifier 1 (18 problems)');

      // IFSC usual format
      assert.same(Event.describeFormat('LQQF26F8'),
                  'Qualifier 1; Qualifier 2; Semi-final (26 competitors); '+
                  'Final (8 competitors)');
      assert.same(Event.describeFormat('BQ:5F20:4F6:4'), 'Qualifier 1 (5 problems); '+
                  'Semi-final (20 competitors; 4 problems); Final (6 competitors; 4 problems)');

      // CNZ usual format
      assert.same(Event.describeFormat('LQQF8'), 'Qualifier 1; Qualifier 2; Final (8 competitors)');
      assert.same(Event.describeFormat('BQ:8F6:3'),
                  'Qualifier 1 (8 problems); Final (6 competitors; 3 problems)');

    });

    test("series", ()=>{
      const series = TH.Factory.createSeries();
      const ev = TH.Factory.createEvent({series_id: series._id});
      const ev2 = TH.Factory.createEvent();

      assert.same(ev.displayName, 'Series 1 - Event 1');
      assert.same(ev2.displayName, 'Event 2');
    });

    group("heat validation", ()=>{
      let org, cat, oOrg, oCat, event, heats;
      beforeEach(()=>{
        oOrg = TH.Factory.createOrg();
        oCat = TH.Factory.createCategory();

        org = TH.Factory.createOrg();
        cat = TH.Factory.createCategory();

        event = TH.Factory.createEvent();
        heats = event.$change('heats');
      });

      test("okay", ()=>{
        heats[cat._id] = 'LQF8F2';

        assert.msg(TH.showErrors(event))(event.$isValid());
      });

      test("wrong org", ()=>{
        delete heats[cat._id];
        heats[oCat._id] = 'LQF8F2';

        assert.accessDenied(()=>{
          event.$isValid();
        });
      });

      test("wrong heat format", ()=>{
        heats[cat._id] = 'LQF8F2X';

        refute(event.$isValid());

        assert.modelErrors(event, {heats: 'is_invalid'});
      });

      test("wrong category type", ()=>{
        heats[cat._id] = 'BQF8F2';

        refute(event.$isValid());

        assert.modelErrors(event, {heats: 'is_invalid'});
      });

    });
  });
});
