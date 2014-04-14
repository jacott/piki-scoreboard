var $ = Bart.current;
var Tpl = Bart.Climber;
var Index = Tpl.Index;
var sortField = 'name';
var asc = 1;
var sortFunc;

setSortFunc();

var elm;

Tpl.$extend({
  onBaseEntry: function () {
    document.body.appendChild(Tpl.$autoRender({}));
  },

  onBaseExit: function () {
    Bart.removeId('Climber');
  },
});

Index.$helpers({
  climbers: function (callback) {
    callback.render({
      model: AppModel.Climber,
      sort: function (a, b) {
        return sortFunc(a, b) * asc;
      },
    });
  },

  sortOrder: function () {
    var parent = $.element.parentNode;
    var ths = parent.getElementsByTagName('th');
    for(var i = 0; i < ths.length; ++i) {
      Bart.removeClass(ths[i], 'sort');
      Bart.removeClass(ths[i], 'desc');
    }

    var elm = parent.querySelector('[data-sort="'+sortField+'"]');
    Bart.addClass(elm, 'sort');
    asc === -1 &&  Bart.addClass(elm, 'desc');
  },
});

Index.$events({
  'click th': function (event) {
    Bart.stopEvent();
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
    if (! Bart.hasClass(document.body, 'aAccess')) return;
    Bart.stopEvent();

    var data = $.data(this);
    AppRoute.gotoPage(Tpl.Edit, {climberId: data._id});
  },
});

Tpl.Form.$helpers({
  clubList: function () {
    return AppModel.Club.find({}, {sort: {name: 1}}).map(function (doc) {
      return [doc._id, doc.name];
    });
  },
});

Tpl.Add.$events({
  'click [name=cancel]': cancel,
  'click [type=submit]': Bart.Form.submitFunc('AddClimber', "back"),
});

Tpl.Edit.$events({
  'click [name=cancel]': cancel,
  'click [name=delete]': function (event) {
    var doc = $.data();

    Bart.stopEvent();
    Bart.Dialog.confirm({
      data: doc,
      classes: 'warn',
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
  'click [type=submit]': Bart.Form.submitFunc('EditClimber', "back"),
});

var base = AppRoute.root.addBase(Tpl, 'climberId');
base.addTemplate(Index, {defaultPage: true, path: ''});
base.addTemplate(Tpl.Add, {
  focus: true,
  data: function () {
    return new AppModel.Climber({org_id: App.orgId});
  }
});

base.addTemplate(Tpl.Edit, {
  focus: true,
  data: function (page, pageRoute) {
    var doc = AppModel.Climber.findOne(pageRoute.climberId);

    if (!doc) AppRoute.abortPage();

    return doc;
  }
});

function cancel(event) {
  Bart.stopEvent();
  AppRoute.history.back();
}

function setSortFunc() {
  switch (sortField) {
  case 'club':
    return sortFunc = function (a, b) {
      return Apputil.compareByName(a.club, b.club);
    };
  default:
    return sortFunc = Apputil.compareByField(sortField);
  }
}
