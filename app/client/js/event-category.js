App.require('Bart.Event', function (Event) {
  var $ = Bart.current;
  var Tpl = Bart.Event.Category;
  var HeatHeader = Tpl.HeatHeader;
  var Heat = Tpl.Heat;
  var Score = Tpl.Score;

  Event.route.addTemplate(Tpl, {
    focus: true,
    data: function (page,pageRoute) {
      return {
        category: AppModel.Category.findOne(pageRoute.append),
        heat: new AppModel.Heat(-1,  Event.event ? Event.event.heats[pageRoute.append] : ""),
        selectHeat: -1,
      };
    }
  });

  Tpl.$helpers({
    heats: function () {
      return this.heat.list();
    },
    headers: function () {
      var heat = this.heat;
      var frag = document.createDocumentFragment();
      for(var i = heat.format.length; i >= 0; --i) {
        frag.appendChild(HeatHeader.$render({heat: i, name: heat.getName(i)}));
      }
      return frag;
    },

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
    'change [name=selectHeat]': function (event) {
      event.$actioned = true;

      setHeatNumber($.ctx, this.value);

      Bart.removeId('Heat');
    },

    'click td.climber': function (event) {
      event.$actioned = true;

      var result = $.data(this);
      var catCtx = Bart.getCtx(document.getElementById('Category'));

      if (catCtx.data.selectHeat === -1)
        setHeatNumber(catCtx, result.unscoredHeat());

      var heatElm = document.getElementById('Heat');
      if (! heatElm) {
        heatElm = Heat.$autoRender();
        event.currentTarget.querySelector('.heatUpdate').appendChild(heatElm);
      }

      Bart.getCtx(heatElm).updateAllTags({result: result, heat: catCtx.data.heat});
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
      var frag = document.createDocumentFragment();
      var parentElm = $.element.parentNode;
      var scores = Bart.getCtx(parentElm).data.scores;

      var heat = $.ctx.parentCtx.data.heat;

      for(var i = heat.format.length; i >= 0; --i) {
        frag.appendChild(Score.$render({heat: i, score: heat.numberToScore(scores[i], i)}));
      }
      return frag;
    },
  });

  function setHeatNumber(ctx, value) {
    ctx.data.heat.number = ctx.data.selectHeat =  +value;
    ctx.updateAllTags();
  }
});
