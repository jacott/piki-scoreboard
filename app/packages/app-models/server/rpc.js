App.rpc = rpc;

function rpc() {
  return Meteor.call.apply(Meteor, arguments);
}
