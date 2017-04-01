define(function(require, exports, module) {
  const koru     = require('koru');
  const Dom      = require('koru/dom');
  const Route    = require('koru/ui/route');
  const util     = require('koru/util');
  const Category = require('models/category');
  const Heat     = require('models/heat');
  const Result   = require('models/result');
  const Team     = require('models/team');
  const eventTpl = require('./event');

  const Tpl   = Dom.newTemplate(require('koru/html!./event-category'));
  const $ = Dom.current;
  const HeatHeader = Tpl.HeatHeader;
  const Score = Tpl.Score;
  const BoulderScore = Tpl.BoulderScore;
  const InvalidInput = Tpl.InvalidInput.$render();

  let focusField;

  koru.onunload(module, () => {eventTpl.route.removeTemplate(Tpl)});

  eventTpl.route.addTemplate(module, Tpl, {
    focus: '.Category [name=selectHeat]',
    data(page,pageRoute) {
      if (! eventTpl.event) Route.abortPage();
      var params = Route.searchParams(pageRoute);
      return {showingResults: params.type === 'results',
              category_id: pageRoute.append, heatNumber: +(params.heat || -1)};
    }
  });

  Tpl.$helpers({
    classes() {
      return (this.showingResults ? "Category rank " : "Category start ") +
        this.heat.className() + ' ' + this.heat.type;
    },
    modeSwitchLabel() {
      return this.showingResults ? "Show start order" : "Show results";
    },
    mode() {
      return this.showingResults ? "Results" : "Start order";
    },
    heats() {
      return this.heat.list();
    },
    headers() {
      var frag = document.createDocumentFragment();
      this.heat.headers((number, name) => {
        frag.appendChild(HeatHeader.$render({heat: number, name: name}));
      });
      return frag;
    },

    results() {
      var frag = document.createDocumentFragment();

      var results = Result.eventCatIndex.fetch({
        event_id: eventTpl.event._id, category_id: $.data().category._id,
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
    $created(ctx, elm) {
      var data = ctx.data;
      var showingResults = data.showingResults;
      util.extend(data, {
        category: Category.findById(data.category_id),
        heat: new Heat(data.heatNumber,  eventTpl.event.heats[data.category_id]),
        get selectHeat() {return this.heat.number},
        set selectHeat(value) {return this.heat.number = value},
        get showingResults() {return showingResults},
        set showingResults(value) {
          showingResults = value;
          if (showingResults)
            focusField = null;
          this.canInput = ! (value || eventTpl.event.closed) &&
            Dom.hasClass(document.body, 'jAccess');
          return value;
        },
      });
      data.showingResults = showingResults; // set canInput

      Dom.autoUpdate(ctx, {
        subject: data.category,
        removed() {Route.replacePath(eventTpl)},
      });
      ctx.onDestroy(Result.onChange((doc, was) => {
        var result = doc || was;
        if (result.event_id !== eventTpl.event._id ||
            result.category_id !== ctx.data.category._id)
          return;

        updateResults(ctx);
      }));
    },

    $destroyed(ctx, elm) {
      focusField = null;
    },
  });

  Tpl.$events({
    'click [name=toggleStartOrder]'(event) {
      Dom.stopEvent();
      var data = $.data();
      data.showingResults = ! data.showingResults;
      updateResults($.ctx);
    },

    'change [name=selectHeat]'(event) {
      Dom.stopEvent();

      setHeatNumber($.ctx, this.value);
    },

    'change td.score input'(event) {
      if (! saveScore(this)) {
        Dom.stopEvent();
        getFocusElm().focus();
        return;
      }
    },

    'focus td.score input'(event) {
      setFocusField(this);
    },

    'keydown td.score input'(event) {
      switch(event.which) {
      case 27:
        focusField = null;
        if (Dom.hasClass(this, 'score')) {
          event.target.value = $.data(this).score || '';
          Dom.remove(this.parentNode.querySelector('.errorMsg'));
        } else {
          Dom.getCtx(this).updateAllTags();
        }
        document.activeElement.blur();
        break;

      case 13:
        Dom.stopEvent();
        if (saveScore(event.target)) {
          focusField = null;
          document.activeElement.blur();
        }
        break;
      case 9:
        var oldFocus = focusField;
        focusField = nextField(document.activeElement, event.shiftKey ? -1 : 1);

        var res  = saveScore(event.target);
        if (! res) {
          if (res === null && oldFocus.id === focusField.id) {
            return;
          }

          focusField = oldFocus;
          Dom.stopEvent();
          document.activeElement.select();
          return;
        }
        if (document.activeElement === event.target) {
          Dom.remove(this.parentNode.querySelector('.errorMsg'));
          return;
        }
        Dom.stopEvent();
        break;
      }
    },


    'pointerdown td.score'(event) {
      if (event.target === document.activeElement ||
          ! Dom.hasClass(document.body, 'jAccess'))
        return;

      Dom.stopEvent();

      var input = event.target.tagName === 'INPUT' ? event.target : event.target.querySelector('input') || this.querySelector('input');
      if (input) {
        input.focus();
        input.select();
        return;
      }

      var ctx = $.ctx;
      var data = ctx.data;

      var scoreData = $.data(this);
      var heat = scoreData.heat;
      if (typeof heat === 'object')
        heat = heat.number;
      if (heat < 1) return;


      input = document.activeElement;
      if (Dom.hasClass(input, 'score')) {
        if (! saveScore(input)) return;
      }

      if (data.showingResults) {
        data.showingResults = false;

        data.selectHeat = heat === 99 ? data.heat.total : heat;
      }

      updateResults(ctx);
    },
  });

  HeatHeader.$helpers({
    heatClass() {
      Dom.addClass($.element, this.heat > 0 ? (this.name === 'Result' ? 'problem' : 'score') : 'other');
    },
  });

  Tpl.Result.$extend({
    $created(ctx) {
      Dom.autoUpdate(ctx, {subject: ctx.data.climber});
    },
  });

  Tpl.Result.$helpers({
    teams() {
      let frag = document.createDocumentFragment();
      let teamMap = {};
      for (let tid of this.competitor.team_ids) {
        let team = Team.findById(tid);
        teamMap[team.teamType_id] = team;
      }

      this.event.sortedTeamTypes.forEach(tt => {
        let team = teamMap[tt._id];
        frag.appendChild(Dom.h({span: team ? team.shortName : ""}));
      });
      return frag;
    },
    scores() {
      var frag = document.createDocumentFragment();
      var parentCtx = Dom.getCtx($.element.parentNode);
      var result = parentCtx.data;
      var scores = result.scores;

      var heat = $.ctx.parentCtx.data.heat;

      var number = heat.number;
      var boulder = heat.type === 'B';
      var canInput = parentCtx.parentCtx.data.canInput;

      if (boulder && number >= 0) {
        renderBoulderScore(canInput);
      }

      canInput = canInput && ! boulder;

      if (heat.number <= heat.rankIndex) {

        if (heat.number >= 0) {
          renderScore(heat.number, canInput);

        } else {
          frag.appendChild(Score.$render({result: result, heat: -2, score: result.rank}));
          for(var i = heat.total; i > 0; --i) {
            if (heat.rankIndex === i)
              renderScore(i, null, -2);

            renderScore(i);
          }
        }
      } else {
        if (heat.type === 'L' && heat.isFinalRound())
          frag.appendChild(Score.$render({result: result, canInput: canInput, heat: 99,
                                          score: result.displayTimeTaken()}));
        renderScore(heat.number, canInput);
        renderScore(heat.number - 1, null, heat.rankIndex === heat.number - 1);
      }
      return frag;

      function renderScore(i, canInput, qr) {
        if (qr)
          var data = {
            result: result, heat: -2,
            score: scores[i] == null && heat.total !== heat.rankIndex ? ''
              : heat.numberToScore(Math.pow(result.rankMult, 1/i), -2)};
        else
          var data = {result: result, canInput: canInput, heat: i,
                      score: heat.numberToScore(scores[i], i),
                      rank: scores[i] == null ? '' : result['rank'+i]};

        frag.appendChild(Score.$render(data));
      }

      function renderBoulderScore(canInput) {
        frag.appendChild(BoulderScore.$render({result: result, heat: heat, canInput: canInput}));
      }
    },
  });

  Score.$helpers({
    rank() {
      if (! this.rank) return;
      var elm =  document.createElement('i');
      elm.textContent = this.rank;
      return elm;
    },

    score() {
      if (this.canInput) {
        var elm = document.createElement('input');
        elm.setAttribute('placeholder', this.heat === 99 ? "m:ss" : "n+");
        elm.tabIndex = this.heat;
        elm.className = 'score';
        if (this.score != null)
          elm.value = this.score.toString();
      } else {
        var elm = document.createElement('span');
        elm.textContent = this.score;
      }

      return elm;
    },

    heatClass() {
      Dom.addClass($.element, 'heat' + this.heat);
    },
  });

  BoulderScore.$helpers({
    problems() {
      var len = this.heat.problems;
      var problems = this.result.problems ? this.result.problems[this.heat.number - 1] || [] : [];
      var canInput = this.canInput;

      var frag = document.createDocumentFragment();
      for(var i = 0; i < len; ++i) {
        var prob = problems[i];
        var elm = document.createElement('div');
        if (prob === -1) {
          elm.className = "dnc";
          elm.appendChild(createAttempts('top', "nc", i, canInput));
          elm.appendChild(createAttempts('bonus', "", i, canInput));
        } else if (prob == null) {
          elm.appendChild(createAttempts('top', "", i, canInput));
          elm.appendChild(createAttempts('bonus', "", i, canInput));
        } else {
          if (prob > 0) elm.className = prob >= 100 ? 'top' : 'bonus';
          else elm.className = "ns";
          elm.appendChild(createAttempts('top', Math.floor(prob / 100), i, canInput));
          elm.appendChild(createAttempts('bonus', (prob % 100) || "-", i, canInput));
        }
        frag.appendChild(elm);
      }
      return frag;
    },
  });

  function createAttempts(name, attempts, number, canInput) {
    if (canInput) {
      var elm = document.createElement('input');
      elm.tabIndex = number+1;
      if (attempts)
        elm.value = attempts;
    } else {
      var elm = document.createElement('span');
      if (attempts) elm.textContent = attempts;
    }
    elm.className = name;
    return elm;
  }

  function setHeatNumber(ctx, value) {
    var data = ctx.data;
    data.heat.number = data.selectHeat =  +value;
    if (data.selectHeat === -1)
      data.showingResults = true;
    updateResults(ctx);
  }

  function updateResults(ctx) {
    if (focusField) {
      var input = getFocusElm();
      if (input === document.activeElement) {
        var start = input.selectionStart;
        var end = input.selectionEnd;
        var value = input.value;
      } else {
        input = null;
      }
    }

    ctx.updateAllTags();

    if (focusField) {
      var elm = getFocusElm();
      if (elm) {
        elm.focus();
        if (input) {
          elm.value = value;
          elm.setSelectionRange(start, end);
        } else {
          elm.select();
        }
        return;
      }
    }
    document.activeElement.blur();
  }

  function getFocusElm() {
    return document.querySelector(
      '#' + focusField.id + ' td.score input[tabIndex="'+focusField.tabIndex+'"].'+focusField.name);
  }

  function saveScore(elm) {
    var ctx = Dom.getCtx(elm);
    var data = ctx.data;
    if (! data.result || data.score === elm.value) return true;

    var heat = Tpl.$ctx(ctx).data.heat;

    if (Dom.hasClass(elm, 'score')) {
      var number = heat.scoreToNumber(elm.value, data.heat);

      if (number !== false) {
        data.result.setScore(data.heat, data.score = elm.value);
        return true;
      }

      Dom.addClass(elm, 'error');
      elm.parentNode.insertBefore(InvalidInput, elm.nextSibling);
      return false;
    }

    var parent = elm.parentNode;
    var top = parent.querySelector('input.top');
    var onTop = top === elm;
    top = top.value.trim();
    var bonus = parent.querySelector('input.bonus').value.trim();
    if (top === "-") top = "0";
    if (bonus === "-") bonus = "0";
    var tabIndex = +elm.getAttribute('tabIndex');
    if (! top && ! bonus) {
      data.result.setBoulderScore(data.heat.number, tabIndex);
      return true;
    }
    if (top.match(/nc/i) || bonus.match(/nc/i)) {
      data.result.setBoulderScore(data.heat.number, tabIndex, "dnc");
      return true;
    }
    top = +(top || 0);
    bonus = +(bonus || 0);
    if (! isNaN(top) && ! isNaN(bonus) && top >=0 && bonus >= 0) {
      if (top && ! bonus) return null;
      if (! top || (bonus && bonus <= top)) {
        Dom.removeClass(parent, 'error');
        data.result.setBoulderScore(data.heat.number, tabIndex, bonus, top);
        return true;
      }
    }
    Dom.addClass(parent, 'error');
    return false;
  }

  function setFocusField(input) {
    focusField = {
      id: Dom.getClosest(input, 'tr').id,
      tabIndex: +input.getAttribute('tabIndex'),
      name: input.className.replace(/ .*$/, ''),
    };
  };

  function nextField(elm, direction) {
    var tabIndex = +elm.getAttribute('tabIndex');

    var row = elm.parentNode.parentNode;

    if (Dom.hasClass(row, 'BoulderScore')) {
      row = row.parentNode;

      var name = Dom.hasClass(elm, 'top') ? 'bonus' : 'top';
      if (direction > 0 && name === 'top')
        row = row.nextElementSibling;
      else if (direction < 0 && name === 'bonus')
        row = row.previousElementSibling;

      if (! row) {
        elm = document.querySelector('.results tr:'+
                                     (direction > 0 ? 'first' : 'last')+'-child>td.score input'+
                                     '[tabIndex="'+(tabIndex+direction)+'"]');
        if (! elm) return;

        tabIndex = +elm.getAttribute('tabIndex');

        row = elm.parentNode.parentNode.parentNode;
      }

    } else {
      var name = 'score';
      row = direction > 0 ? row.nextElementSibling : row.previousElementSibling;

      if (!row) {
        elm =
          document.querySelector('.results tr:'+
                                 (direction > 0 ? 'first' : 'last')+'-child>td.score>input'+
                                 ':not([tabIndex="'+tabIndex+'"])');

        if (! elm) return;

        tabIndex = +elm.getAttribute('tabIndex');

        row = elm.parentNode.parentNode;
      }
    }

    if (row) return {id: row.id, tabIndex: tabIndex, name: name};
  }

  return Tpl;
});
