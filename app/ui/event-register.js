define(function(require, exports, module) {
  const koru         = require('koru');
  const Dom          = require('koru/dom');
  const CompleteList = require('koru/ui/complete-list');
  const Dialog       = require('koru/ui/dialog');
  const Form         = require('koru/ui/form');
  const Route        = require('koru/ui/route');
  const SelectMenu   = require('koru/ui/select-menu');
  const util         = require('koru/util');
  const Category     = require('models/category');
  const Climber      = require('models/climber');
  const Competitor   = require('models/competitor');
  const Team         = require('models/team');
  const TeamType     = require('models/team-type');
  const TeamTpl      = require('ui/team');
  const TeamHelper   = require('ui/team-helper');
  const App          = require('./app-base');
  require('./climber');
  const eventTpl     = require('./event');

  var Tpl   = Dom.newTemplate(require('koru/html!./event-register'));
  var $ = Dom.current;
  var Index = Tpl.Index;

  var Add = Tpl.Add;
  var Edit = Tpl.Edit;
  var catTpl = Tpl.Category;
  var Groups = Tpl.Groups;
  var Teams = Tpl.Teams;
  var AddClimber = Tpl.AddClimber;
  var competitor;
  var sortField = 'name';
  var asc = 1;
  var sortClimber = true;
  var sortFunc;

  setSortFunc();

  koru.onunload(module, function () {
    eventTpl.route.removeBase(Tpl);
  });

  var base = eventTpl.route.addBase(module, Tpl);
  base.addTemplate(module, Add, {
    focus: true,
    defaultPage: true,
  });
  base.addTemplate(module, Edit, {
    focus: true,
    data: function (page, pageRoute) {
      return Competitor.findById(pageRoute.append) || Route.abortPage();
    }
  });

  Tpl.$helpers({
    closedClass: function () {
      Dom.setClass('closed', eventTpl.event.closed);
    },
    competitors: function (callback) {
      callback.render({
        model: Competitor,
        sort: function (a, b) {
          return (sortClimber ? sortFunc(a.climber, b.climber) : sortFunc(a, b)) * asc;
        }
      });
    },

    sortOrder: function () {
      var parent = $.element.parentNode;
      var ths = parent.getElementsByTagName('th');
      for(var i = 0; i < ths.length; ++i) {
        Dom.removeClass(ths[i], 'sort');
        Dom.removeClass(ths[i], 'desc');
      }

      var elm = parent.querySelector('[data-sort="'+sortField+'"]');
      Dom.addClass(elm, 'sort');
      asc === -1 &&  Dom.addClass(elm, 'desc');
    },
  });

  Tpl.$events({
    'click tbody>tr': function (event) {
      Dom.stopEvent();
      Route.replacePath(Edit, {append: $.data(this)._id});
    },

    'click [name=cancel]': function (event) {
      Dom.stopEvent();
      Route.replacePath(Tpl);
    },

    'click [name=selectTeamType]': TeamHelper.chooseTeamTypeEvent,

    'click th': function (event) {
      Dom.stopEvent();
      var sort = this.getAttribute('data-sort');
      if (sortField === sort)
        asc = asc * -1;
      else {
        sortField = sort;
        asc = 1;
      }
      setSortFunc();
      $.ctx.updateAllTags();
    },
  });

  function setSortFunc() {
    sortClimber = true;
    switch (sortField) {
    case 'cat':
      sortClimber = false;
      return sortFunc = util.compareByField('category_ids');
    case 'createdAt':
      sortClimber = false;
      return sortFunc = util.compareByField('createdAt');
    case 'team':
      return sortFunc = TeamHelper.sortBy;
    default:
      return sortFunc = util.compareByField(sortField);
    }
  }


  Tpl.$extend({
    onBaseEntry: function (page, pageRoute) {
      if (! eventTpl.event) Route.abortPage();
      document.querySelector('#Event>div>.body').appendChild(Tpl.$autoRender(eventTpl.event));
    },

    onBaseExit: function (page, pageRoute) {
      Dom.removeId('Register');
    },

    $destroyed: function (ctx, elm) {
      competitor = null;
    },
  });

  Edit.$extend({
    $created: function (ctx, elm) {
      addGroups(elm, ctx.data);
      addTeams(elm, ctx.data);
    },
  });

  Edit.$events({
    'submit': submit,

    'click [name=delete]': function (event) {
      Dom.stopEvent();
      var doc = $.data();

      Dom.Dialog.confirm({
        data: doc,
        classes: 'warn',
        okay: 'Deregister',
        content: Tpl.ConfirmDelete,
        callback: function(confirmed) {
          if (confirmed) {
            doc.$remove();
            Route.replacePath(Tpl);
          }
        },
      });


    },
  });

  Add.$extend({
    $created: function (ctx) {
      if (eventTpl.event) {
        ctx.data = new Competitor({event_id: eventTpl.event._id});
      }
    },
  });

  Add.$events({
    'click [name=cancel]': function (event) {
      Dom.stopEvent();
      Route.replacePath(Tpl);
    },
    'submit': submit,

    'input [name=name]': function (event) {
      var input = this;
      var value = input.value;
      if (value) value = value.trim();
      if (value)  {
        var form = event.currentTarget;
        var competitor = $.data();
        competitor.$clearCache();

        var competitors = Competitor.eventIndex({event_id: competitor.event_id}) || {};

        var found = false;
        var completeList = Climber.search(value, 20, function (doc) {
          found = true;
          return ! (doc._id in competitors);
        });
        if (completeList.length === 0) {
          if (found) {
            completeList = [{name: "Already registered"}];
          } else {
            completeList = [{name: 'Add "' + value + '"', addNew: true}];
          }
        }
      }
      Form.completeList({
        input: this,
        completeList: completeList,
        callback: function (ret) {
          if (ret._id) {
            input.value = ret.name;
            addClimber(competitor, ret);
            addGroups(form, competitor);
            addTeams(form, competitor);
          } else if (ret.addNew) {
            addNew(form, value);
          }
        },
      });
    },
  });

  Tpl.Row.$helpers({
    categories: function () {
      var frag = document.createDocumentFragment();
      this.category_ids.forEach(function (id) {
        var abbr = document.createElement('abbr');
        var cat = Category.findById(id);
        if (! cat) return;
        abbr.setAttribute("title", cat.name);
        abbr.textContent = cat.shortName;
        frag.appendChild(abbr);
      });
      return frag;
    },

    team: TeamHelper.teamTD,
  });

  Tpl.Row.$extend({
    $created: function (ctx) {
      Dom.autoUpdate(ctx, {subject: ctx.data.climber});
    },
  });

  AddClimber.$events({
    'submit': Form.submitFunc('AddClimber', function (doc) {
      Dom.Dialog.close();
      var form = document.querySelector('#Register form.add');
      var competitor = $.data(form);
      competitor.$clearCache();
      addClimber(competitor, doc);
      addGroups(form, competitor);
      addTeams(form, competitor);
    }),

    'click [name=cancel]': function (event) {
      Dom.stopEvent();
      Dom.Dialog.close();
      document.querySelector('#Register [name=name].autoComplete').focus();
    },
  });

  Groups.$events({
    'click [name=editClimber]': function (event) {
      Dom.stopEvent();

      Route.gotoPage(Dom.Climber.Edit, {climberId: $.ctx.data.climber._id});
    },
  });

  Teams.$helpers({
    teamTypes(callback) {
      callback.render({
        model: TeamType,
      });
    },
  });

  Teams.TeamType.$helpers({
    teamName() {
      let competitor = Teams.$data();
      let team = competitor.team(this._id);

      Dom.setClass('none', ! team, $.element.parentNode);
      if (team)
        return team.name;
      return 'Select';
    },
  });

  Teams.TeamType.$events({
    'click .select': function (event) {
      Dom.stopEvent();

      let ctx = $.ctx;
      let competitor = Teams.$data();
      let list = Team.where('teamType_id', $.ctx.data._id).map(team => [team._id, team.name]);
      list = [{id: null, name: Dom.h({i:'none'})}, ...list, {id: '$new', name: Dom.h({i: 'add new team'})}];
      SelectMenu.popup(this, {
        list,
        onSelect(elm) {
          let id = $.data(elm).id;
          if (id === '$new') {
            let elm = Tpl.AddTeam.$autoRender(new Team({org_id: App.orgId, teamType_id: ctx.data._id}));
            Dialog.open(elm);
            Dom.getCtx(elm).teamData = {competitor, ctx};
          } else {
            competitor.setTeam(ctx.data._id, id);
            ctx.updateAllTags();
          }
          return true;
        }
      });
    },
  });

  Tpl.AddTeam.$events({
    'click [type=submit]': Form.submitFunc('AddTeam', {
      success(team) {
        let {competitor, ctx} = Dom.getCtxById('AddTeam').teamData;
        competitor.setTeam(ctx.data._id, team._id);
        ctx.updateAllTags();
        Dialog.close();
      },
    }),
  });

  catTpl.$helpers({
    selectedCategory() {
      Dom.setClass('none', ! this.category_id, $.element.parentNode);

      return this.category_id ? Category.findById(this.category_id).name : '---';
    },
  });

  catTpl.$events({
    'click .select'(event) {
      Dom.stopEvent();
      const ctx = $.ctx;
      const data = ctx.data;
      SelectMenu.popup(this, {
        list: data.groupList,
        onSelect(elm) {
          data.category_id = $.data(elm)._id;
          ctx.updateAllTags();
          return true;
        }
      });

    },
  });

  function submit(event) {
    Dom.stopEvent();

    const competitor = $.data();
    const ids = [];
    const form = event.currentTarget;

    competitor.number = form.querySelector('[name=number]') || undefined;

    var groups = form.getElementsByClassName('Category');
    for(var i = 0; i < groups.length; ++i) {
      var row = $.data(groups[i]);
      if (row.category_id) ids.push(row.category_id);
    }

    competitor.category_ids = ids;

    if (Form.saveDoc(competitor, form)) {
      Route.replacePath(Add);
    }
  }

  function addNew(form, name) {
    Dom.Dialog.open(AddClimber.$autoRender(Climber.build({org_id: App.orgId, name: name})), {focus: '[name=dateOfBirth]'});
  }

  function addGroups(form, competitor) {
    var climber = competitor.climber;
    var groupsElm = form.querySelector('.Groups');

    Dom.remove(groupsElm);
    groupsElm = Groups.$autoRender(competitor);
    let list = groupsElm.querySelector('.categoryList');
    Category.groupApplicable(climber, function (group, docs) {
      list.appendChild(catTpl.$autoRender({
        groupName: group,
        groupList: [{_id: null, name: '---'}, ...docs],
        category_id: competitor.categoryIdForGroup(group),
      }));
    });
    form.insertBefore(groupsElm, form.querySelector('.actions'));
  }

  function addTeams(form, competitor) {
    var climber = competitor.climber;
    var teamsElm = form.querySelector('.Teams');

    Dom.remove(teamsElm);
    teamsElm = Teams.$autoRender(competitor);
    form.insertBefore(teamsElm, form.querySelector('.actions'));
  }

  function addClimber(competitor, climber) {
    competitor.climber_id = climber._id;
    competitor.team_ids = climber.team_ids;
  }

  return Tpl;
});
