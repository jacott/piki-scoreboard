define(function(require, exports, module) {
  const koru       = require('koru');
  const Dom        = require('koru/dom');
  const Form       = require('koru/ui/form');
  const Route      = require('koru/ui/route');
  const SelectMenu = require('koru/ui/select-menu');
  const util       = require('koru/util');
  const Climber    = require('models/climber');
  const TeamType   = require('models/team-type');
  const CrudPage   = require('ui/crud-page');
  const TeamHelper = require('ui/team-helper');
  const App        = require('./app-base');

  const Tpl = CrudPage.newTemplate(module, Climber, require('koru/html!./climber'));
  const $ = Dom.current;
  const Index = Tpl.Index;

  Index.$extend({
    setSortFunc() {
      const {sorting} = this;
      switch (sorting.sortField) {
      case 'team':
        return sorting.sortFunc = TeamHelper.sortBy;
      default:
        return this.__proto__.setSortFunc.call(this);
      }
    },
  });

  Index.Row.$helpers({
    team: TeamHelper.teamTD,
  });

  Index.$events({
    'click [name=selectTeamType]': TeamHelper.chooseTeamTypeEvent,

    'click .climbers tr': function (event) {
      if (! Dom.hasClass(document.body, 'aAccess')) return;

      Dom.stopEvent();

      var data = $.data(this);
      Route.gotoPage(Tpl.Edit, {modelId: data._id});
    },
  });

  Tpl.Add.$events({
    'click [name=cancel]': cancel,
    'click [type=submit]': Form.submitFunc('AddClimber', "back"),
  });

  Tpl.Edit.$events({
    'click [name=cancel]': cancel,
    'click [name=delete]': function (event) {
      var doc = $.data();

      Dom.stopEvent();
      Dom.Dialog.confirm({
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
    'click [type=submit]': Form.submitFunc('EditClimber', "back"),
  });

  Tpl.Edit.$extend({
    $destroyed: function (ctx, elm) {
      ctx.data.$clearChanges();
    }
  });

  function cancel(event) {
    Dom.stopEvent();
    Route.history.back();
  }

  return Tpl;
});
