define(function(require, exports, module) {
  const koru     = require('koru');
  const Dom      = require('koru/dom');
  const Form     = require('koru/ui/form');
  const Route    = require('koru/ui/route');
  const util     = require('koru/util');
  const Category = require('models/category');
  const CrudPage = require('ui/crud-page');
  const App      = require('./app-base');

  const Tpl = CrudPage.newTemplate(module, Category, require('koru/html!./category'));
  const $ = Dom.current;
  const Index = Tpl.Index;

  const typeNameComparitor = util.compareByFields('type', 'heatFormat', 'name');

  Tpl.title = "Categories";

  Tpl.Form.$helpers({
    typeList() {
      return [['', ''], ["L", "Lead"], ["B", "Boulder"]];
    },
  });

  Tpl.Add.$events({
    'click [name=cancel]': cancel,
    'click [type=submit]': Form.submitFunc('AddCategory', Tpl),
  });

  Tpl.Edit.$events({
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
    'click [type=submit]': Form.submitFunc('EditCategory', Tpl),
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

  return Tpl;
});
