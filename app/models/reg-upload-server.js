const {parse} = require('csv-parse');

define((require, exports, module) => {
  'use strict';
  const koru            = require('koru');
  const Val             = require('koru/model/validation');
  const session         = require('koru/session');
  const util            = require('koru/util');
  const Category        = require('models/category');
  const Climber         = require('models/climber');
  const Competitor      = require('models/competitor');
  const Event           = require('models/event');
  require('models/result');
  const Team            = require('models/team');
  const TeamType        = require('models/team-type');
  const User            = require('models/user');

  session.defineRpc('Reg.upload', async function (eventId, data) {
    Val.ensureString(eventId);

    const {ROLE} = User;

    const user = await User.findById(this.userId);
    Val.allowAccessIf(user);

    const event = await Event.findById(eventId);
    Val.allowAccessIf(event && await user.canAdminister(event));

    const clubTeamType = await TeamType.where({org_id: event.org_id, name: 'Club'}).fetchOne();
    Val.allowAccessIf(clubTeamType, 'No Team type named Club found for this organization');

    const errors = [];
    const climbers = {};
    let row;

    const get = (field) => {
      const val = row[field];
      return val && val.trim();
    };

    await new Promise((resolve, reject) => {
      parse(Buffer.from(data).toString(), {
        bom: true,
        columns: true,
      }, (err, rows) => {
        if (err) return reject(err);
        data = rows;
        resolve();
      });
    });

    if (data.length === 0) {
      throw new koru.Error(415, 'unsupported_import_format');
    }

    for (let i = 0; i < data.length; ++i) {
      row = data[i];
      var name = get('First Name') + ' ' + get('Last Name');
      if (name in climbers) {
        ++climbers[name];
      } else {
        climbers[name] = 1;
      }
    }

    const importCompetitor = async () => {
      const name = get('First Name') + ' ' + get('Last Name');

      if (climbers[name] > 1) {
        throw 'Name: "' + name + '" registered ' + climbers[name] + ' times';
      }

      const meta = get('Fee level');

      if (meta === undefined) throw ('Missing "Fee level" field');

      const clubName = meta.split(',')[0].trim();

      const club = await Team.query.where({name: clubName, teamType_id: clubTeamType._id}).fetchOne();
      if (club === undefined) throw "Can't find club '" + clubName + "'";

      const mCodes = /\[(.+)\]/.exec(meta);

      const codes = mCodes === null ? undefined : mCodes[1].trim().split(',');

      let gender = (codes?.[0][0]) ?? null;
      gender = gender && gender.toLowerCase();

      const climber = await Climber.query.where({name, org_id: event.org_id}).fetchOne() ??
            Climber.build({
              name, org_id: event.org_id, team_ids: [club._id],
              dateOfBirth: get('Birth Date').trim(),
              gender,
              uploadId: get('Participant ID'),
            });

      if (climber.dateOfBirth !== get('Birth Date').trim()) {
        throw "Climber's date-of-birth does not match: " + climber.dateOfBirth;
      }

      if (! await climber.$isValid()) {
        throw 'Climber: ' + Val.inspectErrors(climber);
      }

      await climber.$save();

      if (! (codes && codes.length)) {
        throw 'Invalid or missing codes';
      }

      const category_ids = [];

      for (let code of codes) {
        code = code.trim();
        var cat = await Category.query.where({shortName: code, org_id: event.org_id}).fetchOne();
        if (cat === undefined) {
          throw 'Category not found: ' + code;
        }
        category_ids.push(cat._id);
      }

      const competitor = await Competitor.query.where({event_id: event._id, climber_id: climber._id}).fetchOne() ??
            Competitor.build({
              event_id: event._id,
              climber_id: climber._id,
              number: climber.number,
              team_ids: [club._id],
            });

      competitor.category_ids = category_ids.sort();
      await competitor.$$save();
    };

    for (let i = 0; i < data.length; ++i) {
      try {
        row = data[i];
        await importCompetitor();
      } catch (ex) {
        errors.push([i + 1, data[i], ex.toString()]);
      }
    }

    await Event.query.onId(event._id).update({errors});
  });
});
