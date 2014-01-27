var $ = Bart.current;
var Tpl = Bart.Event.Register;
var Form = Bart.Form;
var Category = Tpl.AddForm.Category;

Tpl.AddForm.$events({
  'input [name=name]': function (event) {
    var value = this.value;
    if (value) value = value.trim();
    var groupsElm = event.currentTarget.querySelector('.Groups');

    Bart.removeClass(groupsElm, 'active');
    Form.completeList(this, value && AppModel.Climber.search(value, 20), function (climber) {
      Bart.destroyChildren(groupsElm, true);
      Bart.addClass(groupsElm, 'active');
      var count = 0;
      groupsElm.appendChild(Tpl.AddForm.CatHead.$render(climber));
      AppModel.Category.groupApplicable(climber, function (group, docs) {
        groupsElm.appendChild(Category.$autoRender({
          groupName: group,
          groupList: docs,
          category_id: null,
        }));
      });
    });
  },
});

Tpl.AddForm.$extend({
  $created: function (ctx, elm) {
    var event = ctx.data;
    ctx.data = {name: '', event_id: event._id};
  },
});
