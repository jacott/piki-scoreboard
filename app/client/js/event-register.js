var $ = Bart.current;
var Tpl = Bart.Event.Register;
var Form = Bart.Form;
var RegForm = Tpl.RegForm;
var Category = RegForm.Category;

Tpl.$helpers({
  newCompetitor: function () {
    return new AppModel.Competitor({event_id: this._id});
  },

  competitors: function (callback) {
    AppModel.Competitor.find({event_id: this._id})
      .forEach(function (doc) {callback(doc)});

    return AppModel.Competitor.Index.observe(function (doc, old) {
      doc = doc && new AppModel.Competitor(doc);
      old = old && new AppModel.Competitor(old);
      callback(doc, old);
    });
  },
});

RegForm.$events({
  'submit': function (event) {
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
      Bart.remove(form.querySelector('.Groups'));
      var elm = form.querySelector('[name=name]');
      elm.value = '';
      elm.focus();
      $.ctx.data = new AppModel.Competitor({event_id: competitor.event_id});
    }
  },

  'input [name=name]': function (event) {
    var value = this.value;
    if (value) value = value.trim();
    var form = event.currentTarget;
    var groupsElm = form.querySelector('.Groups');
    var actionsElm = form.querySelector('.actions');
    var competitor = $.data();

    Form.completeList(this, value && AppModel.Climber.search(value, 20), function (climber) {
      competitor.climber_id = climber._id;

      Bart.remove(groupsElm);
      groupsElm = RegForm.Groups.$render(climber);
      AppModel.Category.groupApplicable(climber, function (group, docs) {
        groupsElm.appendChild(Category.$autoRender({
          groupName: group,
          groupList: docs,
          category_id: null,
        }));
      });
      form.insertBefore(groupsElm, actionsElm);
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
