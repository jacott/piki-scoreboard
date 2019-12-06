define((require)=>{
  const Factory         = require('koru/model/test-factory');
  const Random          = require('koru/random');
  const util            = require('koru/util');
  const uDate           = require('koru/util-date');
  const Model           = require('model');
  const Org             = require('models/org');

  Factory.traits({
    User: {
      guest(options) {
        util.reverseMerge(options, {
          _id: 'guest',
          name: undefined, initials: undefined,
          email: undefined, role: 'g', org_id: null
        });
      },
      su(options) {
        util.reverseMerge(options, {
          name: "Super User", initials: "SU",
          email: "su@example.com", role: 's', org_id: null
        });
      },

      admin(options) {
        util.reverseMerge(options, {role: Model.User.ROLE.admin});
      },

      judge(options) {
        util.reverseMerge(options, {role: Model.User.ROLE.judge});
      },
    },
  });


  const defaultAfter = JSON.stringify({name: 'new name'});

  Factory.defines({
    Org(options) {
      return new Factory.Builder('Org', options).genName()
        .addField('email', 'email' in options || Factory.generateName('email')
                  .replace(/\s+/g, '') + '@vimaly.com')
        .addField('shortName', 'shortName' in options || Factory.generateName('SN')
                  .replace(/\s+/g, ''));
    },

    TeamType(options) {
      return new Factory.Builder('TeamType', options).genName()
        .addField('default', false)
        .addRef('org');
    },

    Team(options) {
      return new Factory.Builder('Team', options).genName()
        .addRef('teamType')
        .addField('shortName',  () => Factory.generateName('SN').replace(/\s+/g, ''))
        .addRef('org');
    },

    Category(options) {
      return new Factory.Builder('Category', options).genName()
        .addRef('org')
        .addField('heatFormat', options.type === 'S' ? undefined : 'QQF8')
        .addField('group', 'A male')
        .addField('type', 'L')
        .addField('gender', 'm')
        .addField('shortName', 'shortName' in options || Factory.generateName('SN')
                  .replace(/\s+/g, ''));
    },

    Climber(options) {
      return new Factory.Builder('Climber', options).genName()
        .addRef('org')
        .addField('gender', 'm')
        .addField('dateOfBirth', '2000-01-01')
        .addField('number', 'number' in options || +Factory.generateName('cn').slice(2));
    },

    Competitor(options) {
      if (options.category_ids === undefined) {
        const category = Factory.last.category || Factory.createCategory();
        options.category_ids = [category._id];
      }

      if (options.team_ids === undefined) {
        const team = Factory.last.team || Factory.createTeam();
        options.team_ids = [team._id];
      }

      return new Factory.Builder('Competitor', options)
        .addRef('climber')
        .addRef('event');

    },

    Result(options) {
      Factory.last.competitor || Factory.createCompetitor();
      return new Factory.Builder('Result', options)
        .addRef('event')
        .addRef('climber')
        .addRef('competitor')
        .addRef('category')
        .addField('scores', [options.scores || Model.Result.query.count()]);
    },

    Event(options) {
      if (options.teamType_ids === undefined) {
        const teamType = Factory.last.teamType || Factory.createTeamType();
        options.teamType_ids = [teamType._id];
      }

      const category = Factory.last.category || Factory.createCategory();
      if (! ('heats' in options)) {
        options.heats = [category._id];
      }

      if (options.heats && 'forEach' in options.heats) {
        const heats = {};
        options.heats.forEach(heat =>{
          const category = Model.Category.findById(heat);
          heats[heat] = category.type + (category.heatFormat||'');
        });
        options.heats = heats;
      }

      return new Factory.Builder('Event', options).genName()
        .addRef('org')
        .addField('ruleVersion', 1)
        .addField('heats')
        .addField('date', '2014-04-01');
    },

    Series(options) {
      if (options.teamType_ids === undefined) {
        const teamType = Factory.last.teamType || Factory.createTeamType();
        options.teamType_ids = [teamType._id];
      }

      return new Factory.Builder('Series', options).genName()
        .addRef('org')
        .addField('date', '2014-04-01');
    },

    User(options) {
      const username = 'username' in options ? options.username : Factory.generateName('user');
      const user = new Factory.Builder('User', options)
            .addField('name', 'name' in options || 'fn '+username)
            .addField('email', 'email' in options ||
                      ('email-'+username.replace(/\s+/g,'.')+'@test.co').toLowerCase())
            .addField('initials', 'initials' in options || 'u'+username.substring(4))
      ;

      if (isClient) {
        user.addRef('org').addField('role', 'a');
      } else {
        const _id = user.attributes._id || Random.id();
        user.attributes._id = _id;
        let org_id;
        if ('org_id' in options) {
          org_id = options.org_id;
          delete options.org_id;
        } else {
          const org = Factory.last.org || Factory.createOrg();
          org_id = org._id;
        }
        const role = ('role' in options) ? options.role : 'a';
        delete options.role;

        Factory.createRole({user_id: _id, org_id, role});
      }

      return user;
    },

    Role(options) {
      return new Factory.Builder('Role', options)
        .addField('org_id', ()=> (Factory.last.org  || Factory.createOrg())._id)
        .addField('user_id', ()=> (Factory.last.user || Factory.createUser())._id)
        .addField('role', 'a')
      ;
    },

    //$$newModel$$ - DO NOT REMOVE THIS LINE!
  });

  return Factory;
});
