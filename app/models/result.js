App.require('AppModel.Competitor', function (Competitor) {
  var model = AppModel.Base.defineSubclass('Result',{
  },{saveRpc: true});


  model.defineFields({
    event_id: 'belongs_to',
    competitor_id: 'belongs_to',
    category_id: 'belongs_to',
    heat_id: 'belongs_to',
    order: {type: 'order', required: 'not_null', number: true},
    time: 'number',
    score: 'number',
  });

  Competitor.afterCreate(function (doc) {
    addResults(doc.category_ids || [], doc);
  });

  Competitor.afterUpdate(function (doc) {
    var added = _.difference(doc.changes.category_ids || [], doc.attributes.category_ids || []);

    addResults(added, doc);
    var removed = _.difference(doc.attributes.category_ids || [], doc.changes.category_ids || []);
    removeResults(removed, doc);
  });

  Competitor.afterRemove(function (doc) {
    removeResults(doc.category_ids || [], doc);
  });

  function addResults(ids, doc) {
    ids.forEach(function (catId) {
      var result = model.create({
        category_id: catId, event_id: doc.event_id,
        competitor_id: doc._id,
        heat_id: AppModel.Category.attrFind(catId).heats[0].id,
        order: Math.random()});
    });
  }

  function removeResults(ids, doc) {
    ids.forEach(function (catId) {
      model.docs.remove({category_id: catId, event_id: doc.event_id});
    });
  }

  App.loaded('AppModel.Result', model);
});
