App.require('AppModel.Org', function () {
  var model = AppModel.Base.defineSubclass('Event',{
  },{saveRpc: true});


  model.defineFields({
    name: {type:  'text', trim: true, required: true, maxLength: 200},
    org_id: 'belongs_to',
    heats: 'has-many',
    date: {type: 'date', inclusion: {matches: /^\d{4}-[01]\d-[0-3]\d$/}},
  });

  model.addRemoveRpc();

  App.require('AppModel.Result', function (Result) {
    Result.afterCreate(function (doc) {
      var event = model.attrFind(doc.event_id);
      if (event.heats && doc.category_id in event.heats) return;
      model.docs.update(doc.event_id, {$set: buildHeat(doc, ! event.heats)});
    });

    Result.afterRemove(function (doc) {
      if (Result.exists({event_id: doc.event_id, category_id: doc.category_id}))
        return;
      model.docs.update(doc.event_id, {$unset: buildHeat(doc)});
    });

    function buildHeat(doc, newHeats) {
      var category  = AppModel.Category.attrFind(doc.category_id);
      var value = category.type + category.heatFormat;

      if (newHeats) {
        var heats = {};
        heats[doc.category_id] = value;
        return {heats: heats};
      } else {
        var heat = {};
        heat["heats."+doc.category_id] = value;
        return heat;
      }
    }
  });

  App.loaded('AppModel.Event', model);
});
