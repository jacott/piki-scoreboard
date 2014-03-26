AppModel = {
  lookupDottedValue: function (key, attributes) {
    var parts = key.split('.');
    var val = attributes[parts[0]];
    for(var i=1; val && i < parts.length;++i) {
      val = val[parts[i]];
    }
    return val;
  },

  _destroyModel: function (name) {
    delete AppModel[name];
    ['before', 'after'].forEach(function (ba) {
      ['Create', 'Update', 'Save', 'Remove'].forEach(function (actn) {
       delete modelObservers[name +"." + ba + actn];
      });
    });
  },
};


function BaseModel(attributes) {
  if(attributes.hasOwnProperty('_id')) {
    // existing record
    this.attributes = attributes;
    this.changes = {};
  } else {
    // new record
    this.attributes = {};
    this.changes = attributes;
    App.extend(this.changes, this.constructor._defaults);
  }
}

AppModel.Base = BaseModel;
var modelObservers = AppModel.Base._modelObservers = {};

var _support = AppModel._support = {
  setupExtras: [],

  modelName: modelName,

  performBumpVersion: function(model, _id, _version) {
    AppModel.beginWaitFor(model.modelName, _id, function () {
      model.docs.update({_id: _id, _version: _version}, {$inc: {_version: 1}}) ||
        AppModel.endWaitFor(model.modelName, _id);
    });
  },

  performInsert: function (doc) {
    var model = doc.constructor;

    _support.callObserver('beforeCreate', doc);
    _support.callObserver('beforeSave', doc);
    model.hasVersioning && (doc.changes._version = 1);

    model.fencedInsert(doc.changes);
    _support.callObserver('afterCreate', doc);
    _support.callObserver('afterSave', doc);
  },

  performUpdate: function (doc) {
    var model = doc.constructor;

    _support.callObserver('beforeUpdate', doc);
    _support.callObserver('beforeSave', doc);
    var updates = {$set: doc.changes};
    model.hasVersioning && (updates.$inc = {_version: 1});

    model.fencedUpdate(doc._id, updates);
    _support.callObserver('afterUpdate', doc);
    _support.callObserver('afterSave', doc);
  },

  callObserver: function (type, doc) {
    var observers = modelObservers[modelName(doc)+'.'+type];
    if (observers) {
      for(var i=0;i < observers.length;++i) {
        observers[i].call(doc, doc, type);
      }
    }
  }
};

BaseModel.prototype = {
  get _id() {return this.attributes._id;},

  $isValid: function () {
    var doc = this,
        model = doc.constructor,
        fVTors = model._fieldValidators;

    doc._errors = null;

    if(fVTors) {
      for(var field in fVTors) {
        var validators = fVTors[field];
        for(var vTor in validators) {

          var args = validators[vTor];
          var options = args[1];

          if (typeof options === 'function')
            options = options.call(doc, field, args[2]);
          args[0](doc,field, options, args[2]);
        }
      }
    }

    doc.validate && doc.validate();

    return ! doc._errors;
  },

  $assertValid: function () {
    AppVal.allowIfValid(this.$isValid(), this);
  },

  $equals: function (other) {
    if (this === other) return true;
    return other && other._id && this._id && this._id === other._id && this.constructor === other.constructor;
  },

  $isNewRecord: function () {
    return ! this.attributes._id;
  },

  $update: function (value, options) {
    return AppModel[modelName(this)].docs.update(this._id, value, options);
  },

  $change: function (field) {
    if (field in this.changes)
      return this.changes[field];
    return this.changes[field] = Apputil.deepCopy(this[field]);
  },

  $remove: function () {
    var result = AppModel[modelName(this)].fencedRemove(this._id);
    _support.callObserver('afterRemove', this);
    return result;
  },

  $reload: reload,

  $loadCopy: function () {
    return new this.constructor(this.attributes);
  },

  $setFields: function (fields,options) {
    for(var i = 0,field;field = fields[i];++i) {
      if(field != '_id' && options.hasOwnProperty(field)) {
        this[field] = options[field];
      }
    }

    return this;
  },

  get $cache() {return this._cache || (this._cache = {})},

  $cacheRef: function (key) {
    return this.$cache[key] || (this.$cache[key] = {});
  },
};

BaseModel._define = function (name,properties) {
  properties || (properties = {});
  var model = function (attrs) {
    BaseModel.call(this,attrs||{});
  };

  var scp = model.prototype = Object.create(this.prototype,{
    constructor: { value: model },
  });

  App.extend(scp,properties);

  model.defineFields = defineFields;
  model.definePrototype = definePrototype;
  model.addVersioning = addVersioning;
  model.remote = remote;
  model.modelName = name;
  model._fieldValidators = {};
  model._defaults = {};
  model.hasMany = hasMany;
  model.pushPull = pushPull;
  return model;
};

