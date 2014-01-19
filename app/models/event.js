App.require('AppModel.Org', function () {
  var model = AppModel.Base.defineSubclass('Event',{
  },{saveRpc: true});


  model.defineFields({
    name: {type:  'text', trim: true, required: true, maxLength: 200},
    org_id: 'belongs_to',
    date: {type: 'date'},
  });

  model.addRemoveRpc();

  App.loaded('AppModel.Event', model);
});
