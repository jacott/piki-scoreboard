App.require('AppModel.Org', function () {
  var model = AppModel.Base.defineSubclass('Event',{
  },{saveRpc: true});


  model.defineFields({
    name: {type:  'text', trim: true, required: true, maxLength: 200},
    org_id: 'belongs_to',
    heats: 'has-many',
    date: {type: 'date'},
  });

  model.addRemoveRpc();

  App.require('AppModel.Result', function (Result) {
    Result.afterCreate(function (doc) {
      var event = model.attrFind(doc.event_id);
      if (doc.category_id in event.heats) return;
      model.docs.update(doc.event_id, {$set: buildHeat(doc)});
    });

    Result.afterRemove(function (doc) {
      if (Result.exists({event_id: doc.event_id, category_id: doc.category_id}))
        return;
      model.docs.update(doc.event_id, {$unset: buildHeat(doc)});
    });

    function buildHeat(doc) {
      var heat = {};
      var category  = AppModel.Category.attrFind(doc.category_id);
      heat["heats."+doc.category_id] = category.type + category.heatFormat;
      return heat;
    }
  });

  App.loaded('AppModel.Event', model);
});
