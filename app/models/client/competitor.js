App.require('AppModel.Competitor', function (model) {
  model.eventIndex = model.Index.addUniqueIndex('event_id', 'climber_id');

  App.extend(model.prototype, {
    categoryIdForGroup: function (group) {
      var groupHash = this.$cache.groupHash || (this.$cache.groupHash = makeGroupHash(this.category_ids));
      return groupHash[group];
    },
  });
});

function makeGroupHash(ids) {
  var groupHash = {};
  if (! ids) return groupHash;
  var docs = AppModel.Category.attrDocs();
  for(var i = 0; i < ids.length; ++i) {
    var id = ids[i];
    groupHash[docs[id].group] = id;
  }
  return groupHash;
}
