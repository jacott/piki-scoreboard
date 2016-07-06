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
  const App        = require('./app-base');

  var Tpl   = Dom.newTemplate(require('koru/html!./team'));
  var $ = Dom.current;
  var Index = Tpl.Index;
  var sortField = 'name';
  var asc = 1;
  var sortFunc;

  setSortFunc();

  var elm;

  var base = Route.root.addBase(module, Tpl, 'teamId');
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
        sort: function (a, b) {
          return sortFunc(a, b) * asc;
        },
        params: {teamType_id: Tpl.teamType_id},
      });
    },

    teamTypePrompt() {
      let tt = TeamType.findById(Tpl.teamType_id);
      return tt ? tt.name : 'Please select';
    },

    hasTeamTypeClass() {
      Dom.setClass('noTeamType', ! TeamType.findById(Tpl.teamType_id));
    },

    addTeamText() {
      let teamType = TeamType.findById(Tpl.teamType_id);
      return teamType && 'Add new ' + teamType.name;
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
  });

  Index.$events({
    'click .teams tr': function (event) {
      if (! Dom.hasClass(document.body, 'aAccess')) return;
      Dom.stopEvent();

      var data = $.data(this);
      Route.gotoPage(Tpl.Edit, {teamId: data._id});
    },

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

    'click [name=teamType_id]': function (event) {
      Dom.stopEvent();
      let ctx = $.ctx;
      let list = TeamType.query.map(doc => [doc._id, doc.name]);
      list.push({id: '$new', name: "Add new team type"});
      SelectMenu.popup(this, {
        list,
        onSelect(elm) {
          let id = $.data(elm).id;
          if (id === '$new') {
            Dialog.open(Tpl.AddTeamType.$autoRender(new TeamType({org_id: App.orgId})));
          } else {
            Tpl.teamType_id = id;
            ctx.updateAllTags();
          }
          return true;
        }
      });
    },
  });

  base.addTemplate(module, Index, {defaultPage: true, path: ''});
  base.addTemplate(module, Tpl.Add, {
    focus: true,
    data: function () {
      return new Team({org_id: App.orgId, teamType_id: Tpl.teamType_id});
    }
  });

  base.addTemplate(module, Tpl.Edit, {
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

  Tpl.AddTeamType.$events({
    'click [name=default]'(event) {
      Dom.stopEvent();

      Dom.toggleClass(this.parentNode, 'checked');
    },

    'click [name=cancel]'(event) {
      Dialog.close(event.currentTarget);
    },

    'click [type=submit]'(event) {
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

  function setSortFunc() {
    return sortFunc = util.compareByField(sortField);
  }

  return Tpl;
});
