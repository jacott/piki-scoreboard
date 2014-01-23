var $ = Bart.current;
var Tpl = Bart.Event.Register;
var Form = Bart.Form;

Tpl.$events({
  'input [name=name]': function (event) {
    Form.completeList(this, AppModel.Climber.search(this.value, 20));

  },
});
