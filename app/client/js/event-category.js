App.require('Bart.Event', function (Event) {
  var $ = Bart.current;
  var Tpl = Bart.Event.Category;

  Event.route.addTemplate(Tpl, {
    focus: true,
    data: function (page,pageRoute) {
      return AppModel.Category.findOne(pageRoute.append);
    }
  });

  Tpl.$helpers({
    results: function (callback) {
      var Result = AppModel.Result;
      var category = $.data();
      var params = {event_id: Event.event._id, category_id: category._id};
      var resultIndex = Result.eventCatIndex(params) || {};

      var docs = Result.attrDocs();
      var results = [];
      for(var climber_id in resultIndex) {
        results.push(docs[resultIndex[climber_id]]);
      }

      results.sort(compareResults)
        .forEach(function (doc) {callback(new Result(doc))});

      return AppModel.Result.Index.observe(function (doc, old) {
        if (Apputil.includesAttributes(params, doc, old))
            callback(doc && new Result(doc), old && new Result(old), compareResults);
      });

    },
  });

  function compareResults(a, b) {
    return a.scores[0] === b.scores[0] ? 0 : a.scores[0] < b.scores[0] ? -1 : 1;
  }
});
