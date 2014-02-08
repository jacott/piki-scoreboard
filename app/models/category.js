App.require('AppModel.Org', function () {
  var model = AppModel.Base.defineSubclass('Category',{
  },{saveRpc: true});

  model.defineFields({
    org_id: 'belongs_to',    name: {type:  'text', trim: true, required: true, maxLength: 200},
    group: {type:  'text', trim: true, required: true, maxLength: 30},
    shortName: {type: 'text', trim: true, required: true, maxLength: 4, normalize: 'upcase'},
    gender: {type: 'text', inclusion: {allowBlank: true, matches: /^[mf]$/ }},
    heats: {type: 'has-many', validate: validateHeats},
    minAge: {type: 'number', number: {integer: true, $gt: 0, $lt: 100}},
    maxAge: {type: 'number', number: {integer: true, $gt: 0, $lt: 100}},
  });

  model.addRemoveRpc();

  var HEAT_FIELDS = {'id': true, 'name': true};

  App.loaded('AppModel.Category', model);



  function validateHeats(field) {
    if (! (field in this.changes)) return;

    var value = this.changes[field];

    var valid = true;

    if (value.constructor === Array) {
      for(var i = 0; valid && i < value.length; ++i) {
        var row = value[i];

        for(var key in row) {
          if (! (key in HEAT_FIELDS)) {
            valid = false;
            break;
          }
        }
        for(var key in HEAT_FIELDS) {
          if (typeof row[key] !== 'string' || row[key].length > 30) {
            valid = false;
            break;
          }
        }
      }
      if (valid) return; // SUCCESS
    }

    return AppVal.addError(this, field, 'is_invalid');

  }
});
