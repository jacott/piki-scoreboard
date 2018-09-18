define((require, exports, module)=>{
  const util            = require('koru/util');

  const groupOrgs = {};

  let obHandle;

  const setGroupIndex = model =>{
    const groupRemove = (doc)=>{
      const group = getGroup(doc.org_id, doc.group);
      delete group[doc._id];

      for(const noop in group) return;
      const groups = groupOrgs[doc.org_id];
      delete groups[doc.group];

      for(const noop in groups) return;
      delete groupOrgs[doc.org_id];
    };

    model.onChange(dc =>{
      const {doc} = dc;
      if (dc.isDelete) {
        groupRemove(doc);
      } else {
        if (dc.isChange && dc.hasSomeFields('org_id', 'group')) {
          groupRemove(dc.was);
        }
        getGroup(doc.org_id, doc.group)[doc._id] = true;
      }
    });
  };

  const getGroup = (org_id, group)=>{
    const groups = groupOrgs[org_id] || (groupOrgs[org_id] = {});
    return groups[group] || (groups[group] = {});
  };

  module.onUnload(()=>{
    obHandle && obHandle.stop();
    obHandle = null;
  });

  return Category =>{
    setGroupIndex(Category);

    Category.groupApplicable = (climber, func)=>{
      const org_id = climber.org_id;
      const docs = Category.docs;

      Object.keys(groupOrgs[org_id] || {}).sort().forEach(group =>{
        const col = [];
        for(const id in getGroup(org_id, group)) {
          col.push(docs[id]);
        }
        col.sort(util.compareByName);
        func(group, col);
      });
    };
  };
});
