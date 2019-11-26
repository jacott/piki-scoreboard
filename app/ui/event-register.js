define((require, exports, module)=>{
  const koru            = require('koru');
  const Dom             = require('koru/dom');
  const CompleteList    = require('koru/ui/complete-list');
  const Dialog          = require('koru/ui/dialog');
  const Form            = require('koru/ui/form');
  const Route           = require('koru/ui/route');
  const SelectMenu      = require('koru/ui/select-menu');
  const util            = require('koru/util');
  const Category        = require('models/category');
  const Climber         = require('models/climber');
  const Competitor      = require('models/competitor');
  const Team            = require('models/team');
  const TeamType        = require('models/team-type');
  const User            = require('models/user');
  const TeamTpl         = require('ui/team');
  const TeamHelper      = require('ui/team-helper');
  const App             = require('./app-base');
  require('./climber');
  const eventTpl        = require('./event');

  const Tpl   = Dom.newTemplate(require('koru/html!./event-register'));
  const $ = Dom.current;
  const {
    Index, Add, Edit, Category: catTpl,
    Groups, Teams, AddClimber} = Tpl;
  let competitor;
  let sortField = 'name';
  let asc = 1;
  let sortFunc;

  setSortFunc();

  const base = eventTpl.route.addBase(module, Tpl);

  base.addTemplate(module, Add, {
    focus: true,
    defaultPage: true,
  });
  base.addTemplate(module, Edit, {
    focus: true,
    data(page, pageRoute) {
      return Competitor.findById(pageRoute.append) || Route.abortPage();
    }
  });

  Tpl.$helpers({
    closedClass() {
      Dom.setClass('closed', eventTpl.event.closed);
    },

    competitors(each) {
      return {
        query: Competitor.query,
        compare: asc == 1 ? sortFunc : (a,b)=>sortFunc(b,a),
        compareKeys: sortFunc.compareKeys,
      };
    },

    sortOrder() {
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

    teamTypeList: ()=> ctx => TeamType.where({_id: ctx.data.teamType_ids}),
  });

  Tpl.$events({
    'click tbody>tr'(event) {
      Dom.stopEvent();
      Route.replacePath(Edit, {append: $.data(this)._id});
    },

    'click [name=cancel]'(event) {
      Dom.stopEvent();
      Route.replacePath(Tpl);
    },

    'click th'(event) {
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
    switch (sortField) {
    case 'cat':
      return sortFunc = util.compareByField('category_ids');
    case 'createdAt':
      return sortFunc = util.compareByField('createdAt');
    case 'team':
      return sortFunc = TeamHelper.sortBy;
    default:
      return sortFunc = util.compareByField(sortField);
    }
  }


  Tpl.$extend({
    onBaseEntry(page, pageRoute) {
      if (! eventTpl.event) Route.abortPage();
      const elm = Tpl.$autoRender(eventTpl.event);
      base.childAnchor = elm.firstChild;
      base.parent.childAnchor.appendChild(elm);
    },

    onBaseExit(page, pageRoute) {
      Dom.removeId('Register');
    },

    $destroyed(ctx, elm) {
      competitor = null;
    },
  });

  Edit.$extend({
    $created(ctx, elm) {
      addGroups(elm, ctx.data);
      addTeams(elm, ctx.data);
    },
  });

  Edit.$events({
    'submit': submit,

    'click [name=delete]'(event) {
      Dom.stopEvent();
      var doc = $.data();

      Dom.tpl.Dialog.confirm({
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
    $created(ctx) {
      if (eventTpl.event) {
        ctx.data = new Competitor({event_id: eventTpl.event._id});
      }
    },
  });

  Add.$events({
    'click [name=cancel]'(event) {
      Dom.stopEvent();
      Route.replacePath(Tpl);
    },
    'submit': submit,

    'input [name=name]'(event) {
      var input = this;
      var value = input.value;
      if (value) value = value.trim();
      if (value)  {
        var form = event.currentTarget;
        var competitor = $.data();
        competitor.$clearCache();

        var competitors = Competitor.eventIndex.lookup({event_id: competitor.event_id}) || {};

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
        callback(ret) {
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
    categories() {
      var frag = document.createDocumentFragment();
      this.category_ids.forEach(id =>{
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
    $created(ctx) {
      ctx.autoUpdate({subject: ctx.data.climber});
    },
  });

  AddClimber.$events({
    'submit': Form.submitFunc('AddClimber', function (doc) {
      Dom.tpl.Dialog.close();
      var form = document.querySelector('#Register form.add');
      var competitor = $.data(form);
      competitor.$clearCache();
      addClimber(competitor, doc);
      addGroups(form, competitor);
      addTeams(form, competitor);
    }),

    'click [name=cancel]'(event) {
      Dom.stopEvent();
      Dom.tpl.Dialog.close();
      document.querySelector('#Register [name=name].autoComplete').focus();
    },
  });

  Groups.$events({
    'click [name=editClimber]'(event) {
      Dom.stopEvent();

      Route.gotoPage(Dom.tpl.Climber.Edit, {modelId: $.ctx.data.climber._id});
    },
  });

  Teams.$helpers({
    teamTypes(each) {
      return {
        query: TeamType.where({_id: this.event.teamType_ids}),
        compare: util.compareByName,
      };
    },
  });

  Teams.TeamType.$helpers({
    teamName() {
      let competitor = Teams.$data();
      let team = competitor.getTeam(this._id);

      Dom.setClass('none', ! team, $.element.parentNode);
      if (team)
        return team.name;
      return 'Select';
    },
  });

  Teams.TeamType.$events({
    'menustart .select'(event) {
      Dom.stopEvent();

      let ctx = $.ctx;
      let competitor = Teams.$data();
      let list = Team.where('teamType_id', $.ctx.data._id).sort('name');

      list = [{_id: null, name: Dom.h({i:'none'})}, ...list,
              {_id: '$new', name: Dom.h({i: 'add new team'})}];
      SelectMenu.popup(this, {
        list,
        onSelect(elm) {
          let id = $.data(elm)._id;
          if (id === '$new') {
            let elm = Tpl.AddTeam.$autoRender(
              new Team({org_id: App.orgId, teamType_id: ctx.data._id}));
            Dialog.open(elm);
            Dom.ctx(elm).teamData = {competitor, ctx};
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
    'click [name=cancel]'(event) {
      Dom.stopEvent();
      Dialog.close();
    },
    'click [type=submit]': Form.submitFunc('AddTeam', {
      success(team) {
        let {competitor, ctx} = Dom.ctxById('AddTeam').teamData;
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
    'menustart .select'(event) {
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
    Dom.tpl.Dialog.open(AddClimber.$autoRender(Climber.build({org_id: App.orgId, name: name})), {focus: '[name=dateOfBirth]'});
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
    competitor.number = climber.number;
  }

  App.restrictAccess(Tpl);

  module.onUnload(()=>{eventTpl.route.removeBase(Tpl)});

  return Tpl;
});
