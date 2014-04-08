var $ = Bart.current;
var Tpl = Bart.Disconnected;

Tpl.$events({
  'click [name=connect]': function (event) {
    Bart.stopEvent();
    Meteor.reconnect();
  },
});
