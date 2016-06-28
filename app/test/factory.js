define(function(require, exports, module) {
  var Factory = require('koru/model/test-factory');
  var util = require('koru/util');
  var Random = require('koru/random');
  var uDate = require('koru/util-date');
  var Org = require('models/org');
  var Model = require('model');

  Factory.traits({
    User: {
      guest: function (options) {
        util.reverseExtend(options, {
          _id: 'guest',
          name: undefined, initials: undefined,
          email: undefined, role: 'g', org_id: null
        });
      },
      su: function (options) {
        util.reverseExtend(options, {
          name: "Super User", initials: "SU",
          email: "su@example.com", role: 's', org_id: null
        });
      },

      admin: function (options) {
        util.reverseExtend(options, {role: Model.User.ROLE.admin});
      }
    },
  });


  var defaultAfter = JSON.stringify({name: 'new name'});

  Factory.defines({
    Org: function (options) {
      return new Factory.Builder('Org', options).genName()
        .addField('email', 'email' in options || Factory.generateName('email').replace(/\s+/g, '') + '@obeya.co')
        .addField('shortName', 'shortName' in options || Factory.generateName('SN').replace(/\s+/g, ''));
    },

    Club: function (options) {
      return new Factory.Builder('Club', options).genName()
        .addRef('org')
        .addField('shortName', 'shortName' in options || Factory.generateName('SN').replace(/\s+/g, ''));
    },

    TeamType(options) {
      return new Factory.Builder('TeamType', options).genName()
        .addRef('org');
    },

    Team(options) {
      return new Factory.Builder('Team', options).genName()
        .addRef('teamType')
        .addField('shortName',  () => Factory.generateName('SN').replace(/\s+/g, ''))
        .addRef('org');
    },

    Category: function (options) {
      return new Factory.Builder('Category', options).genName()
        .addRef('org')
        .addField('heatFormat', 'QQF8')
        .addField('group', 'A male')
        .addField('type', 'L')
        .addField('gender', 'm')
        .addField('shortName', 'shortName' in options || Factory.generateName('SN').replace(/\s+/g, ''));
    },

    Climber: function (options) {
      return new Factory.Builder('Climber', options).genName()
        .addRef('org')
        .addRef('club')
        .addField('gender', 'm')
        .addField('dateOfBirth', '2000-01-01')
        .addField('number', 'number' in options || +Factory.generateName('cn').slice(2));
    },

    Competitor: function (options) {
      if (options.category_ids === undefined) {
        var category = Factory.last.category || Factory.createCategory();
        options.category_ids = [category._id];
      }

      return new Factory.Builder('Competitor', options)
        .addRef('climber')
        .addRef('event');

    },

    Result: function (options) {
      Factory.last.competitor || Factory.createCompetitor();
      return new Factory.Builder('Result', options)
        .addRef('event')
        .addRef('climber')
        .addRef('category')
        .addField('scores', [options.scores || Model.Result.query.count()]);
    },

    Event: function (options) {
      var category = Factory.last.category || Factory.createCategory();
      if (! ('heats' in options)) {
        options.heats = [category._id];
      }

      if (options.heats && 'forEach' in options.heats) {
        var heats = {};
        options.heats.forEach(function (heat) {
          var category = Model.Category.findById(heat);
          heats[heat] = category.type + category.heatFormat;
        });
        options.heats = heats;
      }

      return new Factory.Builder('Event', options).genName()
        .addRef('org')
        .addField('heats')
        .addField('date', '2014-04-01');
    },

    User: function (options) {
      var username = 'username' in options ? options.username : Factory.generateName('user');

      return new Factory.Builder('User', options)
        .addRef('org')
        .addField('role', 'a')
        .addField('name', 'name' in options || 'fn '+username)
        .addField('email', 'email' in options || ('email-'+username.replace(/\s+/g,'.')+'@test.co').toLowerCase())
        .addField('initials', 'initials' in options || 'u'+username.substring(4));
        // .afterCreate(function (doc) {
        //   isServer && Model.UserLogin && Model.UserLogin.insert({_id: doc._id, emails: [{address: doc.email, verified: true}], password: options.password});
        // });
    },

  });

  return Factory;
});
