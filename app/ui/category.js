define(function(require, exports, module) {
  var App   = require('./app-base');
  var Dom   = require('koru/dom');
  var Route = require('koru/ui/route');
  var Tpl   = Dom.newTemplate(require('koru/html!./category'));
  var util  = require('koru/util');
  var env = require('koru/env');
  var Category = require('models/category');
  var Club = require('models/club');
  var Form = require('koru/ui/form');

  var $ = Dom.current;

  var Index = Tpl.Index;
  var category;
  var elm;

  var base = Route.root.addBase(Tpl, 'categoryId');
  env.onunload(module, function () {
    Route.root.removeBase(Tpl);
  });

  Tpl.$extend({
    onBaseEntry: function () {
      document.body.appendChild(Tpl.$autoRender({}));
    },

    onBaseExit: function () {
      Dom.removeId('Category');
    },
  });

  Index.$helpers({
    categories: function (callback) {
      callback.render({model: Category, sort: util.compareByName});
    },
  });

  Index.$events({
    'click .categories tr': function (event) {
      Dom.stopEvent();

      var data = $.data(this);
      Route.gotoPage(Tpl.Edit, {categoryId: data._id});
    },
  });

  base.addTemplate(Index, {defaultPage: true, path: ''});
  base.addTemplate(Tpl.Add, {
    focus: true,
    data: function () {
      var attrs = category ? category.attributes : {};
      category = new Category({
        org_id: App.orgId,
        type: attrs.type,
        heatFormat: attrs.heatFormat,
        gender: attrs.gender,
        group: attrs.group,
      });
      return category;
    }
  });

  base.addTemplate(Tpl.Edit, {
    focus: true,
    data: function (page, pageRoute) {
      var doc = Category.findById(pageRoute.categoryId);

      if (!doc) Route.abortPage();

      return doc;
    }
  });

  Tpl.Form.$helpers({
    typeList: function () {
      return [['', ''], ["L", "Lead"], ["B", "Boulder"]];
    },
  });

  Tpl.Add.$events({
    'click [name=cancel]': cancel,
    'click [type=submit]': Form.submitFunc('AddCategory', Tpl),
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
    'click [type=submit]': Form.submitFunc('EditCategory', Tpl),
  });

  function cancel(event) {
    Dom.stopEvent();
    Route.gotoPage(Tpl);
  }

  return Tpl;
});
