var Future = requirejs.nodeRequire('fibers/future');
var parse = require('csv-parse');

define(function(require, exports, module) {
  var session = require('koru/session');
  var Val = require('koru/model/validation');
  var User = require('models/user');
  var Event = require('models/event');
  var koru = require('koru');
  var Club = require('models/club');
  var Climber = require('models/climber');
  var Category = require('models/category');
  var Competitor = require('models/competitor');
  require('models/result');

  session.defineRpc('Reg.upload', function (eventId, data) {
    Val.ensureString(eventId);

    var ROLE = User.ROLE;

    var user = User.query.where({
      _id: this.userId,
      role: {$in: [ROLE.superUser, ROLE.admin]}}).fetchOne();

    Val.allowAccessIf(user);

    var event = Event.findById(eventId);

    Val.allowAccessIf(event);

    user.isSuperUser() || Val.allowAccessIf(event.org_id === user.org_id);

    var future = new Future();

    parse(new Buffer(data).toString(), {
      columns: function () {return ['Fee level', 'First Name', 'Last Name', 'Birth Date', 'Participant ID']}
    }, function(err, rows){
      if (err) return future.throw(err);
      data = rows;
      future.return();
    });

    future.wait();

    var errors = [];
    var row;
    var climbers = {};

    if (data.length === 0)
      throw new koru.Error(415, 'unsupported_import_format');

    for(var i = 0; i < data.length; ++i) {
      row =  data[i];
      var name = get('First Name') + ' ' + get('Last Name');
      if (name in climbers)
        ++climbers[name];
      else
        climbers[name] = 1;
    }

    for(var i = 0; i < data.length; ++i) {
      try {
        row =  data[i];
        importCompetitor();
      } catch(ex) {
        errors.push([i+1, data[i], ex.toString()]);
      }
    };

    Event.query.onId(event._id).update({errors: errors});

    function importCompetitor() {
      var name = get('First Name') + ' ' + get('Last Name');

      if (climbers[name] > 1)
        throw 'Name: "' + name + '" registered ' + climbers[name] + ' times';

      var meta = get('Fee level');

      var clubName = meta.split(',')[0].trim();

      var club = Club.query.where({name: clubName, org_id: event.org_id}).fetchOne();
      if (! club) throw "Can't find club '" + clubName + "'";

      var codes = /\[(.+)\]/.exec(meta);

      codes = codes && codes[1].trim().split(',');

      var gender = (codes && codes[0][0]) || null;
      gender = gender && gender.toLowerCase();

      var climber = Climber.query.where({name: name, org_id: event.org_id}).fetchOne();

      if (! climber) {
        climber = Climber.build({
          name: name, org_id: event.org_id, club_id: club._id,
          dateOfBirth: get('Birth Date').trim(),
          gender: gender,
          uploadId: get('Participant ID'),
        });
      }

      if (climber.dateOfBirth !== get('Birth Date').trim())
        throw "Climber's date-of-birth does not match: " + climber.dateOfBirth;

      if (! climber.$isValid())
        throw "Climber: " + Val.inspectErrors(climber);

      climber.$save();

      if (! (codes && codes.length))
        throw "Invalid or missing codes";

      var category_ids = [];

      codes.forEach(function (code) {
        code = code.trim();
        var cat = Category.query.where({shortName: code, org_id: event.org_id}).fetchOne();
        if (! cat) {
          throw "Category not found: " + code;
        }
        category_ids.push(cat._id);
      });

      var competitor = Competitor.query.where({event_id: event._id, climber_id: climber._id}).fetchOne() ||
            Competitor.build({event_id: event._id, climber_id: climber._id});

      competitor.category_ids = category_ids.sort();
      competitor.$$save();
    }

    function get(field) {
      var val = row[field];
      return val && val.trim();
    }
  });
});
