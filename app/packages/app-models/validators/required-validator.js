AppVal.register('required', function (doc,field,reqType) {
  var val = doc[field];

  switch (reqType) {
  case 'not_null': break;
  case 1:
    if (! val || ! val.length) val = null;
  default:
    if (! val) val = null;
  }

  if (val == null)
    AppVal.addError(doc,field,'is_required');
});
