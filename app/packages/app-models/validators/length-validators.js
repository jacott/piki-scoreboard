AppVal.register('maxLength', function (doc,field,len) {
  if (doc[field] && doc[field].length > len) {
    AppVal.addError(doc,field,'too_long',len);
  }
});