BaseModel.defineSubclass = function (name,properties,options) {
  options || (options = {});

  var model = this._define(name, properties);

  model.defineSubclass = BaseModel.defineSubclass;
  model.beforeCreate = beforeCreate;
  model.afterCreate = afterCreate;
  model.beforeUpdate = beforeUpdate;
  model.afterUpdate = afterUpdate;
  model.beforeSave = beforeSave;
  model.afterSave = afterSave;
  model.afterRemove = afterRemove;
  model.fieldTypeMap = {};
  model.create = create;
  model.build = build;

  AppModel[name] = model;

  model.docs = new Meteor.Collection(name,{transform: function (doc) {
    return new model(doc);
  }});

  if (Meteor.isClient) {
    AppModel.initIndex(model, model.docs);
    model.quickFind = function quickFind(id) {
      return model.Index.quickFind(id);
    };
  }

  deleteMeteorMethods(name);

  model.find = function find() {
    return model.docs.find.apply(model.docs, arguments);
  };
  model.findOne = function findOne() {
    return model.docs.findOne.apply(model.docs, arguments);
  };
  model.findIds = findIds;
  model.findField = findField;
  model.findOneField = findOneField;
  model.exists = function (condition) {
    return !! model.findOne(condition, {transform: null, fields: {_id: 1}});
  };

  model.attrFind = _support.attrFind;


  if (options.saveRpc || Meteor.isClient) {
    model.remote({
      save: _support.saveRpc(name),
    });
  }

  model.lock = lock;
  model.isLocked = isLocked;

  setupExtras(model);

  return model;
};

BaseModel._updateTimestamps = function (changes, timestamps, now) {
  if (timestamps) {
    for(var key in timestamps)  {
      changes[key] = changes[key] || now;
    }
  }
};

BaseModel._addUserIds = function (changes, userIds, user_id) {
  if (userIds) {
    for(var key in userIds)  {
      changes[key] = user_id;
    }
  }
};


function findOneField(field, constraints, options) {
  constraints = constraints || {};
  options = options ? _.extend({}, options) : {};
  options.transform = null;
  options.fields = {};
  options.fields[field] = 1;

  var doc = this.docs.findOne(constraints, options);
  return doc && doc[field];
}

function findField(field, constraints, options) {
  constraints = constraints || {};
  options = options ? _.extend({}, options) : {};
  options.transform = null;
  options.fields = {};
  options.fields[field] = 1;

  return this.docs.find(constraints, options).map(function (doc) {
    return doc[field];
  });
}

function findIds(constraints, options) {
  return this.findField('_id', constraints, options);
}

function modelName(doc) {
  return doc.constructor.modelName;
}

function hasMany(name, model, finder) {
  this.prototype[name] = function (constraints, options) {
    var finderConstraint = finder.call(this);

    if(constraints) for(var key in constraints) {
      return model.find({$and: [finderConstraint, constraints]}, options);
    }

    return model.find(finderConstraint, options);
  };
}

function pushPull(field) {
  var model = this;

  var options = {};
  options['push.' + field] = _support.pushRpc(model, field);
  options['pull.' + field] = _support.pullRpc(model, field);

  model.remote(options);
}

function remote(funcs) {
  var model = this,
      prefix = model.modelName + '.',
      methods = {};

  for(var key in funcs) {methods[prefix + key] = _support.remote(key,funcs[key]);}
  Meteor.methods(methods);

  return model;
};

function registerObserver(name, callback) {
  (modelObservers[name] || (modelObservers[name] = [])).push(callback);
}

function beforeCreate(callback) {
  registerObserver(this.modelName+'.beforeCreate', callback);
  return this;
};

function afterCreate(callback) {
  registerObserver(this.modelName+'.afterCreate', callback);
  return this;
};

function beforeUpdate(callback) {
  registerObserver(this.modelName+'.beforeUpdate', callback);
  return this;
};

function afterUpdate(callback) {
  registerObserver(this.modelName+'.afterUpdate', callback);
  return this;
};

function beforeSave(callback) {
  registerObserver(this.modelName+'.beforeSave', callback);
  return this;
};

function afterSave(callback) {
  registerObserver(this.modelName+'.afterSave', callback);
  return this;
};

function afterRemove(callback) {
  registerObserver(this.modelName+'.afterRemove', callback);
  return this;
};

/**
 * Build a new document. Does not copy _id from attributes.
 */
function build(attributes, allow_id) {
  var model = new this();
  if(attributes) {
    App.extend(model.changes, attributes);
    allow_id || delete model.changes._id;
  }
  return model;
}

/**
 * build and save a new document. Will use given _id if supplied.
 */
function create(attributes) {
  var model = new this();
  App.extend(model.changes, attributes);
  model.$save();
  return model;
}

function defineField(proto, field) {
  Object.defineProperty(proto, field,{
    get: getValue(field),

    set: setValue(field),
  });
}

function getValue(field) {
  return function () {
    var value = this.changes[field];
    if(value === undefined) {
      return this.attributes[field];
    }
    return value;
  };
}

function setValue(field) {
  return function (value) {
    if (value === this.attributes[field]) {
      if (this.changes.hasOwnProperty(field)) {
        if (value === undefined && this.constructor._defaults[field] !== undefined)
          this.changes[field] = this.constructor._defaults[field];
        else
          delete this.changes[field];

        this._setChanges && this._setChanges(field, value);
      }
    } else {
      this.changes[field] = value;
      this._setChanges && this._setChanges(field, value);
    }
    return value;
  };
}

