App.require('AppModel.Event', function () {
  var model = AppModel.Base.defineSubclass('Competitor',{
  },{saveRpc: true});

  model.defineFields({
    event_id: 'belongs_to',
    climber_id: 'belongs_to',
    category_ids: 'has_many',
  });

  model.addRemoveRpc();

  App.loaded('AppModel.Competitor', model);
});
