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
      var heat = {};
      heat["heats."+doc.category_id] = AppModel.Category
        .attrFind(doc.category_id).heatFormat;
      model.docs.update(doc.event_id, {$set: heat});
    });

    Result.afterRemove(function (doc) {
      if (Result.exists({event_id: doc.event_id, category_id: doc.category_id}))
        return;
      var heat = {};
      heat["heats."+doc.category_id] = AppModel.Category
        .attrFind(doc.category_id).heatFormat;
      model.docs.update(doc.event_id, {$unset: heat});
    });
  });

  App.loaded('AppModel.Event', model);
});
