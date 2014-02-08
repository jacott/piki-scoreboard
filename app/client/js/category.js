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
  categories: function (callback) {
    AppModel.Category.find({}, {sort: {name: 1}})
      .forEach(function (doc) {callback(doc)});

    return AppModel.Category.Index.observe(function (doc, old) {
      callback(doc, old, Apputil.compareByName);
    });
  },
});

Index.$events({
  'click .categories tr': function (event) {
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

Tpl.Form.$helpers({
  heats: function () {
    var elm = $.element;
    if (this.heats && this.heats.length)
      this.heats.forEach(function (heat) {
        elm.parentNode.insertBefore(heatName(heat), elm);
      });
    else
      return heatName();
  },
});

Tpl.Form.$events({
  'click [name=addAnother]': function (event) {
    event.$actioned = true;
    event.currentTarget.querySelector('.heats .names').appendChild(heatName());
  },
});

function heatName(heat) {
  heat = heat || {id: Random.id()};
  return Bart.Form.TextInput.$render({
    type: 'text', name: 'heatName',
    options: {id: heat.id}, doc: {heatName: heat.name}
  });
}

Tpl.Add.$events({
  'click [name=cancel]': cancel,
  'click [type=submit]': Bart.Form.submitFunc('AddCategory', Tpl, heatExtract),
});

function heatExtract(doc, form) {
  var heats = [];
  var names = form.querySelectorAll('[name=heatName]');

  for(var i = 0; i < names.length; ++i) {
    var row = names[i];
    var name = row.value;
    name = name && name.trim();
    name && heats.push({id: row.id, name: name});
  }
  doc.heats = heats;
}


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
  'click [type=submit]': Bart.Form.submitFunc('EditCategory', Tpl, heatExtract),
});

function cancel(event) {
  event.$actioned = true;
  AppRoute.gotoPage(Tpl);
}
