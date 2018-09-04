define((require)=>{
  const util            = require('koru/util');
  const Category        = require('./category');

  const makeGroupHash = (ids)=>{
    const groupHash = {};
    if (ids == null) return groupHash;
    const {docs} = Category;
    for(let i = 0; i < ids.length; ++i) {
      const id = ids[i];
      const doc = docs[id];
      if (doc !== undefined)
        groupHash[doc.group] = id;
    }
    return groupHash;
  };

  return Competitor =>{
    Competitor.eventIndex = Competitor.addUniqueIndex('event_id', 'climber_id');

    util.merge(Competitor.prototype, {
      categoryIdForGroup(group) {
        const groupHash = this.$cache.groupHash || (
          this.$cache.groupHash = makeGroupHash(this.category_ids));
        return groupHash[group];
      },
    });
  };
});
