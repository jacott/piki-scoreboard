(function () {
  var Meteor = Package.meteor.Meteor;

  var queue = [];

  Meteor.startup = function (cb) {
    queue.push(cb);
  };

  Meteor.startup.queue = function () {
    return queue;
  };
})();
