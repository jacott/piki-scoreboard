define(function(require, exports, module) {
  const Model      = require('koru/model');
  const session    = require('koru/session');
  const util       = require('koru/util');
  const Team       = require('models/team');

  return function (Climber) {
    util.merge(Climber, {
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

    session.registerBroadcast(module, 'mergeClimbers', function (climberId, ids) {
      [Model.Competitor, Model.Result].forEach(model => {
        model.where({climber_id: ids}).update('climber_id', climberId);
      });
      ids.forEach(id => {
        Climber.serverQuery.onId(id).remove();
      });
    });
  };
});
