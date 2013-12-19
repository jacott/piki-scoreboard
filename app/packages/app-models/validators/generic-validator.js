AppVal.register('validate', function (doc, field, validator) {
  validator.call(doc, field);
});
