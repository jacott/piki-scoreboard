App.require('Bart.Event', function (Event) {
  var $ = Bart.current;
  var Tpl = Bart.Event.Category;
  var HeatHeader = Tpl.HeatHeader;
  var Heat = Tpl.Heat;
  var Score = Tpl.Score;

  Event.route.addTemplate(Tpl, {
    focus: true,
    data: function (page,pageRoute) {
      if (! Event.event) AppRoute.abortPage();
      return {
        category: AppModel.Category.findOne(pageRoute.append),
        heat: new AppModel.Heat(-1,  Event.event.heats[pageRoute.append]),
        selectHeat: -1,
      };
    }
  });

  Tpl.$helpers({
    heats: function () {
      return this.heat.list();
    },
    headers: function () {
      var frag = document.createDocumentFragment();
      this.heat.headers(function (number, name) {
        frag.appendChild(HeatHeader.$render({heat: number, name: name}));
      });
      return frag;
    },

    results: function () {
      var frag = document.createDocumentFragment();

      var results = this.heat.sort(AppModel.Result.eventCatIndex
                                   .fetch({event_id: Event.event._id, category_id: $.data().category._id}));

      for(var i = 0; i < results.length; ++i) {
        var row = results[i];
        frag.appendChild(Tpl.Result.$render(row));
      }
      return frag;
    },
  });

  Tpl.$extend({
    $created: function (ctx, elm) {
      ctx.onDestroy(AppModel.Result.Index.observe(function (doc, old) {
        var result = doc || old;
        if (result.event_id !== Event.event._id ||
            result.category_id !== ctx.data.category._id)
          return;

        ctx.updateAllTags();
      }));
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
      var result = Bart.getCtx(parentElm).data;
      var scores = result.scores;

      var heat = $.ctx.parentCtx.data.heat;

      for(var i = heat.format.length; i >= 0; --i) {
        frag.appendChild(Score.$render({heat: i, score: heat.numberToScore(scores[i], i), rank: scores[i] && result['rank'+i]}));
      }
      return frag;
    },
  });

  Tpl.Score.$helpers({
    rank: function () {
      if (! this.rank) return;
      var elm =  document.createElement('i');
      elm.textContent = this.rank;
      return elm;
    },
  });

  function setHeatNumber(ctx, value) {
    ctx.data.heat.number = ctx.data.selectHeat =  +value;
    ctx.updateAllTags();
  }
});
