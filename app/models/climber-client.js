define(function(require) {
  const util = require('koru/util');
  const Team = require('models/team');

  return function (Climber) {
    util.extend(Climber, {
      search(text, limit, tester) {
        var regex = new RegExp(".*"+util.regexEscape(text)+".*", "i");
        var results = [];
        var docs = Climber.docs;
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
