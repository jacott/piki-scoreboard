var Future = Npm.require('fibers/future');

Meteor.methods({
  'Reg.upload': function (eventId, data) {
    check(eventId, String);

    var ROLE = AppModel.User.ROLE;

    var user = AppModel.User.findOne({
      _id: this.userId,
      role: {$in: [ROLE.superUser, ROLE.admin]}});

    AppVal.allowAccessIf(user);

    var event = AppModel.Event.findOne({_id: eventId});

    AppVal.allowAccessIf(event);

    user.isSuperUser() || AppVal.allowAccessIf(event.org_id === user.org_id);

    var future = new Future();

    CSV()
      .from.string(
        new Buffer(data), {columns: true})
      .to.array( function(rows){
        data = rows;
        future.return();
      }, {columns: ['Fee level', 'First Name', 'Last Name', 'Birth Date', 'Participant ID']});

    future.wait();

    var errors = [];
    var row;

    if (data.length === 1)
      throw new Meteor.Error(415, 'unsupported_import_format');


    for(var i = 0; i < data.length; ++i) {
      try {
        row =  data[i];
        importCompetitor();
      } catch(ex) {
        errors.push([i+1, data[i], ex.toString()]);
      }
    };

    AppModel.Event.fencedUpdate(event._id, {$set: {errors: errors}});

    function importCompetitor() {
      var name = get('First Name') + ' ' + get('Last Name');

      var meta = get('Fee level');

      var clubName = meta.split(',')[0].trim();

      var club = AppModel.Club.findOne({name: clubName, org_id: event.org_id});
      if (! club) throw "Can't find club '" + clubName + "'";

      var codes = /\[(.+)\]/.exec(meta);

      codes = codes && codes[1].trim().split(',');

      var gender = (codes && codes[0][0]) || null;
      gender = gender && gender.toLowerCase();

      var climber = AppModel.Climber.findOne({name: name, org_id: event.org_id});

      if (! climber) {
        climber = AppModel.Climber.build({
          name: name, org_id: event.org_id, club_id: club._id,
          dateOfBirth: get('Birth Date').trim(),
          gender: gender,
          uploadId: get('Participant ID'),
        });
      }

      if (climber.dateOfBirth !== get('Birth Date').trim())
        throw "Climber's date-of-birth does not match: " + climber.dateOfBirth;

      if (! climber.$isValid())
        throw "Climber: " + AppVal.inspectErrors(climber);
      climber.$save();

      if (! (codes && codes.length))
        throw "Invalid or missing codes";

      var category_ids = [];

      codes.forEach(function (code) {
        code = code.trim();
        var cat = AppModel.Category.findOne({shortName: code});
        if (! cat) {
          throw "Category not found: " + code;
        }
        category_ids.push(cat._id);
      });


      var competitor = AppModel.Competitor.findOne({event_id: event._id, climber_id: climber._id}) ||
            AppModel.Competitor.build({event_id: event._id, climber_id: climber._id});

      competitor.category_ids = category_ids.sort();
      competitor.$$save();
    }

    function get(field) {
      var val = row[field];
      return val && val.trim();
    }
  },

});
