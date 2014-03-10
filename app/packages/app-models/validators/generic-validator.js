AppVal.register('validate', function (doc, field, validator) {
  validator && validator.call(doc, field);
});
