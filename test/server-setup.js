sinon.stub(App, 'log');
geddon.onTestStart(function () {
  App.log.reset();
  TH.clearDB();
});

geddon.onTestEnd(function () {
  if(AppModel.globalMemCount() !== 0) {
    if (geddon.test.success === true) {
      geddon.test.success = false;
      geddon.test.errors = ["  memDocs exist!"];
    } else {
      console.log("Error: " + geddon.test.name + ": memDocs exist!");
    }
  }
});

// HTTP.call = function() {};
