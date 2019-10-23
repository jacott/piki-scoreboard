define(function(require, exports, module) {
  const koru            = require('koru');
  const Dom             = require('koru/dom');
  const session         = require('koru/session');
  const ConfirmRemove   = require('koru/ui/confirm-remove');
  const Dialog          = require('koru/ui/dialog');
  const Form            = require('koru/ui/form');
  const Route           = require('koru/ui/route');
  const util            = require('koru/util');
  const Climber         = require('models/climber');
  const TeamType        = require('models/team-type');
  const CrudPage        = require('ui/crud-page');
  const Flash           = require('ui/flash');
  const TeamHelper      = require('ui/team-helper');
  const App             = require('./app-base');

  const Tpl = CrudPage.newTemplate(module, Climber, require('koru/html!./climber'));
  const $ = Dom.current;
  const Index = Tpl.Index;
  const Merge = Tpl.Merge;

  Tpl.title = "Climbers";

  Tpl.route.addTemplate(module, Merge, {
    focus: true,
    data(page, pageRoute) {

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

  Index.$helpers({
    teamTypeList: ()=>() => TeamType.query,
  });

  Index.$events({
    'click [name=clearAllNumbers]'(event) {
      Dom.stopEvent();
      ConfirmRemove.show({
        title: "Clear all climber numbers?", okay: 'Clear',
        description: Dom.h({div: [
          'You are about to permanently clear all climber numbers. Do you want to continue?',
          {br: ''}, {br: ''},
          "Note: numbers will not be removed from climbers' previous registrations in events."
        ]}),
        onConfirm() {
          const notice = Flash.confirm('Clearing all climber numbers...');
          session.rpc('Climber.clearAllNumbers', App.orgId, err => {
            Dom.remove(notice);
            err == null ? Flash.notice('Climber numbers cleared') : Flash.error(err);
          });
        }
      });

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
      Dom.tpl.Dialog.confirm({
        data: doc,
        classes: 'warn',
        okay: 'Delete',
        content: Tpl.ConfirmDelete,
        callback(confirmed) {
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
    climbers(each) {
      const climber = this;
      const ctx = $.ctx;
      const filterRe = new RegExp(
        ctx.filter.split(/\s+/)
          .map(p => `\\b${p}`).join('.*'),
        "i"
      );
      return {
        query: Climber.where(doc  => doc._id !== climber._id &&
            (ctx.selected[doc._id] ||
             filterRe.test(doc.name))),
        compare: util.compareByName,
      };
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
        onConfirm(confirmed) {
          Dom.addClass(page, 'merging');
          session.rpc(
            'Climber.merge', ctx.data._id,
            Object.keys(ctx.selected),
            err => {
              Route.history.back();
              err ? Flash.error(err) : Flash.notice("Climbers merged");
            });
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
