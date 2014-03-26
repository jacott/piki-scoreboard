sinon.stub(App, 'log');

AppModel._origBeginWaitFor = AppModel.beginWaitFor;
AppModel.beginWaitFor = function (name, id, func) {
  func();
};

geddon.onTestStart(function () {
  App.log.reset();
  TH.clearDB();
});

geddon.onTestEnd(function () {
  if(AppModel.globalMemCount() !== 0) {
    if (geddon.test.success === true) {
      geddon.test.success = false;
      geddon.test.errors = ["  memDocs exist!"];

      console.log("Error: " + geddon.test.name + ": memDocs exist! ", AppModel.globalMemCount());
      for(var key in AppModel) {
        var model = AppModel[key];
        var docs = model.memDocs && model.memDocs();
        if (docs) {
          for(var id in docs) {
            console.log(key, docs[id]);
          }
        }
      }
    } else {
      for(var key in AppModel) {
        var model = AppModel[key];
        model.clearMemDocs && model.clearMemDocs();
      }
    }
  }
});

// HTTP.call = function() {};
