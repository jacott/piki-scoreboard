App.require('Bart.Event', function (Event) {
  var $ = Bart.current;
  var Tpl = Bart.Event.Category;
  var Heat = Tpl.Heat;

  Event.route.addTemplate(Tpl, {
    focus: true,
    data: function (page,pageRoute) {
      return AppModel.Category.findOne(pageRoute.append);
    }
  });

  Tpl.$helpers({
    results: function (callback) {
      callback.render({
        model: AppModel.Result,
        index: AppModel.Result.eventCatIndex,
        params: {event_id: Event.event._id, category_id: $.data()._id},
        sort:   function compareResults(a, b) {
          var aScore = a.scores && a.scores[0];
          var bScore = b.scores && b.scores[0];
          return aScore === bScore ? 0 : aScore < bScore ? -1 : 1;
        },
      });
    },
  });

  Tpl.$events({
    'click td.climber': function (event) {
      event.$actioned = true;

      var heatElm = document.getElementById('Heat');
      if (! heatElm) {
        heatElm = Heat.$autoRender();
        event.currentTarget.querySelector('.heatUpdate').appendChild(heatElm);
      }

      var result = $.data(this);

      Bart.getCtx(heatElm).updateAllTags({result: result, heat: result.unscoredHeat()});
    },
  });

});
