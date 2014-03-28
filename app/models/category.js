App.require('AppModel.Org', function () {
  var model = AppModel.Base.defineSubclass('Category',{
  },{saveRpc: true});

  model.HEAT_FORMAT_REGEX = /^Q{0,3}(F\d+){1,3}$/;

  model.defineFields({
    org_id: 'belongs_to',
    name: {type:  'text', trim: true, required: true, maxLength: 200},
    group: {type:  'text', trim: true, required: true, maxLength: 30},
    shortName: {type: 'text', trim: true, required: true, maxLength: 10, normalize: 'upcase'},
    gender: {type: 'text', inclusion: {allowBlank: true, matches: /^[mf]$/ }},
    type: {type: 'text', inclusion: {matches: /^[BL]$/}},
    heatFormat: {type: 'text', inclusion: {matches: model.HEAT_FORMAT_REGEX}},
    minAge: {type: 'number', number: {integer: true, $gt: 0, $lt: 100}},
    maxAge: {type: 'number', number: {integer: true, $gt: 0, $lt: 100}},
  });

  model.addRemoveRpc();

  App.loaded('AppModel.Category', model);
});
