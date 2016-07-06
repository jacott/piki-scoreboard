define(function(require, exports, module) {
  const koru       = require('koru');
  const Dom        = require('koru/dom');
  const Form       = require('koru/ui/form');
  const Route      = require('koru/ui/route');
  const SelectMenu = require('koru/ui/select-menu');
  const util       = require('koru/util');
  const Climber    = require('models/climber');
  const TeamType   = require('models/team-type');
  const TeamHelper = require('ui/team-helper');
  const App        = require('./app-base');

  var Tpl   = Dom.newTemplate(require('koru/html!./climber'));
  var $ = Dom.current;
  var Index = Tpl.Index;
  var sortField = 'name';
  var asc = 1;
  var sortFunc;

  setSortFunc();

  var elm;

  var base = Route.root.addBase(module, Tpl, 'climberId');
  koru.onunload(module, function () {
    Route.root.removeBase(Tpl);
  });

  Tpl.$extend({
    onBaseEntry: function () {
      document.body.appendChild(Tpl.$autoRender({}));
    },

    onBaseExit: function () {
      Dom.removeId('Climber');
    },
  });

  Index.$helpers({
    climbers: function (callback) {
      callback.render({
        model: Climber,
        sort: function (a, b) {
          return sortFunc(a, b) * asc;
        },
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

  Index.Row.$helpers({
    team: TeamHelper.teamTD,
  });

  Index.$events({
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

    'click [name=selectTeamType]': TeamHelper.chooseTeamTypeEvent,

    'click .climbers tr': function (event) {

      if (! Dom.hasClass(document.body, 'aAccess')) return;
      _koru_.debug('XX');
      Dom.stopEvent();

      var data = $.data(this);
      Route.gotoPage(Tpl.Edit, {climberId: data._id});
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

  base.addTemplate(module, Index, {defaultPage: true, path: ''});
  base.addTemplate(module, Tpl.Add, {
    focus: true,
    data: function () {
      return new Climber({org_id: App.orgId});
    }
  });

  base.addTemplate(module, Tpl.Edit, {
    focus: true,
    data: function (page, pageRoute) {
      var doc = Climber.findById(pageRoute.climberId);

      if (!doc) Route.abortPage();

      return doc;
    }
  });

  function cancel(event) {
    Dom.stopEvent();
    Route.history.back();
  }

  function setSortFunc() {
    switch (sortField) {
    case 'team':
      return sortFunc = TeamHelper.sortBy;
    default:
      return sortFunc = util.compareByField(sortField);
    }
  }

  return Tpl;
});
