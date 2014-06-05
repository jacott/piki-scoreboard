define(function(require, exports, module) {
  var App   = require('./app-base');
  var Dom   = require('koru/dom');
  var Org   = require('models/org');
  var Route = require('koru/ui/route');
  var Tpl   = Dom.newTemplate(require('koru/html!./climber'));
  var util  = require('koru/util');
  var env = require('koru/env');
  var Climber = require('models/climber');
  var Club = require('models/club');

  var $ = Dom.current;
  var Index = Tpl.Index;
  var sortField = 'name';
  var asc = 1;
  var sortFunc;

  setSortFunc();

  var elm;

  var base = Route.root.addBase(Tpl, 'climberId');
  env.onunload(module, function () {
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

    'click .climbers tr': function (event) {
      if (! Dom.hasClass(document.body, 'aAccess')) return;
      Dom.stopEvent();

      var data = $.data(this);
      Route.gotoPage(Tpl.Edit, {climberId: data._id});
    },
  });

  Tpl.Form.$helpers({
    clubList: function () {
      return Club.query.fetch().sort(util.compareByName).map(function (doc) {
        return [doc._id, doc.name];
      });
    },
  });

  Tpl.Add.$events({
    'click [name=cancel]': cancel,
    'click [type=submit]': Dom.Form.submitFunc('AddClimber', "back"),
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
    'click [type=submit]': Dom.Form.submitFunc('EditClimber', "back"),
  });

  base.addTemplate(Index, {defaultPage: true, path: ''});
  base.addTemplate(Tpl.Add, {
    focus: true,
    data: function () {
      return new Climber({org_id: App.orgId});
    }
  });

  base.addTemplate(Tpl.Edit, {
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
    case 'club':
      return sortFunc = function (a, b) {
        return util.compareByName(a.club, b.club);
      };
    default:
      return sortFunc = util.compareByField(sortField);
    }
  }

  return Tpl;
});
