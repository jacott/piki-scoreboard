App.require('AppModel.Club', function () {
  var model = AppModel.Base.defineSubclass('Climber',{
  },{saveRpc: true});


  model.defineFields({
    name: {type:  'text', trim: true, required: true, maxLength: 200},
    org_id: 'belongs_to',
    club_id: 'belongs_to',
    dateOfBirth: {type: 'date', inclusion: {matches: /^\d{4}-[01]\d-[0-3]\d$/}},
    gender: {type: 'text', required: true, inclusion: {allowBlank: true, matches: /^[mf]$/ }},
  });

  model.addRemoveRpc();

  App.loaded('AppModel.Climber', model);
});
