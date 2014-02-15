App.require('Bart.Event', function (Event) {
  var $ = Bart.current;
  var Tpl = Bart.Event.Category;
  var HeatHeader = Tpl.HeatHeader;
  var Heat = Tpl.Heat;
  var Score = Tpl.Score;

  Event.route.addTemplate(Tpl, {
    focus: '#Category [name=selectHeat]',
    data: function (page,pageRoute) {
      if (! Event.event) AppRoute.abortPage();
      return {
        category: AppModel.Category.findOne(pageRoute.append),
        heat: new AppModel.Heat(-1,  Event.event.heats[pageRoute.append]),
        get selectHeat() {return this.heat.number},
        set selectHeat(value) {return this.heat.number = value},
        showingResults: true,
      };
    }
  });

  Tpl.$helpers({
    modeSwitchLabel: function () {
      return this.showingResults ? "Show start list" : "Show results";
    },
    mode: function () {
      return this.showingResults ? "Results" : "Start list";
    },
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

      var results = AppModel.Result.eventCatIndex.fetch({
        event_id: Event.event._id, category_id: $.data().category._id,
      });

      if (this.showingResults)
        this.heat.sort(results);
      else
        this.heat.sortByStartOrder(results);

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

        updateResults(ctx);
      }));
    },
  });

  Tpl.$events({
    'click [name=toggleStartList]': function (event) {
      event.$actioned = true;
      var data = $.data();
      if (data.showingResults && data.selectHeat < 1)
        data.selectHeat = 1;
      data.showingResults = ! data.showingResults;
      updateResults($.ctx);
    },

    'change [name=selectHeat]': function (event) {
      event.$actioned = true;

      Bart.removeId('Heat');

      setHeatNumber($.ctx, this.value);
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
      if (heat.number <= heat.rankIndex) {

        if (heat.number >= 0) {
          renderScore(heat.number);

        } else for(var i = heat.format.length; i > 0; --i) {
          if (heat.rankIndex === i)
            renderScore(i, -2);

          renderScore(i);
        }
      } else {
        renderScore(heat.number);
        renderScore(heat.number - 1, heat.rankIndex === heat.number - 1);
      }
      return frag;

      function renderScore(i, qr) {
        if (qr)
          var data = {heat: -2, score: scores[i] == null ? '' : heat.numberToScore(Math.pow(result.rankMult, 1/i), -2)};
        else
          var data = {heat: i, score: heat.numberToScore(scores[i], i), rank: scores[i] == null ? '' : result['rank'+i]};

        frag.appendChild(Score.$render(data));
      }
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
    updateResults(ctx);
  }

  function updateResults(ctx) {
    ctx.updateAllTags();
    var elm = document.querySelector('#Category [name=selectHeat]');
    elm && elm.focus();
  }
});
