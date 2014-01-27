App.require('AppModel.Climber', function (model) {
  App.extend(model, {
    search: function (text, limit) {
      var regex = new RegExp(".*"+Apputil.regexEscape(text)+".*", "i");
      var results = [];
      try {
        model.find({}, {transform: null}).forEach(function (doc) {
          if (regex.test(doc.name)) {
            results.push(new model(doc));
            if (results.length === limit)
              throw 'stop';
          }

        });
      } catch(ex) {
        if (ex !== 'stop')
          throw ex;
      }

      return results.sort(Apputil.compareByName);
    },
  });
});
