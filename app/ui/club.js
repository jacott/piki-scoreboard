define(function(require, exports, module) {
  var App   = require('./app-base');
  var Dom   = require('koru/dom');
  var Route = require('koru/ui/route');
  var Tpl   = Dom.newTemplate(require('koru/html!./club'));
  var util  = require('koru/util');
  var koru = require('koru');
  var Club = require('models/club');
  var Form = require('koru/ui/form');

  var $ = Dom.current;
  var Index = Tpl.Index;

  var elm;

  var base = Route.root.addBase(module, Tpl, 'clubId');
  koru.onunload(module, function () {
    Route.root.removeBase(Tpl);
  });

  Tpl.$extend({
    onBaseEntry: function () {
      document.body.appendChild(Tpl.$autoRender({}));
    },

    onBaseExit: function () {
      Dom.removeId('Club');
    },
  });

  Index.$helpers({
    clubs: function (callback) {
      callback.render({model: Club, sort: util.compareByName});
    },
  });

  Index.$events({
    'click .clubs tr': function (event) {
      if (! Dom.hasClass(document.body, 'aAccess')) return;
      Dom.stopEvent();

      var data = $.data(this);
      Route.gotoPage(Tpl.Edit, {clubId: data._id});
    },
  });

  base.addTemplate(module, Index, {defaultPage: true, path: ''});
  base.addTemplate(module, Tpl.Add, {
    focus: true,
    data: function () {
      return new Club({org_id: App.orgId});
    }
  });

  base.addTemplate(module, Tpl.Edit, {
    focus: true,
    data: function (page, pageRoute) {
      var doc = Club.findById(pageRoute.clubId);

      if (!doc) Route.abortPage();

      return doc;
    }
  });

  Tpl.Add.$events({
    'click [name=cancel]': cancel,
    'click [type=submit]': Form.submitFunc('AddClub', Tpl),
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
    'click [type=submit]': Form.submitFunc('EditClub', Tpl),
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
