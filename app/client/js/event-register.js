var $ = Bart.current;
var Form = Bart.Form;
App.require('Bart.Event', function (Event) {
  var Tpl = Event.Register;
  var Add = Tpl.Add;
  var Edit = Tpl.Edit;
  var Category = Tpl.Category;
  var Groups = Tpl.Groups;
  var AddClimber = Tpl.AddClimber;
  var competitor;
  var sortField = 'name';
  var asc = 1;
  var sortClimber = true;
  var sortFunc;

  setSortFunc();

  var base = Event.route.addBase(Tpl);
  base.addTemplate(Add, {
    focus: true,
    defaultPage: true,
  });
  base.addTemplate(Edit, {
    focus: true,
    data: function (page, pageRoute) {
      return AppModel.Competitor.findOne(pageRoute.append) || AppRoute.abortPage();
    }
  });

  Tpl.$helpers({
    competitors: function (callback) {
      callback.render({
        model: AppModel.Competitor,
        sort: function (a, b) {
          return (sortClimber ? sortFunc(a.climber, b.climber) : sortFunc(a, b)) * asc;
        }
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

  Tpl.$events({
    'click tbody>tr': function (event) {
      Bart.stopEvent();
      AppRoute.replacePath(Edit, {append: $.data(this)._id});
    },

    'click [name=cancel]': function (event) {
      Bart.stopEvent();
      AppRoute.replacePath(Tpl);
    },

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
  });

  function setSortFunc() {
    sortClimber = true;
    switch (sortField) {
    case 'club':
      return sortFunc = function (a, b) {
        return Apputil.compareByName(a.club, b.club);
      };
    case 'cat':
      sortClimber = false;
      return sortFunc = Apputil.compareByField('category_ids');
    case 'createdAt':
      sortClimber = false;
      return sortFunc = Apputil.compareByField('createdAt');
    default:
      return sortFunc = Apputil.compareByField(sortField);
    }
  }


  Tpl.$extend({
    onBaseEntry: function (page, pageRoute) {
      if (! Event.event) AppRoute.abortPage();
      document.querySelector('#Event>div>.body').appendChild(Tpl.$autoRender(Event.event));
    },

    onBaseExit: function (page, pageRoute) {
      Bart.removeId('Register');
    },

    $destroyed: function (ctx, elm) {
      competitor = null;
    },
  });

  Edit.$extend({
    $created: function (ctx, elm) {
      addGroups(elm, ctx.data);
    },
  });

  Edit.$events({
    'submit': submit,

    'click [name=delete]': function (event) {
      Bart.stopEvent();
      var doc = $.data();

      Bart.Dialog.confirm({
        data: doc,
        classes: 'warn',
        okay: 'Deregister',
        content: Tpl.ConfirmDelete,
        callback: function(confirmed) {
          if (confirmed) {
            doc.$remove();
            AppRoute.replacePath(Tpl);
          }
        },
      });


    },
  });

  Add.$extend({
    $created: function (ctx) {
      if (Event.event) {
        ctx.data = new AppModel.Competitor({event_id: Event.event._id});
      }
    },
  });

  Add.$events({
    'click [name=cancel]': function (event) {
      Bart.stopEvent();
      AppRoute.replacePath(Tpl);
    },
    'submit': submit,

    'input [name=name]': function (event) {
      var input = this;
      var value = input.value;
      if (value) value = value.trim();
      if (value)  {
        var form = event.currentTarget;
        var competitor = $.data();

        var competitors = AppModel.Competitor.eventIndex({event_id: competitor.event_id}) || {};

        var found = false;
        var completeList = value && AppModel.Climber.search(value, 20, function (doc) {
          found = true;
          return ! (doc._id in competitors);
        });
        if (completeList.length === 0) {
          if (found) {
            completeList = [{name: "Already registered"}];
          } else {
            completeList = [{name: 'Add "' + value + '"', addNew: true}];
          }
        }
      }
      Form.completeList({
        input: this,
        completeList: completeList,
        callback: function (ret) {
          if (ret._id) {
            input.value = ret.name;
            competitor.climber_id = ret._id;

            addGroups(form, competitor);
          } else if (ret.addNew) {
            addNew(form, value);
          }
        },
      });
    },
  });

  Tpl.Row.$helpers({
    categories: function () {
      var frag = document.createDocumentFragment();
      this.category_ids.forEach(function (id) {
        var abbr = document.createElement('abbr');
        var cat = AppModel.Category.quickFind(id);
        abbr.setAttribute("title", cat.name);
        abbr.textContent = cat.shortName;
        frag.appendChild(abbr);
      });
      return frag;
    },
  });

  Tpl.Row.$extend({
    $created: function (ctx) {
      Bart.autoUpdate(ctx, {subject: ctx.data.climber});
    },
  });

  AddClimber.$events({
    'submit': Bart.Form.submitFunc('AddClimber', function (doc) {
      Bart.Dialog.close();
      var form = document.querySelector('#Register form.add');
      var competitor = $.data(form);
      competitor.climber_id = doc._id;
      addGroups(form, competitor);
    }),

    'click [name=cancel]': function (event) {
      Bart.stopEvent();
      Bart.Dialog.close();
      document.querySelector('#Register [name=name].autoComplete').focus();
    },
  });

  Groups.$events({
    'click [name=editClimber]': function (event) {
      Bart.stopEvent();

      AppRoute.gotoPage(Bart.Climber.Edit, {climberId: $.ctx.data.climber._id});
    },
  });

  function submit(event) {
    Bart.stopEvent();

    var competitor = $.data();
    var ids = [];
    var form = event.currentTarget;

    var compNumber = form.querySelector('[name=number]');

    if (compNumber.value) {
      var climber = competitor.climber;
      climber.number = compNumber.value;
      if (! climber.$save()) {
        Form.renderErrors(climber, compNumber.parentNode);
        return;
      }
    }

    var groups = form.querySelectorAll('.Groups select');
    for(var i = 0; i < groups.length; ++i) {
      var row = groups[i];
      if (row.value) ids.push(row.value);
    }

    competitor.category_ids = ids;

    if (Form.saveDoc(competitor, form)) {
      AppRoute.replacePath(Add);
    }
  }

  function addNew(form, name) {
    Bart.Dialog.open(AddClimber.$autoRender(AppModel.Climber.build({org_id: App.orgId, name: name})), {focus: '[name=dateOfBirth]'});
  }

  function addGroups(form, competitor) {
    var climber = competitor.climber;
    var groupsElm = form.querySelector('.Groups');

    Bart.remove(groupsElm);
    groupsElm = Groups.$autoRender(competitor);
    AppModel.Category.groupApplicable(climber, function (group, docs) {
      groupsElm.appendChild(Category.$autoRender({
        groupName: group,
        groupList: docs,
        category_id: competitor.categoryIdForGroup(group),
      }));
    });
    form.insertBefore(groupsElm, form.querySelector('.actions'));
  }
});
