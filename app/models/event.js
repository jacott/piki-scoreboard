App.require('AppModel.Org', function () {
  var model = AppModel.Base.defineSubclass('Event',{
    validate: function () {
      var  heats = this.changes.heats;
      if (heats) for(var id in heats) {
        var cat = AppModel.Category.findOne(id);
        AppVal.allowAccessIf(cat.org_id === this.org_id);
        var format = heats[id];
        if (format[0] !== cat.type || ! format.slice(1).match(AppModel.Category.HEAT_FORMAT_REGEX)) {
          AppVal.addError(this, 'heats', 'is_invalid');
        }
      }
    },
  },{saveRpc: true});


  model.defineFields({
    name: {type:  'text', trim: true, required: true, maxLength: 200},
    org_id: 'belongs_to',
    heats: 'has-many',
    date: {type: 'date', inclusion: {matches: /^\d{4}-[01]\d-[0-3]\d$/}},
    errors: 'has-many',
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
