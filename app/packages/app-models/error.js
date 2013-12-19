AppVal.module('Error', {
  msgFor: function (doc, field, other_error) {
    var errors = doc._errors ? doc._errors[field] : typeof doc === 'string' ? [[doc]] : doc;
    if (errors) {
      return errors.map(function (error) {
        return App.format(App.ResourceString.en[error[0]] || error[0], error.slice(1));
      }).join(", ");
    } else if (other_error) {
      console.log('ERROR: ', JSON.stringify(doc._errors));
      return App.ResourceString.en[other_error];
    } else
      return null;
  },
});
