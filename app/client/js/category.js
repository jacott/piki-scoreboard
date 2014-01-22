var $ = Bart.current;
var Tpl = Bart.Category;
var Index = Tpl.Index;

var elm;

Tpl.$extend({
  onBaseEntry: function () {
    document.body.appendChild(Tpl.$autoRender({}));
  },

  onBaseExit: function () {
    Bart.removeId('Category');
  },
});

Index.$helpers({
  categorys: function (callback) {
    AppModel.Category.find({}, {sort: {name: 1}})
      .forEach(function (doc) {callback(doc)});

    return AppModel.Category.Index.observe(function (doc, old) {
      callback(doc, old, sortByName);
    });
  },
});

function sortByName(a, b) {
  return a.name === b.name ? 0 : a.name < b.name ? -1 : 1;
}

Index.$events({
  'click .categorys tr': function (event) {
    event.$actioned = true;

    var data = $.data(this);
    AppRoute.gotoPage(Tpl.Edit, {categoryId: data._id});
  },
});

var base = AppRoute.root.addBase(Tpl, 'categoryId');
base.addTemplate(Index, {defaultPage: true, path: ''});
base.addTemplate(Tpl.Add, {
  focus: true,
  data: function () {
    return new AppModel.Category({org_id: App.orgId});
  }
});

base.addTemplate(Tpl.Edit, {
  focus: true,
  data: function (page, pageRoute) {
    var doc = AppModel.Category.findOne(pageRoute.categoryId);

    if (!doc) AppRoute.abortPage();

    return doc;
  }
});

Tpl.Add.$events({
  'click [name=cancel]': cancel,
  'click [type=submit]': Bart.Form.submitFunc('AddCategory', Tpl),
});


Tpl.Edit.$events({
  'click [name=cancel]': cancel,
  'click [name=delete]': function (event) {
    var doc = $.data();

    event.$actioned = true;
    Bart.Dialog.confirm({
      data: doc,
      classes: 'small warn',
      okay: 'Delete',
      content: Tpl.ConfirmDelete,
      callback: function(confirmed) {
        if (confirmed) {
          doc.$remove();
          AppRoute.gotoPage(Tpl);
        }
      },
    });

  },
  'click [type=submit]': Bart.Form.submitFunc('EditCategory', Tpl),
});

function cancel(event) {
  event.$actioned = true;
  AppRoute.gotoPage(Tpl);
}
