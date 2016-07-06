define(function(require, exports, module) {
  const util = require('koru/util');
  const Team = require('models/team');

  return function (model) {
    util.extend(model, {
      search: function (text, limit, tester) {
        var regex = new RegExp(".*"+util.regexEscape(text)+".*", "i");
        var results = [];
        var docs = model.docs;
        for(var id in docs) {
          var doc = docs[id];
          if (regex.test(doc.name) && (! tester || tester(doc))) {
            results.push(doc);
            if (results.length === limit)
              break;
          }
        }

        return results.sort(util.compareByName);
      },
    });


  };
});
