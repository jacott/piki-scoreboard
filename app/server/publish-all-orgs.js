App.require('Session', function (Session) {
  Session.observe('on.start', 'AllOrgs', function (sess) {
    sess.addObserver('AllOrgs', AppModel.Org.observeAny(sess.buildUpdater('Org', {
      addedQuery: {},
    })));
  });
});
