define(function(require, exports, module) {
  var App   = require('./app-base');
  var Dom   = require('koru/dom');
  var Route = require('koru/ui/route');
  var Tpl   = Dom.newTemplate(require('koru/html!./event-register'));
  var util  = require('koru/util');
  var koru = require('koru');
  var Form = require('koru/ui/form');
  var CompleteList = require('koru/ui/complete-list');
  var eventTpl = require('./event');
  var Competitor = require('models/competitor');
  var Climber = require('models/climber');
  var Category = require('models/category');
  require('./climber');

  var $ = Dom.current;
  var Index = Tpl.Index;

  var Add = Tpl.Add;
  var Edit = Tpl.Edit;
  var catTpl = Tpl.Category;
  var Groups = Tpl.Groups;
  var AddClimber = Tpl.AddClimber;
  var competitor;
  var sortField = 'name';
  var asc = 1;
  var sortClimber = true;
  var sortFunc;

  setSortFunc();

  koru.onunload(module, function () {
    eventTpl.route.removeBase(Tpl);
  });

  var base = eventTpl.route.addBase(Tpl);
  base.addTemplate(Add, {
    focus: true,
    defaultPage: true,
  });
  base.addTemplate(Edit, {
    focus: true,
    data: function (page, pageRoute) {
      return Competitor.findById(pageRoute.append) || Route.abortPage();
    }
  });

  Tpl.$helpers({
    competitors: function (callback) {
      callback.render({
        model: Competitor,
        sort: function (a, b) {
          return (sortClimber ? sortFunc(a.climber, b.climber) : sortFunc(a, b)) * asc;
        }
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

  Tpl.$events({
    'click tbody>tr': function (event) {
      Dom.stopEvent();
      Route.replacePath(Edit, {append: $.data(this)._id});
    },

    'click [name=cancel]': function (event) {
      Dom.stopEvent();
      Route.replacePath(Tpl);
    },

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
  });

  function setSortFunc() {
    sortClimber = true;
    switch (sortField) {
    case 'club':
      return sortFunc = function (a, b) {
        return util.compareByName(a.club, b.club);
      };
    case 'cat':
      sortClimber = false;
      return sortFunc = util.compareByField('category_ids');
    case 'createdAt':
      sortClimber = false;
      return sortFunc = util.compareByField('createdAt');
    default:
      return sortFunc = util.compareByField(sortField);
    }
  }


  Tpl.$extend({
    onBaseEntry: function (page, pageRoute) {
      if (! eventTpl.event) Route.abortPage();
      document.querySelector('#Event>div>.body').appendChild(Tpl.$autoRender(eventTpl.event));
    },

    onBaseExit: function (page, pageRoute) {
      Dom.removeId('Register');
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
      Dom.stopEvent();
      var doc = $.data();

      Dom.Dialog.confirm({
        data: doc,
        classes: 'warn',
        okay: 'Deregister',
        content: Tpl.ConfirmDelete,
        callback: function(confirmed) {
          if (confirmed) {
            doc.$remove();
            Route.replacePath(Tpl);
          }
        },
      });


    },
  });

  Add.$extend({
    $created: function (ctx) {
      if (eventTpl.event) {
        ctx.data = new Competitor({event_id: eventTpl.event._id});
      }
    },
  });

  Add.$events({
    'click [name=cancel]': function (event) {
      Dom.stopEvent();
      Route.replacePath(Tpl);
    },
    'submit': submit,

    'input [name=name]': function (event) {
      var input = this;
      var value = input.value;
      if (value) value = value.trim();
      if (value)  {
        var form = event.currentTarget;
        var competitor = $.data();

        var competitors = Competitor.eventIndex({event_id: competitor.event_id}) || {};

        var found = false;
        var completeList = value && Climber.search(value, 20, function (doc) {
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
        var cat = Category.findById(id);
        if (! cat) return;
        abbr.setAttribute("title", cat.name);
        abbr.textContent = cat.shortName;
        frag.appendChild(abbr);
      });
      return frag;
    },
  });

  Tpl.Row.$extend({
    $created: function (ctx) {
      Dom.autoUpdate(ctx, {subject: ctx.data.climber});
    },
  });

  AddClimber.$events({
    'submit': Form.submitFunc('AddClimber', function (doc) {
      Dom.Dialog.close();
      var form = document.querySelector('#Register form.add');
      var competitor = $.data(form);
      competitor.climber_id = doc._id;
      addGroups(form, competitor);
    }),

    'click [name=cancel]': function (event) {
      Dom.stopEvent();
      Dom.Dialog.close();
      document.querySelector('#Register [name=name].autoComplete').focus();
    },
  });

  Groups.$events({
    'click [name=editClimber]': function (event) {
      Dom.stopEvent();

      Route.gotoPage(Dom.Climber.Edit, {climberId: $.ctx.data.climber._id});
    },
  });

  function submit(event) {
    Dom.stopEvent();

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
      Route.replacePath(Add);
    }
  }

  function addNew(form, name) {
    Dom.Dialog.open(AddClimber.$autoRender(Climber.build({org_id: App.orgId, name: name})), {focus: '[name=dateOfBirth]'});
  }

  function addGroups(form, competitor) {
    var climber = competitor.climber;
    var groupsElm = form.querySelector('.Groups');

    Dom.remove(groupsElm);
    groupsElm = Groups.$autoRender(competitor);
    Category.groupApplicable(climber, function (group, docs) {
      groupsElm.appendChild(catTpl.$autoRender({
        groupName: group,
        groupList: docs,
        category_id: competitor.categoryIdForGroup(group),
      }));
    });
    form.insertBefore(groupsElm, form.querySelector('.actions'));
  }

  return Tpl;
});
