define(function(require, exports, module) {
  var util = require('koru/util');
  var env = require('koru/env');

  var groupOrgs = {};

  var obHandle;

  env.onunload(module, function () {
    obHandle && obHandle.stop();
    obHandle = null;
  });

  return function(model) {
    setGroupIndex(model);

    util.extend(model, {
      groupApplicable: function (climber, func) {
        var org_id = climber.org_id;
        var docs = model.docs;

        Object.keys(groupOrgs[org_id] || {}).sort().forEach(function (group) {
          var col = [];
          for(var id in getGroup(org_id, group)) {
            col.push(docs[id]);
          }
          col.sort(util.compareByName);
          func(group, col);
        });
      },
    });
  };

  function setGroupIndex(model) {
    model.onChange(function (doc, was) {
      if (doc) {
        if (was) {
          if (was.hasOwnProperty('org_id') || was.hasOwnProperty('group')) {
            groupRemove(new model(doc.attributes, was));
          }
        }
        getGroup(doc.org_id, doc.group)[doc._id] = true;
      } else {
        groupRemove(was);
      }
    });

    function groupRemove(doc) {
      var group = getGroup(doc.org_id, doc.group);
      delete group[doc._id];

      for(var noop in group) return;
      var groups = groupOrgs[doc.org_id];
      delete groups[doc.group];

      for(var noop in groups) return;
      delete groupOrgs[doc.org_id];
    }
  }

  function getGroup(org_id, group) {
    var groups = groupOrgs[org_id] || (groupOrgs[org_id] = {});
    return groups[group] || (groups[group] = {});
  }

});
