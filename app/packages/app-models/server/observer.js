AppModel._support.setupExtras.push(setup);

var globalCount = 0;

var nullTf = {transform: null};

AppModel.globalMemCount = function () {
  return globalCount;
};

function setup(model) {
  var oplogObserver = null;
  var observers ={};
  var key = 0;
  var modelName = model.modelName;
  var docs = {};
  var docCounts = {};
  var localCount = 0;

  model.observeOplog = function (options) {
    oplogObserver || initOplogObserver();
    observers[++key] = options;
    return stopObserver(key);
  };

  model.memFind = function(id) {
    return docs[id];
  };

  model.attrFind = function (id, options) {
    return docs[id] || model.findOne(id, options || nullTf);
  };

  model.addMemDoc = function (attrs) {
    ++globalCount;
    ++localCount;
    if (typeof attrs === 'string') {
      var id = attrs;
      attrs = null;
    } else {
      var id = attrs._id;
    }
    if (! id) throw new Error('No id for addMemDoc. ' + model.modelName + "\n\t" + JSON.stringify(attrs));
    if ((docCounts[id] = (docCounts[id]||0) + 1) === 1) {
      docs[id] = attrs || model.findOne(id, nullTf);
    }
  };

  model.delMemDoc = function (id) {
    --globalCount;
    --localCount;
    if (--docCounts[id] === 0) {
      delete docCounts[id];
      delete docs[id];
    }
  };

  model.memDocsCount = function () {
    return localCount;
  };

  model.clearMemDocs = function () {
    globalCount -= localCount;
    localCount = 0;
    docs = {};
    docCounts = {};
  };

  var convertAttrs = function(id, attrs) {
    var newAttrs;

    for(var key in attrs) {
      var i = key.indexOf(".");
      if (i !== -1) {
        delete attrs[key];
        (newAttrs || (newAttrs = {}))[key.slice(0, i)] = 1;
      }
    }
    if (newAttrs) {
      var doc = model.findOne(id, {transform: null, fields: newAttrs});
      if (doc) for(var key in newAttrs) {
        attrs[key] = doc[key];
      }
    }
  };

  function initOplogObserver() {
    oplogObserver = AppOplog.observe(modelName, {
      ins: function (attrs) {
        for(var key in observers) {
          var cbs = observers[key];
          cbs && ('ins' in cbs) && cbs.ins(attrs);
        }
      },
      upd: function (id, attrs) {
        convertAttrs(id, attrs);

        for(var key in observers) {
          var cbs = observers[key];
          cbs && ('upd' in cbs) && cbs.upd(id, attrs);
        }
        var doc = model.memFind(id);
        if (doc)
          App.extend(doc, attrs);
      },
      del: function (id) {
        for(var key in observers) {
          var cbs = observers[key];
          cbs && ('del' in cbs) && cbs.del(id);
        }
        delete docCounts[id];
        delete docs[id];
      }
    });
  }

  function stopObserver(key) {
    return {
      stop: function () {
        delete observers[key];
        for(var i in observers) return;
        oplogObserver.stop();
        oplogObserver = null;
      }
    };
  }
};
