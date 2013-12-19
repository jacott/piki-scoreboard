TH.subStub = function (userId, mainSub) {
  var test = geddon.test;
  var sub = {
    userId: userId,
    onStop: function (func) {
      this.stopFunc = func;
    },
    error: test.stub(), ready: test.stub(), stop: test.stub(),

    aSpy: test.stub(),
    cSpy: test.stub(),
    rSpy: test.stub(),
  };


  sub._session = mainSub ? mainSub._session : {
    sendAdded: sub.aSpy,
    sendChanged: sub.cSpy,
    sendRemoved: sub.rSpy,
    id: Random.id(),
  };

  test.onEnd(function () {
    sub.stopFunc && sub.stopFunc();
  });

  return sub;
};

TH.getPublish = function (name) {
  var pub;
  Meteor.publish.calledWith(name, sinon.match(function (arg) {return pub = arg}));
  return pub;
};
