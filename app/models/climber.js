App.require('AppModel.Club', function () {
  var model = AppModel.Base.defineSubclass('Climber',{
  },{saveRpc: true});


  model.defineFields({
    name: {type:  'text', trim: true, required: true, maxLength: 200},
    org_id: 'belongs_to',
    club_id: 'belongs_to',
    dateOfBirth: {type: 'date'},
    gender: {type: 'text'},
  });

  model.addRemoveRpc();

  App.loaded('AppModel.Climber', model);
});
