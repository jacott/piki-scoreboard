App.require('AppModel.Club', function () {
  var model = AppModel.Base.defineSubclass('Climber',{
  },{saveRpc: true});


  model.defineFields({
    name: {type:  'text', trim: true, required: true, maxLength: 200, unique: {score: 'org_id'}},
    org_id: 'belongs_to',
    club_id: {type: 'belongs_to', required: true},
    dateOfBirth: {type: 'date', inclusion: {matches: /^\d{4}-[01]\d-[0-3]\d$/}},
    gender: {type: 'text', inclusion: {allowBlank: true, matches: /^[mf]$/ }},
    number: {type: 'number', number: {integer: true, $gt: 0}},
    uploadId: 'number',
  });

  model.addRemoveRpc();

  App.loaded('AppModel.Climber', model);
});
