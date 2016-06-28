define(function(require, exports, module) {
  const koru       = require('koru');
  const Dom        = require('koru/dom');
  const Form       = require('koru/ui/form');
  const Route      = require('koru/ui/route');
  const SelectMenu = require('koru/ui/select-menu');
  const util       = require('koru/util');
  const Team       = require('models/team');
  const TeamType   = require('models/team-type');
  const App        = require('./app-base');

  var Tpl   = Dom.newTemplate(require('koru/html!./team'));
  var $ = Dom.current;
  var Index = Tpl.Index;

  var elm;

  var base = Route.root.addBase(Tpl, 'teamId');
  koru.onunload(module, function () {
    Route.root.removeBase(Tpl);
  });

  Tpl.$extend({
    onBaseEntry: function () {
      document.body.appendChild(Tpl.$autoRender({}));
    },

    onBaseExit: function () {
      Dom.removeId('Team');
    },
  });

  Index.$helpers({
    teams: function (callback) {
      callback.render({
        model: Team,
        sort: util.compareByName,
        params: {teamType_id: $.ctx.data.teamType_id},
      });
    },
  });

  Index.$events({
    'click .teams tr': function (event) {
      if (! Dom.hasClass(document.body, 'aAccess')) return;
      Dom.stopEvent();

      var data = $.data(this);
      Route.gotoPage(Tpl.Edit, {teamId: data._id});
    },
    'click [name=teamType_id]': function (event) {
      Dom.stopEvent();
      let ctx = $.ctx;
      let list = TeamType.query.map(doc => [doc._id, doc.name]);
      SelectMenu.popup(this, {
        list,
        onSelect(elm) {
          ctx.data.teamType_id = $.data(elm).id;
          ctx.updateAllTags();
          return true;
        }
      });
    },
  });

  base.addTemplate(Index, {defaultPage: true, path: ''});
  base.addTemplate(Tpl.Add, {
    focus: true,
    data: function () {
      let teamType_id = Tpl.$data(document.getElementById('Team')).teamType_id;
      a.debug
      _koru_.debug('teamType_id', teamType_id);

      return new Team({org_id: App.orgId, teamType_id});
    }
  });

  base.addTemplate(Tpl.Edit, {
    focus: true,
    data: function (page, pageRoute) {
      var doc = Team.findById(pageRoute.teamId);

      if (!doc) Route.abortPage();

      return doc;
    }
  });

  Tpl.Add.$events({
    'click [name=cancel]': cancel,
    'click [type=submit]': Form.submitFunc('AddTeam', Tpl),
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
    'click [type=submit]': Form.submitFunc('EditTeam', Tpl),
  });

  Tpl.Edit.$extend({
    $destroyed: function (ctx, elm) {
      ctx.data.$clearChanges();
    }
  });

  function cancel(event) {
    Dom.stopEvent();
    Route.gotoPage(Tpl);
  }

  return Tpl;
});
