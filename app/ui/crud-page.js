define((require, exports, module)=>{
  const Dom             = require('koru/dom');
  const Route           = require('koru/ui/route');
  const util            = require('koru/util');
  const User            = require('models/user');
  const App             = require('ui/app');

  const Tpl = Dom.newTemplate(module, require('koru/html!./crud-page'));
  const $ = Dom.current;

  Tpl.$helpers({
    templateName() {
      return $.template.name;
    },
  });

  Tpl.$extend({
    newTemplate(subm, model, html) {
      html.nodes = util.deepCopy(Tpl.nodes);
      const subTpl = Dom.newTemplate(subm, html);
      subTpl.model = model;
      const base = Route.root.addBase(subm, subTpl, {routeVar: 'modelId'});

      base.addTemplate(subm, subTpl.Index, {defaultPage: true, path: ''});
      base.addTemplate(subm, subTpl.Add, {
        focus: true,
        data: ()=> new model({org_id: App.orgId}),
      });

      base.addTemplate(subm, subTpl.Edit, {
        focus: true,
        data: (page, pageRoute)=>{
          const doc = model.findById(pageRoute.modelId);
          if (doc) return doc;

          Route.abortPage(subTpl);
        }
      });

      subTpl.Index.sorting = {
        sortField: 'name',
        asc: 1,
        sortFunc: null,
      };

      Tpl.Index.setSortFunc.call(subTpl.Index);

      subTpl.Index.$events({
        'click th'(event) {
          Dom.stopEvent();
          const {sorting} = subTpl.Index;
          const sort = this.getAttribute('data-sort');
          if (sorting.sortField === sort)
            sorting.asc *= -1;
          else {
            sorting.sortField = sort;
            sorting.asc = 1;
          }
          subTpl.Index.setSortFunc();
          $.ctx.updateAllTags();
        },
        'click .index-list tr'(event) {
          Dom.stopEvent();
          if (! User.me().isAdmin()) return;

          Route.gotoPage(subTpl.Edit, {modelId: $.data(this)._id});
        },
      });

      App.restrictAccess(subTpl.Edit);
      App.restrictAccess(subTpl.Add);

      return subTpl;
    },

    onBaseEntry() {
      const elm = this.$autoRender({});
      this.route.childAnchor = elm.querySelector('.body');
      Route.childAnchor.appendChild(elm);
    },

    onBaseExit() {
      Dom.removeId(this.name);
    },
  });

  Tpl.Index.$helpers({
    rows(each) {
      const {sortFunc, asc} = $.template.sorting;
      return {
        query: $.template.parent.model.query,
        compare: (a, b) => sortFunc(a, b) * asc,
        compareKeys: sortFunc.compareKeys,
        updateAllTags: true,
      };
    },

    sortOrder() {
      const parent = $.element.parentNode;
      const ths = parent.getElementsByTagName('th');
      const {sortField, asc} = $.template.sorting;
      for(var i = 0; i < ths.length; ++i) {
        Dom.removeClass(ths[i], 'sort');
        Dom.removeClass(ths[i], 'desc');
      }

      const elm = parent.querySelector('[data-sort="'+sortField+'"]');
      Dom.addClass(elm, 'sort');
      asc === -1 &&  Dom.addClass(elm, 'desc');
    },
  });

  Tpl.Index.$extend({
    setSortFunc() {
      const {sorting} = this;
      return sorting.sortFunc = util.compareByField(sorting.sortField);
    },
  });

  return Tpl;
});
