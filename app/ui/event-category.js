define((require, exports, module)=>{
  const Dom             = require('koru/dom');
  const Route           = require('koru/ui/route');
  const util            = require('koru/util');
  const Category        = require('models/category');
  const Heat            = require('models/heat');
  const Result          = require('models/result');
  const Team            = require('models/team');
  const eventTpl        = require('./event');

  const orig$ = Symbol();

  const Tpl = Dom.newTemplate(require('koru/html!./event-category'));
  const $ = Dom.current;
  const {HeatHeader, Score, BoulderScore} = Tpl;
  const InvalidInput = Tpl.InvalidInput.$render();

  let focusField = null;

  const createAttempts = (name, attempts, number, canInput)=>{
    let elm;
    if (canInput) {
      elm = document.createElement('input');
      elm.tabIndex = number+1;
      elm[orig$] = elm.value = attempts || '';
    } else {
      elm = document.createElement('span');
      if (attempts) elm.textContent = attempts;
    }
    elm.className = name;
    return elm;
  };

  const setHeatNumber = (ctx, value)=>{
    const data = ctx.data;
    data.heat.number = data.selectHeat =  +value;
    if (data.selectHeat === -1)
      data.showingResults = true;
    updateResults(ctx);

    const pageRoute = util.shallowCopy(Route.currentPageRoute);
    pageRoute.search =
      `?type=${data.showingResults ? 'results' : 'startlists'}&heat=${data.heat.number}`;
    Route.replaceHistory(pageRoute);
  };

  const updateResults = (ctx)=>{
    let input, value, start, end;

    ctx.updateAllTags();

    if (focusField !== null) {
      const elm = getFocusElm();
      if (elm) {
        elm.focus();
        if (input) {
          elm[orig$] = elm.value = value;
          elm.setSelectionRange(start, end);
        } else {
          elm.select();
        }
        return;
      }
    }
    document.activeElement.blur();
  };

  const getFocusElm = ()=>{
    return focusField && document.querySelector(
      '#' + focusField.id + ' td.score input[tabIndex="'+focusField.tabIndex+'"].'+focusField.name);
  };

  const saveScore = (elm)=>{
    if (elm.value === elm[orig$]) return true;
    const ctx = Dom.ctx(elm);
    const data = ctx.data;
    if (! data.result) return true;

    const heat = Tpl.$ctx(ctx).data.heat;

    if (Dom.hasClass(elm, 'score')) {
      const number = heat.scoreToNumber(elm.value, data.heat);

      if (number !== false) {
        data.result.setScore(data.heat, data.score = elm.value);
        return true;
      }

      Dom.addClass(elm, 'error');
      elm.parentNode.insertBefore(InvalidInput, elm.nextSibling);
      return false;
    }

    const parent = elm.parentNode;
    let top = parent.querySelector('input.top');
    const onTop = top === elm;
    top = top.value.trim();
    const bonusElm = parent.querySelector('input.bonus');
    let bonus = bonusElm.value.trim();
    if (top === "-") top = "0";
    if (bonus === "-") bonus = "0";
    const tabIndex = +elm.getAttribute('tabIndex');
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
    const isNumber = ! (isNaN(top) || isNaN(bonus));
    if (isNumber && top >=0 && bonus >= 0) {
      if (top && ! bonus) {
        parent.classList.add('incomplete');
        parent.classList.remove('error');
        return true;
      }
      if (! top || (bonus && bonus <= top)) {
        parent.classList.remove('error', 'incomplete');
        data.result.setBoulderScore(data.heat.number, tabIndex, bonus, top);
        return true;
      }
    }
    parent.classList.add('error');
    return isNumber;
  };

  const setFocusField = (input)=>{
    focusField = {
      id: Dom.getClosest(input, 'tr').id,
      tabIndex: +input.getAttribute('tabIndex'),
      name: input.className.replace(/ .*$/, ''),
    };
  };;

  const nextField = (elm, direction)=>{
    let tabIndex = +elm.getAttribute('tabIndex');
    let name, row = elm.parentNode.parentNode;

    if (Dom.hasClass(row, 'BoulderScore')) {
      row = row.parentNode;

      name = Dom.hasClass(elm, 'top') ? 'bonus' : 'top';
      if (direction > 0 && name === 'top')
        row = row.nextElementSibling;
      else if (direction < 0 && name === 'bonus')
        row = row.previousElementSibling;

      if (row === null) {
        elm = document.querySelector('.results tr:'+
                                     (direction > 0 ? 'first' : 'last')+'-child>td.score input'+
                                     '[tabIndex="'+(tabIndex+direction)+'"]');
        if (elm === null) return null;

        tabIndex = +elm.getAttribute('tabIndex');

        row = elm.parentNode.parentNode.parentNode;
      }

    } else {
      name = 'score';
      row = direction > 0 ? row.nextElementSibling : row.previousElementSibling;

      if (row === null) {
        elm =
          document.querySelector('.results tr:'+
                                 (direction > 0 ? 'first' : 'last')+'-child>td.score>input'+
                                 ':not([tabIndex="'+tabIndex+'"])');

        if (elm === null) return null;

        tabIndex = +elm.getAttribute('tabIndex');

        row = elm.parentNode.parentNode;
      }
    }

    if (row) return {id: row.id, tabIndex, name};
  };

  const saveAndMove = (elm, which) => {
    Dom.stopEvent();
    const oldFocus = focusField;
    switch(which) {
    case 38: // up arrow / shift tab
      focusField = nextField(document.activeElement, -1);
      break;
    case 40: // down arrow / tab
      focusField = nextField(document.activeElement, 1);
      break;
    }
    saveScore(elm);
    (getFocusElm()||elm).focus();
  };

  eventTpl.route.addTemplate(module, Tpl, {
    focus: '.Category [name=selectHeat]',
    data: (page,pageRoute)=>{
      if (! eventTpl.event) Route.abortPage();
      const params = Route.searchParams(pageRoute);
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
      const frag = document.createDocumentFragment();
      this.heat.headers((number, name) => {
        frag.appendChild(HeatHeader.$render({heat: number, name: name}));
      });
      return frag;
    },

    results() {
      const frag = document.createDocumentFragment();

      const results = Result.query.withIndex(Result.eventCatIndex, {
        event_id: eventTpl.event._id, category_id: $.data().category._id,
      }).fetch();

      const {heat} = this;

      if (this.showingResults)
        heat.sort(results);
      else
        heat.sortByStartOrder(results);

      let prev, row, rank = 0;
      const compareResults = heat.compareResults();

      for(let i = 0; i < results.length; ++i, prev = row) {
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
      const {data} = ctx;
      let {showingResults} = data;
      util.merge(data, {
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

      ctx.autoUpdate({subject: data.category});
      ctx.onDestroy(Result.onChange(({doc}) =>{
        if (doc.event_id !== eventTpl.event._id ||
            doc.category_id !== ctx.data.category._id)
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
      const data = $.data();
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
        (getFocusElm()||this).focus();
        return;
      }
    },

    'focus td.score input'(event) {
      setFocusField(this);
    },

    'keydown td.score input'(event) {
      const elm = event.target;
      const {which} = event;
      // arrow keys
      if (which >= 37 && which <= 40) {
        saveAndMove(elm, which);
        return;
        }
      switch(which) {
      case 27: // escape
        focusField = null;
        if (Dom.hasClass(this, 'score')) {
          elm.value = elm[orig$];
          Dom.remove(this.parentNode.querySelector('.errorMsg'));
        } else {
          Dom.ctx(this).updateAllTags();
        }
        document.activeElement.blur();
        break;

      case 13: // return
        Dom.stopEvent();
        if (saveScore(elm)) {
          focusField = null;
          document.activeElement.blur();
        }
        break;
      case 9: { // tab
        saveAndMove(elm, event.shiftKey ? 38 : 40);
        break;
      }
      }
    },

    'pointerdown td.score'(event) {
      const elm = event.target;
      if (elm === document.activeElement ||
          ! Dom.hasClass(document.body, 'jAccess'))
        return;

      Dom.stopEvent();

      let input = elm.tagName === 'INPUT'
          ? elm : elm.querySelector('input') || this.querySelector('input');
      if (input != null) {
        input.focus();
        input.select();
        return;
      }

      const ctx = $.ctx;
      const data = ctx.data;

      const scoreData = $.data(this);
      let heat = scoreData.heat;
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
      ctx.autoUpdate({subject: ctx.data.climber});
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
      const frag = document.createDocumentFragment();
      const parentCtx = Dom.ctx($.element.parentNode);
      const result = parentCtx.data;
      const scores = result.scores;
      const heat = $.ctx.parentCtx.data.heat;

      const {number} = heat;
      const boulder = heat.type === 'B';
      let canInput = parentCtx.parentCtx.data.canInput;

      const renderScore = (i, canInput, qr)=>{
        frag.appendChild(Score.$render(
          qr ? {
            result: result, heat: -2,
            score: scores[i] == null && heat.total !== heat.rankIndex ? ''
              : heat.numberToScore(Math.pow(result.rankMult, 1/i), -2, result.event.ruleVersion)
          } : {
            result: result, canInput: canInput, heat: i,
            score: heat.numberToScore(scores[i], i, result.event.ruleVersion),
            rank: scores[i] == null ? '' : result['rank'+i]}
        ));
      };

      if (boulder && number >= 0) {
        frag.appendChild(BoulderScore.$render({result, heat, canInput}));
      }

      canInput = canInput && ! boulder;

      if (heat.number <= heat.rankIndex) {

        if (heat.number >= 0) {
          renderScore(heat.number, canInput);

        } else {
          frag.appendChild(Score.$render({result: result, heat: -2, score: result.rank}));
          for(let i = heat.total; i > 0; --i) {
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
    },
  });

  Score.$helpers({
    rank() {
      if (! this.rank) return;
      const elm =  document.createElement('i');
      elm.textContent = this.rank;
      return elm;
    },

    score() {
      let elm;
      if (this.canInput) {
        elm = document.createElement('input');
        elm.setAttribute('placeholder', this.heat === 99 ? "m:ss" : "n+");
        elm.tabIndex = this.heat;
        elm.className = 'score';
        if (this.score != null)
          elm[orig$] = elm.value = this.score.toString();
      } else {
        const {score} = this;
        const parts = typeof score === 'number' ? null : this.score.split(/([TZA]+)(?!o)/);
        if (parts === null || parts.length < 4) {
          elm = document.createElement('span');
          elm.textContent = this.score;
        } else {

          elm =  Dom.h({class: 'tza-score', span: parts.map(p => /^[TZA]+$/.test(p) ? {b: p} : {span: p})});
        }
      }

      return elm;
    },

    heatClass() {
      Dom.addClass($.element, 'heat' + this.heat);
    },
  });

  BoulderScore.$helpers({
    problems() {
      const len = this.heat.problems;
      const problems = this.result.problems ? this.result.problems[this.heat.number - 1] || [] : [];
      const canInput = this.canInput;

      const frag = document.createDocumentFragment();
      for(let i = 0; i < len; ++i) {
        const prob = problems[i];
        const elm = document.createElement('div');
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

  module.onUnload(() => {eventTpl.route.removeTemplate(Tpl)});

  return Tpl;
});