var typeMap = {
  belongs_to: function (model, field, options) {
    var name = field.replace(/_id/,''),
        bt = AppModel[options.modelName || Apputil.capitalize(name)];
    if (bt) {
      model.fieldTypeMap[field] = bt;
      Object.defineProperty(model.prototype, name, {get: belongsTo(bt, name, field)});
    }
  },
  user_id_on_create: function(model, field, options) {
    typeMap.belongs_to.call(this, model, field, options);
    model.userIds = model.userIds || {};
    model.userIds[field] = 'create';
  },
  has_many: function (model, field, options) {
    var name = field.replace(/_ids/,''),
        bt = AppModel[typeof options.associated === 'string' ? options.associated : Apputil.capitalize(name)];
    if (bt) {
      model.fieldTypeMap[field] = bt;
    }
  },


  timestamp: function(model, field) {
    if (/create/i.test(field)) {
      model.createTimestamps = model.createTimestamps || {};
      model.createTimestamps[field] = true;
    } else {
      model.updateTimestamps = model.updateTimestamps || {};
      model.updateTimestamps[field] = true;
    }
  },
};

var versionProperty = {
  get: function () {
    return this.attributes._version;
  },

  set: function (value) {
    this.attributes._version = value;
  }
};

function belongsTo(model, name, field) {
  return function () {
    var value = this[field];
    return value && this.$cacheRef(name)[value] || (this.$cacheRef(name)[value] = model.findOne(value));
  };
}

function addVersioning() {
  var model = this,
      proto = model.prototype;

  model.hasVersioning = true;
  Object.defineProperty(proto, '_version', versionProperty);

  proto.$bumpVersion = _support.bumpVersion;
  model.remote({
    bumpVersion: _support.bumpVersionRpc(model.modelName),
  });
  return this;
}

function defineFields(fields) {
  var proto = this.prototype;
  for(var field in fields) {
    var options = fields[field];
    if (! options.type) options = {type: options};
    var func = typeMap[options.type];
    func && func(this, field, options);
    setUpValidators(this, field, options);

    if (options['default'] !== undefined) this._defaults[field] = options['default'];
    defineField(proto,field);
  }
  return this;
};

function definePrototype(name, func) {
  var fullname = this.modelName+"."+name;
  this.prototype[name] = function() {
    for(var i=0;i < arguments.length;++i) {
      var curr = arguments[i];
      if (curr && curr._id) arguments[i] = curr._id;
    }
    return Meteor.apply(fullname, [this._id].concat(Apputil.slice(arguments)));
  };
  var methods = {};
  methods[fullname] = func;

  Meteor.methods(methods);
  methods = null;
  return this;
}

AppModel._subFieldValidator = subFieldValidator;

function subFieldValidator(doc, arrayField) {
  var aField = doc[arrayField],
      model = aField.type,
      fVTors = model._fieldValidators,
      index = 0;

  aField.forEach(function (doc) {
    doc._errors = null;

    if(fVTors) {
      for(var field in fVTors) {
        var validators = fVTors[field];
        for(var vTor in validators) {
          var args = validators[vTor];
          args[0](doc,field,args[1]);
        }
      }
    }

    doc.validate && doc.validate();
    if (doc._errors) {
      AppVal.addError(aField._parent, arrayField+'.'+index, doc._errors);
    }
    ++index;
  });
}


function getValidators(model, field) {
  return model._fieldValidators[field] || (model._fieldValidators[field] = {});
}

function setUpValidators(model, field, options) {
  var validators = getValidators(model, field),
      valFunc;

  if (typeof options === 'object') {

    for(var validator in options) {

      if(valFunc = AppVal.validators(validator)) {
        validators[validator]=[valFunc, options[validator], options];
      }
    }
  }
}

function reload() {
  if (Meteor.isClient) {
    var attrs = AppModel[modelName(this)].attrDocs()[this._id];
    if (attrs) attrs = App.extend({}, attrs);
  } else {
    var attrs = AppModel[modelName(this)].findOne(this._id, {transform: null});
  }

  this.attributes = attrs || {};
  this.changes = {};
  this._errors = null;
  this._cache = null;
  this.__arrayFields && (this.__arrayFields = undefined);
  return this;
}

function isLocked(id) {
  return (this._locks || (this._locks = {})).hasOwnProperty(id);
}

function lock(id, func) {
  if (this.isLocked(id))
    func.call(this, id);
  else {
    this._locks[id] = true;
    try {
      func.call(this, id);
    } finally {
      delete this._locks[id];
    }
  }
}

deleteMeteorMethods('users');
deleteMeteorMethods('meteor_accounts_loginServiceConfiguration');

function deleteMeteorMethods(name) {
  if (Meteor.isClient) return;
  var handlers = Meteor.server.method_handlers;
  name = '/'+name;
  delete handlers[name+'/insert'];
  delete handlers[name+'/update'];
  delete handlers[name+'/remove'];
}

function setupExtras(model) {
  var funcs = _support.setupExtras;
  for(var i = 0; i < funcs.length; ++i) {
    funcs[i](model);
  }
}
