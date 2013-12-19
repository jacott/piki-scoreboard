AppVal.register('inclusion', function (doc, field, options) {
  var val = doc[field];
  if (! val) {
    var allowBlank = options.allowBlank;
    if (allowBlank || val == null && allowBlank === null) return;
  }

  options = options || {};
  if ('in' in options && options['in'].indexOf(val) === -1)
    return AppVal.addError(doc,field,'not_in_list');

  if ('matches' in options && ! options['matches'].test(val))
    return AppVal.addError(doc,field,'invalid_format');

});
