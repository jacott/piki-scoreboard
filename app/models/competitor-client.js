define(function(require, exports, module) {
  var util = require('koru/util');
  var Category = require('./category');

  return function (model) {
    model.eventIndex = model.addUniqueIndex('event_id', 'climber_id');

    util.extend(model.prototype, {
      categoryIdForGroup: function (group) {
        var groupHash = this.$cache.groupHash || (this.$cache.groupHash = makeGroupHash(this.category_ids));
        return groupHash[group];
      },
    });
  };

  function makeGroupHash(ids) {
    var groupHash = {};
    if (! ids) return groupHash;
    var docs = Category.docs;
    for(var i = 0; i < ids.length; ++i) {
      var id = ids[i];
      var doc = docs[id];
      if (doc)
        groupHash[doc.group] = id;
    }
    return groupHash;
  }
});
