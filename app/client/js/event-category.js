App.require('Bart.Event', function (Event) {
  var $ = Bart.current;
  var Tpl = Bart.Event.Category;
  var HeatHeader = Tpl.HeatHeader;
  var ScoreInput = Tpl.ScoreInput;
  var Score = Tpl.Score;
  var scoreElm;
  var InvalidInput = Tpl.InvalidInput.$render();

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
    classes: function () {
      return (this.showingResults ? "rank " : "start ") + this.heat.className();
    },
    modeSwitchLabel: function () {
      return this.showingResults ? "Show start order" : "Show results";
    },
    mode: function () {
      return this.showingResults ? "Results" : "Start order";
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

      var heat = this.heat;

      if (this.showingResults)
        heat.sort(results);
      else
        heat.sortByStartOrder(results);

      var prev, row, rank = 0;
      var compareResults = heat.compareResults();

      for(var i = 0; i < results.length; ++i, prev = row) {
        row = results[i];
        if (! prev || compareResults(prev, row) !== 0)
          rank = i + 1;
        row.rank = rank;
        frag.appendChild(Tpl.Result.$render(row));
      }
      return frag;
    },
  });

  Tpl.$extend({
    $created: function (ctx, elm) {
      Bart.autoUpdate(ctx, {
        subject: ctx.data.category,
        removed: function () {AppRoute.replacePath(Bart.Event)},
      });
      ctx.onDestroy(AppModel.Result.Index.observe(function (doc, old) {
        var result = doc || old;
        if (result.event_id !== Event.event._id ||
            result.category_id !== ctx.data.category._id)
          return;

        updateResults(ctx);
      }));
    },

    $destroyed: function (ctx, elm) {
      removeScore();
    },
  });

  Tpl.$events({
    'click [name=toggleStartOrder]': function (event) {
      Bart.stopEvent();
      var data = $.data();
      data.showingResults = ! data.showingResults;
      updateResults($.ctx);
    },

    'change [name=selectHeat]': function (event) {
      Bart.stopEvent();

      Bart.removeId('ScoreInput');

      setHeatNumber($.ctx, this.value);
    },

    'mousedown td.score': function (event) {
      if (Bart.hasClass(this, 'input') ||
          ! Bart.hasClass(document.body, 'jAccess'))
        return;

      var ctx = $.ctx;
      var data = ctx.data;

      var scoreData = $.data(this);
      var heat = scoreData.heat;
      if (heat < 1) return;

      Bart.stopEvent();

      var input = document.getElementById('ScoreInput');
      if (input === document.activeElement) {
        if (! saveScore(input)) return;
        addScore(document.querySelector('#Result_' + scoreData.result._id + ' td.score.heat' + scoreData.heat));
      } else
        addScore(this);

      if (data.showingResults) {
        data.showingResults = false;
        data.selectHeat = heat === 99 ? data.heat.total : heat;
      }

      updateResults(ctx);
    },
  });

  ScoreInput.$events({
    'change': function (event) {
      saveScore(this);
    },
    'keydown': function (event) {
      switch(event.which) {
      case 27:
        removeScore();
        focusSelectHeat();
        return;
      case 13:
        Bart.stopEvent();
        saveScore(this);
        return;
      case 9:
        if (! saveScore(this) ||
            nextScore(event.shiftKey ? -1 : 1)) {
          Bart.stopEvent();
        }

        return;
      }
    },
  });

  ScoreInput.$helpers({
    placeholder: function () {
      if (this.heat === 99)
        return "m:ss";
      return $.data(document.getElementById('Category')).heat.type === 'B' ? "nta nba" : "n+";
    }
  });

  Tpl.Result.$extend({
    $created: function (ctx) {
      Bart.autoUpdate(ctx, {subject: ctx.data.climber});
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

        } else {
          frag.appendChild(Score.$render({result: result, heat: -2, score: result.rank}));
          for(var i = heat.total; i > 0; --i) {
            if (heat.rankIndex === i)
              renderScore(i, -2);

            renderScore(i);
          }
        }
      } else {
        if (heat.type === 'L' && heat.isFinalRound())
          frag.appendChild(Score.$render({result: result, heat: 99, score: result.displayTimeTaken()}));
        renderScore(heat.number);
        renderScore(heat.number - 1, heat.rankIndex === heat.number - 1);
      }
      return frag;

      function renderScore(i, qr) {
        if (qr)
          var data = {result: result, heat: -2, score: scores[i] == null ? '' : heat.numberToScore(Math.pow(result.rankMult, 1/i), -2)};
        else
          var data = {result: result, heat: i, score: heat.numberToScore(scores[i], i), rank: scores[i] == null ? '' : result['rank'+i]};

        frag.appendChild(Score.$render(data));
      }
    },
  });

  Score.$helpers({
    rank: function () {
      if (! this.rank) return;
      var elm =  document.createElement('i');
      elm.textContent = this.rank;
      return elm;
    },

    classes: function () {
      return 'score heat' + this.heat;
    },
  });

  function setHeatNumber(ctx, value) {
    var data = ctx.data;
    data.heat.number = data.selectHeat =  +value;
    if (data.selectHeat === -1)
      data.showingResults = true;
    updateResults(ctx);
  }

  function updateResults(ctx) {
    var scoreData = getScoreData();

    ctx.updateAllTags();
    if (scoreData) {
      if (ctx.data.showingResults) {
        removeScore();
      } else {
        addScore(document.querySelector('#Result_' + scoreData.result._id + ' td.score.heat' + scoreData.heat),
                 scoreData);
      }
      return;
    }
    focusSelectHeat();
  }

  function saveScore(elm) {
    var ctx = Bart.getCtx(elm);
    var data = ctx.data;
    var number = $.data(document.getElementById('Category')).heat.scoreToNumber(elm.value, data.heat);

    if (number !== false) {
      data.result.setScore(data.heat, data.score = elm.value);
      return true;
    } else {
      Bart.addClass(elm, 'error');
      elm.parentNode.insertBefore(InvalidInput, elm.nextSibling);
      return false;
    }
  }

  function getScoreData() {
    if (scoreElm) {
      var ctx = Bart.getCtx(scoreElm);
      if (ctx) return ctx.data;

      removeScore();
    }
  }

  function addScore(elm, data) {
    var ctx = Bart.getCtx(elm);
    if (! ctx) return;
    removeScore();
    scoreElm = ScoreInput.$autoRender(data || ctx.data);
    elm.insertBefore(scoreElm, elm.firstChild);
    Bart.addClass(elm, 'input');
    scoreElm.focus();
  }

  function removeScore() {
    if (! scoreElm) return;
    Bart.removeClass(scoreElm.parentNode, 'input');
    Bart.remove(scoreElm);
    scoreElm = null;
  }

  function nextScore(direction) {
    var elm = scoreElm.parentNode.parentNode;

    if (direction === 1)
      elm = elm.nextElementSibling;
    else
      elm = elm.previousElementSibling;

    if (elm) {
      var scoreData = getScoreData();
      if (scoreData) {
        addScore(elm.querySelector(' td.score.heat' + scoreData.heat));
        return true;
      }
    }
  }

  function focusSelectHeat() {
    var elm = document.querySelector('#Category [name=selectHeat]');
    elm && elm.focus();
  }
});
