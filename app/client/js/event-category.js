App.require('Bart.Event', function (Event) {
  var $ = Bart.current;
  var Tpl = Bart.Event.Category;
  var Heat = Tpl.Heat;
  var Score = Tpl.Score;

  Event.route.addTemplate(Tpl, {
    focus: true,
    data: function (page,pageRoute) {
      return {
        category: AppModel.Category.findOne(pageRoute.append),
        heat: new AppModel.Heat(1, Event.event.heats[pageRoute.append]),
      };
    }
  });

  Tpl.$helpers({
    results: function (callback) {
      return callback.render({
        model: AppModel.Result,
        index: AppModel.Result.eventCatIndex,
        params: {event_id: Event.event._id, category_id: $.data().category._id},
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

  Heat.$events({
    'submit': function (event) {
      event.$actioned = true;

      var data = $.data(this);
      data.result.setScore(data.heat.number, this.querySelector('[name=score]').value);
    },
  });

  Tpl.Result.$helpers({
    scores: function () {
      var parentElm = $.element.parentNode;
      var scores = Bart.getCtx(parentElm).data.scores;

      var heat = $.ctx.parentCtx.data.heat;

      Bart.removeAll(parentElm.querySelectorAll('td.score'));

      for(var i = heat.format.length; i > 0; --i) {
        parentElm.appendChild(Score.$render({heat: i, score: heat.numberToScore(scores[i])}));
      }
    },
  });
});
