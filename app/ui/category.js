define((require, exports, module)=>{
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
  const {Index} = Tpl;

  const typeNameComparitor = util.compareByFields('type', 'heatFormat', 'name');

  Tpl.title = "Categories";

  const cancel = (event)=>{
    Dom.stopEvent();
    Route.gotoPage(Tpl);
  };

  Tpl.Form.$helpers({
    typeList: ()=> [["L", "Lead"], ["B", "Boulder"], ["S", "Speed"]],
  });

  Tpl.Add.$events({
    'click [name=cancel]': cancel,
    'click [type=submit]': Form.submitFunc('AddCategory', Tpl),
  });

  Tpl.Edit.$events({
    'click [name=cancel]': cancel,
    'click [name=delete]'(event) {
      const doc = $.data();

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
    'click [type=submit]': Form.submitFunc('EditCategory', Tpl),
  });

  Tpl.Edit.$extend({
    $destroyed(ctx, elm) {
      ctx.data.$clearChanges();
    }
  });

  return Tpl;
});
