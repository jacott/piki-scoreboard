App.require('AppModel.Event', function () {
  var model = AppModel.Base.defineSubclass('Competitor',{
  },{saveRpc: true});

  model.defineFields({
    event_id: 'belongs_to',
    climber_id: 'belongs_to',
    category_ids: 'has_many',
    createdAt: 'timestamp',
  });

  model.addRemoveRpc();

  App.loaded('AppModel.Competitor', model);
});
