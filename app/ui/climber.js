define(function(require, exports, module) {
  const koru       = require('koru');
  const Dom        = require('koru/dom');
  const session    = require('koru/session');
  const Dialog     = require('koru/ui/dialog');
  const Form       = require('koru/ui/form');
  const Route      = require('koru/ui/route');
  const util       = require('koru/util');
  const Climber    = require('models/climber');
  const TeamType   = require('models/team-type');
  const CrudPage   = require('ui/crud-page');
  const Flash      = require('ui/flash');
  const TeamHelper = require('ui/team-helper');
  const App        = require('./app-base');

  const Tpl = CrudPage.newTemplate(module, Climber, require('koru/html!./climber'));
  const $ = Dom.current;
  const Index = Tpl.Index;
  const Merge = Tpl.Merge;

  Tpl.title = "Climbers";

  Tpl.route.addTemplate(module, Merge, {
    focus: true,
    data: function (page, pageRoute) {

      const doc = Climber.findById(pageRoute.modelId);
      if (doc) return doc;

      Route.abortPage(Index);
    }
  });

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
    'menustart [name=selectTeamType]': TeamHelper.chooseTeamTypeEvent(ctx => TeamType.query.fetch()),

    'click .climbers tr'(event) {
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
    'click [name=merge]'(event) {
      Dom.stopEvent();

      Route.replacePage(Merge, {modelId: $.ctx.data._id});
    },
    'click [name=cancel]': cancel,
    'click [name=delete]'(event) {
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
    $destroyed(ctx, elm) {
      ctx.data.$clearChanges();
    }
  });

  function cancel(event) {
    Dom.stopEvent();
    Route.history.back();
  }

  Merge.$extend({
    $created(ctx) {
      ctx.selected = {};
      ctx.filter = "";
    },
  });

  Merge.$helpers({
    climbers(callback) {
      const climber = this;
      const ctx = $.ctx;
      const filterRe = new RegExp(
        ctx.filter.split(/\s+/)
          .map(p => `\\b${p}`).join('.*'),
        "i"
      );
      callback.render({
        model: Climber,
        filter(doc) {
          return doc._id !== climber._id &&
            (ctx.selected[doc._id] ||
             filterRe.test(doc.name));
        },
      });
    },
  });

  Merge.$events({
    'input [name=filter]'(event) {
      Dom.stopEvent();
      $.ctx.filter = this.value;
      $.ctx.updateAllTags();
    },

    'click [type=submit]'(event) {
      Dom.stopEvent();
      const page = event.currentTarget;
      const ctx = $.ctx;
      Dialog.confirm({
        data: ctx.data,
        classes: 'warn',
        okay: 'Merge',
        content: Tpl.ConfirmMerge,
        callback: function(confirmed) {
          if (confirmed) {
            Dom.addClass(page, 'merging');
            session.rpc('Climber.merge', ctx.data._id,
                        Object.keys(ctx.selected),
                        err => {
                          Route.history.back();
                          err || Flash.notice("Climbers merged");
                        });
          }
        },
      });

    },

    'click [name=cancel]': cancel,
  });

  Merge.Row.$helpers({
    selected() {
      Dom.setClass('selected', $.ctx.parentCtx.selected[this._id]);
    }
  });

  Merge.Row.$events({
    'click'(event) {
      Dom.stopEvent();
      const selected = Merge.$ctx().selected;
      const docId = $.data()._id;
      selected[docId] = ! selected[docId];
      $.ctx.updateAllTags();
    },
  });

  return Tpl;
});
