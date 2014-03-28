(function (test, v) {
  var AL = AppModel.AccessLevel;
  buster.testCase('models/server/reg-upload:', {
    setUp: function () {
      test = this;
      v = {};
      v.org =TH.Factory.createOrg();
      v.user = TH.Factory.createUser({role: AppModel.User.ROLE.admin});
      v.event = TH.Factory.createEvent({heats: undefined});
      v.club = TH.Factory.createClub({name: 'Rock Hoppers'});
      v.fjl = TH.Factory.createCategory({shortName: 'FJL', gender: 'f', name: 'Female Junior Lead', group: 'Youth Lead'});
      v.mjl = TH.Factory.createCategory({shortName: 'MJL', gender: 'm', name: 'Male Junior Lead', group: 'Youth Lead'});
      v.fol = TH.Factory.createCategory({shortName: 'FOL', gender: 'f', name: 'Female Open Lead', group: 'Open Lead'});
      v.sam = TH.Factory.createClimber({name: 'Sam Smith'});
      TH.loginAs(v.user);
    },

    tearDown: function () {
      v = null;
    },


    'test access denied': function () {
      try {TH.call('Reg.upload', '123', "this ain't valid csv;");}
      catch(e) {var ex = e;}

      assert(ex, "should have thrown an exception");
      assert.same(ex.error, 403, ex);
      assert.same(ex.reason, 'Access denied');
    },

    'test invalid file': function () {
      try {TH.call('Reg.upload', v.event._id, "this ain't valid csv;");}
      catch(e) {var ex = e;}

      assert(ex, "should have thrown an exception");
      assert.same(ex.error, 415, ex);
      assert.same(ex.reason, 'unsupported_import_format');
    },

    "test uploading": function () {
      var csv =
            '"Fee level","First Name","Last Name","Birth Date","Participant ID"\n' +
            '"Rock Hoppers,Junior (Early Bird) [FJL,FOL]","Anna","Smith","1996-04-16","149"\n' +
            '"Rock Hoppers,Junior (Early Bird) [MJL]","Sam","Smith","1996-04-16","148"\n' +
            '"Mountain Goats,Junior (Early Bird) [MJL]","Mark","Ford","1995-11-26","230"\n' +
            '"Rock Hoppers,Junior (Early Bird)","Henry","Smith","2002-04-16","147"\n';
      TH.call('Reg.upload', v.event._id, csv);

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

      var club = AppModel.Club.findOne({name: 'Rock Hoppers'});
      assert(club);

      var climber = AppModel.Climber.findOne({name: 'Anna Smith'});
      assert(climber);

      assert.same(climber.dateOfBirth, '1996-04-16');
      assert.same(climber.org_id, v.org._id);
      assert.same(climber.club_id, v.club._id);
      assert.same(climber.uploadId, '149');
      assert.same(climber.gender, 'f');


      var competitor = AppModel.Competitor.findOne({climber_id: climber._id});
      assert(competitor);

      assert.same(competitor.event_id, v.event._id);
      assert.equals(competitor.category_ids, [v.fjl._id, v.fol._id].sort());

      assert.equals(Object.keys(v.event.heats).sort(), [v.fjl._id, v.mjl._id, v.fol._id].sort());

      // check idempotencey
      TH.call('Reg.upload', v.event._id, csv);

      assert.same(AppModel.Competitor.find().count(), 2);
    },
  });
})();
