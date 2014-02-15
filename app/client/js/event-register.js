var $ = Bart.current;
var Form = Bart.Form;
App.require('Bart.Event', function (Event) {
  var Tpl = Event.Register;
  var Add = Tpl.Add;
  var Edit = Tpl.Edit;
  var Category = Tpl.Category;
  var Groups = Tpl.Groups;
  var competitor;


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
      callback.render({model: AppModel.Competitor});
    },
  });

  Tpl.$events({
    'click tbody>tr': function (event) {
      event.$actioned = true;
      AppRoute.gotoPage(Edit, {append: $.data(this)._id});
    },

    'click [name=cancel]': function (event) {
      event.$actioned = true;
      AppRoute.history.back();
    },
  });

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
      event.$actioned = true;
      var doc = $.data();

      Bart.Dialog.confirm({
        data: doc,
        classes: 'small warn',
        okay: 'Deregister',
        content: Tpl.ConfirmDelete,
        callback: function(confirmed) {
          if (confirmed) {
            doc.$remove();
            AppRoute.gotoPage(Tpl);
          }
        },
      });


    },
  });

  Add.$extend({
    $created: function (ctx) {
      ctx.data = new AppModel.Competitor({event_id: Event.event._id});
    },
  });

  Add.$events({
    'click [name=cancel]': function (event) {
      event.$actioned = true;
      AppRoute.replacePath(Tpl);
    },
    'submit': submit,

    'input [name=name]': function (event) {
      var value = this.value;
      if (value) value = value.trim();
      var form = event.currentTarget;
      var competitor = $.data();

      var competitors = AppModel.Competitor.eventIndex({event_id: competitor.event_id}) || {};
      Form.completeList(this, value && AppModel.Climber.search(value, 20, function (doc) {
        return ! (doc._id in competitors);
      }), function (climber) {
        competitor.climber_id = climber._id;

        addGroups(form, competitor);
      });
    },
  });

  Tpl.Row.$helpers({
    categories: function () {
      return this.category_ids.map(function (id) {
        return AppModel.Category.quickFind(id).shortName;
      }).join(', ');

    },
  });

  function submit(event) {
    event.$actioned = true;

    var competitor = $.data();
    var ids = [];
    var form = event.currentTarget;

    var groups = form.querySelectorAll('.Groups select');
    for(var i = 0; i < groups.length; ++i) {
      var row = groups[i];
      if (row.value) ids.push(row.value);
    }

    competitor.category_ids = ids;

    if (Form.saveDoc(competitor, form)) {
      AppRoute.gotoPage(Add);
    }
  }

  function addGroups(form, competitor) {
    var climber = competitor.climber;
    var groupsElm = form.querySelector('.Groups');

    Bart.remove(groupsElm);
    groupsElm = Groups.$render(competitor);
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
