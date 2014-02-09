(function () {
  var Factory = TH.Factory = {
    clear: function () {
      last = {};
      nameGen = {};
    },

    createList: function (number, creator /* arguments */) {
      var list = [],
          args = Array.prototype.slice.call(arguments, 2);

      var func = typeof args[0] === 'function' ? args.shift() : null;

      args[0] = args[0] || {};

      for(var i=0;i < number;++i) {
        func && func.apply(args, [i].concat(args));
        list.push(this[creator].apply(this,args));
      }
      return list;
    },

    get last () {
      return last;
    },

    setLastNow: function (now) {
      lastNow = now;
    },

    getUniqueNow: getUniqueNow,
  };

  var exhibitTraits = {
  };

  var traits = {
    User: {
      su: function (options) {
        App.reverseExtend(options, {
          name: "Super User", initials: "SU",
          email: "su@example.com", role: 's', org_id: null
        });
      },
    },
  };

  /** Add a function for any action needed to happen after doc created */
  var postCreate = {
    // UserGroup: function (doc, key, /** traits and options */) {
    //   return last.userGroup = doc;
    // },
  };

  var nameGen = {},
      last = {},
      lastNow;

  var defaultAfter = JSON.stringify({name: 'new name'});

  var defines = {
    Org: function (options) {
      return new Builder('Org', options).genName()
        .addField('shortName', 'shortName' in options || generateName('SN').replace(/\s+/g, ''));
    },

    Club: function (options) {
      return new Builder('Club', options).genName()
        .addRef('org')
        .addField('shortName', 'shortName' in options || generateName('SN').replace(/\s+/g, ''));
    },

    Category: function (options) {
      return new Builder('Category', options).genName()
        .addRef('org')
        .addField('heatFormat', 'F8QQ')
        .addField('group', 'A male')
        .addField('gender', 'm')
        .addField('shortName', 'shortName' in options || generateName('SN').replace(/\s+/g, ''));
    },

    Climber: function (options) {
      return new Builder('Climber', options).genName()
        .addRef('org')
        .addRef('club')
        .addField('gender', 'm')
        .addField('dateOfBirth', '2000/01/01');
    },

    Competitor: function (options) {
      if (options.category_ids === undefined) {
        var category = last.category || Factory.createCategory();
        options.category_ids = [category._id];
      }

      return new Builder('Competitor', options)
        .addRef('climber')
        .addRef('event');

    },

    Result: function (options) {
      last.competitor || Factory.createCompetitor();
      return new Builder('Result', options)
        .addRef('event')
        .addRef('climber')
        .addRef('category')
        .addField('scores', [options.scores || AppModel.Result.find({}).count()]);
    },

    Event: function (options) {
      return new Builder('Event', options).genName()
        .addRef('org')
        .addField('date', '20014/04/01');
    },

    User: function (options) {
      var username = 'username' in options || generateName('user');

      return new Builder('User', options)
        .addRef('org')
        .addField('role', 'p')
        .addField('name', 'name' in options || 'fn '+username)
        .addField('email', 'email' in options || ('email-'+username.replace(/\s+/g,'.')+'@test.co').toLowerCase())
        .addField('initials', 'initials' in options || 'u'+username.substring(4))
        .afterCreate(function (doc) {
          Meteor.users.insert({_id: doc._id, emails: [{address: doc.email, verified: true}], password: options.password});
        });
    },

  };

  for(var key in defines) {
    Factory['build'+key] = buildFunc(key, defines[key]);
    Factory['create'+key] = createFunc(key, defines[key]);
  }

  function buildFunc(key, def) {
    return function (/** traits and options */) {
      return def.call(Factory, buildOptions(key, arguments)).build();
    };
  }

  function createFunc(key, def) {
    return function (/** traits and options */) {
      var result =
            def.call(Factory, buildOptions(key, arguments)).create();

      if (postCreate[key])
        return postCreate[key](result, key, arguments);
      else
        return last[key.substring(0,1).toLowerCase()+key.substring(1)] = result;
    };
  }

  function buildOptions(key, args) {
    var options = {}, keyTraits = traits[key] || {};
    for(var i=0;i < args.length;++i) {
      if (typeof args[i] === 'string') {
        var trait = keyTraits[args[i]];
        if (!trait) throw new Error('unknown trait "'+ args[i] +'" for ' + key);
        _.extend(options, typeof trait === 'function' ? trait.call(keyTraits, options, args, i) : trait);
      } else if(args[i]) {
        _.extend(options, args[i]);
      }
    }
    return options;
  }

  function getUniqueNow() {
    var now = Date.now();

    if(lastNow && now <= lastNow) {
        now = ++lastNow;
    } else {
      lastNow = now;
    }

    return new Date(now);
  }

  function generateName(prefix) {
    if (typeof(nameGen[prefix]) != 'number') (nameGen[prefix] = 0);
    return prefix + ' ' + ++nameGen[prefix];
  }

  /**
   * Builder
   *
   **/

  function Builder(modelName, options, default_opts) {
    this.model = AppModel[modelName];
    this.options = options || {};
    this.default_opts = _.extend({}, this.model._defaults, default_opts || {});
  }

  App.extend(Builder.prototype, {
    addRef: function(ref, doc) {
      var refId = ref+'_id';
      if (! this.options.hasOwnProperty(refId)) {
        doc = doc || (doc === undefined && last[ref]) || Factory['create'+Apputil.capitalize(ref)]();
        this.default_opts[refId] = doc._id === undefined ? doc : doc._id;
      }
      return this;
    },

    canSave: function (value) {
      this._canSave = value;
      return this;
    },

    genName: function (field, prefix) {
      return this.addField(field || 'name', generateName(prefix || this.model.modelName));
    },

    addField: function (field, value) {
      if (! this.options.hasOwnProperty(field)) {
        switch(typeof value) {
        case 'undefined': break;
        case 'function':
          this.default_opts[field] = value();
          break;
        default:
          this.default_opts[field] = value;
        }
      }
      return this;
    },

    field: function (field) {
      return (this.options.hasOwnProperty(field) ? this.options : this.default_opts)[field];
    },

    attributes: function () {
      var result = {};
      addAttributes(this.default_opts);
      addAttributes(this.options);
      return result;

      function addAttributes(attrs) {
        for(var key in attrs) {
          var value = attrs[key];
          if (value !== undefined)
            result[key] = value;
        }
      }
    },

    insert: function () {
      return this.model.findOne(this.model.docs.insert(this.attributes()));
    },

    build: function () {
      var doc = new this.model();
      _.extend(doc.changes, this.attributes());
      return doc;
    },

    create: function () {
      if (this._canSave)
        var doc = this.model.create(this.attributes());
      else
        var doc = this.insert();

      this._afterCreate && this._afterCreate.call(this, doc);
      return doc;
    },

    afterCreate: function (func) {
      this._afterCreate = func;
      return this;
    },
  });


})()
;
