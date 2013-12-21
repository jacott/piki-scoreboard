TH.stubReady = function () {
  var test = geddon.test;
  var ready = {
    onReady: test.stub(),
    setNotReady: test.stub(),
    notifyReady: test.stub(),
  };
  return TH.replaceObject(App, 'Ready', ready);
};
