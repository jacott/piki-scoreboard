__meteor_runtime_config__ = { ROOT_URL: "http://test.local:1234", serverId: "testing"};

(function (geddon) {
  var _savedMethodHandlers, pageTitle, timeoutCount,
      firstTime = true;

  geddon.onTestStart(setUp);
  geddon.onTestEnd(tearDown);
  App.log = function () {};

  function setUp () {
    if(firstTime) {
      firstTime = false;
      pageTitle = AppRoute.title;
      AppRoute._orig_history = AppRoute.history;
      AppRoute.history = {
        pushState: function () {},
        replaceState: function () {},
        back: function () {},
      };
      // AppClient._orig_setLocalItem = AppClient.setLocalItem;
      // AppClient._orig_getLocalItem = AppClient.getLocalItem;
      // AppClient._orig_removeLocalItem = AppClient.removeLocalItem;

      // AppClient.setLocalItem = function () {};
      // AppClient.getLocalItem = function () {};
      // AppClient.removeLocalItem = function () {};
      Accounts.loginServicesConfigured = loginServicesConfiguredStub;
      Meteor.setTimeout = timeoutStub;
    } else {
      App.orgId = null;
      AppRoute.title = pageTitle;
      cleanup();
    }

    timeoutCount = 0;
  }

  function tearDown(test) {
    if (! test.success && test.logHtml) {
      console.log("html "+ (test.logHtml.innerHTML||''));
      test.logHtml = null;
    }
    AppRoute.gotoPage(null);
    var body = document.body;
    body.className = '';
    var lc;
    while(lc = body.lastChild) {
      Bart.remove(lc);
    }
    body.parentNode.scrollTop = 1;
    body.parentNode.scrollLeft = 1;
  }

  function loginServicesConfiguredStub() {
    return true;
  }

  function timeoutStub(func,duration) {
    func();
    return ++timeoutCount;
  }

  function cleanup() {
    try {
      TH.clearDB();
    }
    catch(e) {
      console.log('test cleanup ',e);
    }
  }
})(geddon);
