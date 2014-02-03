App.require('AppModel.Climber', function (model) {
  App.extend(model, {
    search: function (text, limit, tester) {
      var regex = new RegExp(".*"+Apputil.regexEscape(text)+".*", "i");
      var results = [];
      var docs = model.attrDocs();
      for(var id in docs) {
        var doc = docs[id];
        if (regex.test(doc.name) && (! tester || tester(doc))) {
          results.push(new model(doc));
          if (results.length === limit)
            break;
        }
      }

      return results.sort(Apputil.compareByName);
    },
  });
});
