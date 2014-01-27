var groupOrgs = {};

App.require('AppModel.Category', function (model) {
  setGroupIndex(model);

  App.extend(model, {
    groupApplicable: function (climber, func) {
      var org_id = climber.org_id;
      var docs = model.attrDocs();

      Object.keys(groupOrgs[org_id] || {}).sort().forEach(function (group) {
        var col = [];
        for(var id in getGroup(org_id, group)) {
          col.push(docs[id]);
        }
        col.sort(Apputil.compareByName);
        func(group, col);
      });
    },
  });
});


function setGroupIndex(model) {
  model.Index.observe(function (doc, old) {
    if (doc) {
      if (old) {
        if (old.org_id !== doc.org_id || old.group !== doc.group) {
          groupRemove(old);
        }
      }
      getGroup(doc.org_id, doc.group)[doc._id] = true;
    } else {
      groupRemove(old);
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
