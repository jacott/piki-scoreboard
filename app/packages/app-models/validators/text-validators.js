var colorRe = /^#[0-9a-f]{3}([0-9a-f]{3})?$/;

AppVal.register('normalize', function (doc,field, options) {
  if (options === 'downcase') {
    var val = doc[field];
    if (val)
      doc[field] = val.toLowerCase();
  }
});

AppVal.register('color', function (doc,field) {
  var val = doc[field];
  if (val && ! colorRe.test(val))
    AppVal.addError(doc,field,'is_invalid');
});

AppVal.register('number', function (doc,field, options) {
  var val = doc[field];

  if (val == null) return;

  if (options === true || options == null) options = {};

  if (val != null && typeof val !== 'number') {
    if (typeof val === 'string' && +val === +val)
      val = +val;
    else
      return AppVal.addError(doc,field,'not_a_number');
  }

  if (options.integer && val !== Math.floor(val))
    return AppVal.addError(doc,field,'not_an_integer');

  if (options.$lte != null && val > options.$lte)
    return AppVal.addError(doc,field,'cant_be_greater_than', options.$lte);

  if (options.$lt != null && val >= options.$lt)
    return AppVal.addError(doc,field,'must_be_less_than', options.$lt);

  if (options.$gte != null && val < options.$gte)
    return AppVal.addError(doc,field,'cant_be_less_than', options.$gte);

  if (options.$gt != null && val <= options.$gt)
    return AppVal.addError(doc,field,'must_be_greater_than', options.$gt);

  doc[field] = val;
});

AppVal.register('boolean', function (doc, field) {
  var val = doc[field];

  if (val != null) {
    if (typeof val === 'string') {
      val = val.trim().toLowerCase();
      switch (val) {
      case 'true': case 'on': case '1': case 't':
        val = true;
        break;
      case 'false': case 'off': case '0': case 'f':
        val = false;
        break;
      }
    }

    if (val === false || val === true)
      doc[field] = val;
    else
      AppVal.addError(doc,field,'not_a_boolean');
  }
});

AppVal.register('trim', function (doc, field, type) {
  var val = doc[field];

  if (val != null) {
    if (typeof val !== 'string')
      AppVal.addError(doc,field,'not_a_string');
    else {
      val = val.trim();
      if (type === 'toNull' && ! val) val = null;
      doc[field] = val;
    }
  }
});
