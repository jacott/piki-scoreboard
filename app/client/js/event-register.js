var $ = Bart.current;
var Tpl = Bart.Event.Register;
var Form = Bart.Form;

Tpl.$events({
  'input [name=name]': function (event) {
    var value = this.value;
    if (value) value = value.trim();
    Form.completeList(this, value && AppModel.Climber.search(value, 20));
  },
});

Tpl.AddForm.$extend({
  $created: function (ctx, elm) {
    var event = ctx.data;
    ctx.data = {name: '', event_id: event._id};
  },
});

Tpl.AddForm.$helpers({
});
