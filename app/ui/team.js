define(function(require, exports, module) {
  const koru       = require('koru');
  const Dom        = require('koru/dom');
  const Dialog     = require('koru/ui/dialog');
  const Form       = require('koru/ui/form');
  const Route      = require('koru/ui/route');
  const SelectMenu = require('koru/ui/select-menu');
  const util       = require('koru/util');
  const Team       = require('models/team');
  const TeamType   = require('models/team-type');
  const User       = require('models/user');
  const CrudPage   = require('ui/crud-page');
  const TeamHelper = require('ui/team-helper');
  const App        = require('./app-base');

  const Tpl = CrudPage.newTemplate(module, Team, require('koru/html!./team'));
  const $ = Dom.current;
  const Index = Tpl.Index;

  Tpl.title = "Teams";

  Index.$helpers({
    rows: function (each) {
      const {sortFunc, asc} = $.template.sorting;
      return {
        query: $.template.parent.model.where({teamType_id: TeamHelper.teamType_id}),
        compare: (a, b)=> sortFunc(a, b) * asc,
        compareKeys: sortFunc.compareKeys
      };
    },

    teamTypePrompt() {
      let tt = TeamType.findById(TeamHelper.teamType_id);
      return tt ? tt.name : 'Please select';
    },

    hasTeamTypeClass() {
      Dom.setClass('noTeamType', ! TeamType.findById(TeamHelper.teamType_id));
    },

    addTeamText() {
      let teamType = TeamType.findById(TeamHelper.teamType_id);
      return teamType && 'Add new ' + teamType.name;
    },
  });

  Index.$events({
    'click [name=EditTeamType]'(event) {
      Dom.stopEvent();
      let teamType = TeamType.findById(TeamHelper.teamType_id);

      teamType && Dialog.open(Tpl.EditTeamType.$autoRender(teamType));
    },

    'click [name=addTeamType]'(event) {
      Dom.stopEvent();
      openAddTeamType();
    },

    'click [name=addTeam]'(event) {
      Dom.stopEvent();
      openAddTeam();
    },

    'menustart [name=teamType_id]'(event) {
      Dom.stopEvent();
      let ctx = $.ctx;
      let list = TeamType.query.map(doc => [doc._id, doc.name]);
      if (User.me().isAdmin())
        list.push({_id: '$new', name: "Add new team type"});
      SelectMenu.popup(this, {
        list,
        onSelect(elm) {
          let id = $.data(elm)._id;
          if (id === '$new') {
            openAddTeamType();
          } else {
            TeamHelper.teamType_id = id;
            ctx.updateAllTags();
          }
          return true;
        }
      });
    },
  });

  function openAddTeamType() {
    Dialog.open(Tpl.AddTeamType.$autoRender(new TeamType({org_id: App.orgId})));
  }

  function openAddTeam() {
    Dialog.open(Tpl.Add.$autoRender(new Team({org_id: App.orgId, teamType_id: TeamHelper.teamType_id})));
  }

  Tpl.Add.$events({
    'click [name=cancel]'(event) {
      Dialog.close(event.currentTarget);
    },
    'click [type=submit]': Form.submitFunc('AddTeam', () => Dialog.close()),
  });

  Tpl.AddTeamType.$events({
    'click [name=cancel]'(event) {
      Dialog.close(event.currentTarget);
    },

    'click [type=submit]': teamTypeSubmitFunc,
  });

  Tpl.EditTeamType.$events({
    'click [name=cancel]'(event) {
      Dialog.close(event.currentTarget);
    },

    'click [type=submit]': teamTypeSubmitFunc,
  });

  Tpl.TeamTypeForm.$helpers({
    checked() {
      Dom.setClass('checked', this.default, $.element.parentNode);
    },
  });

  Tpl.TeamTypeForm.$events({
    'click [name=default]'(event) {
      Dom.stopEvent();

      Dom.toggleClass(this.parentNode, 'checked');
    },
  });

  Tpl.Edit.$events({
    'click [name=cancel]': cancel,
    'click [name=delete]'(event) {
      var doc = $.data();

      Dom.stopEvent();
      Dom.tpl.Dialog.confirm({
        data: doc,
        classes: 'warn',
        okay: 'Delete',
        content: Tpl.ConfirmDelete,
        callback: function(confirmed) {
          if (confirmed) {
            doc.$remove();
            Route.gotoPage(Tpl);
          }
        },
      });

    },
    'click [type=submit]': Form.submitFunc('Edit', Tpl),
  });

  Tpl.Edit.$extend({
    $destroyed(ctx, elm) {
      ctx.data.$clearChanges();
    }
  });

  function cancel(event) {
    Dom.stopEvent();
    Route.gotoPage(Tpl);
  }

  function teamTypeSubmitFunc(event) {
    Dom.stopEvent();
    var doc = $.data();

    Form.fillDoc(doc, event.currentTarget);
    doc.default = !! event.currentTarget.querySelector('label.checked');

    if (doc.$save()) {
      Dialog.close(event.currentTarget);
    } else {
      Form.renderErrors(doc, event.currentTarget);
    }
  }

  return Tpl;
});
