(function (test, v) {
  buster.testCase('client/event-register:', {
    setUp: function () {
      test = this;
      v = {};
      v.org = TH.Factory.createOrg();
      v.event = TH.Factory.createEvent();
      var names = ['Bob', 'brendon', 'bobby', 'robert'];
      v.climbers = TH.Factory.createList(4, 'createClimber', function (index, options) {
        options.name = names[index];
      });
      App.Ready.isReady = true;
      test.stub(App, 'subscribe').yields();
    },

    tearDown: function () {
      v = null;
    },

    "test adding": function () {
      AppRoute.gotoPage(Bart.Event.Register, {orgSN: v.org.shortName, eventId: v.event._id});

      assert.dom('#Event #Register #registrations', function () {
        assert.dom('h1', v.event.name);
        assert.dom('fieldset', function () {
          assert.dom('label .name', {text: 'Name', parent: function () {
            TH.input('[name=name]', {value: ''}, 'bo');
            assert.dom('ul>li', 'Bob');
            assert.dom('ul>li', 'bobby');
            TH.input('[name=name]', '');
            refute.dom('ul');
          }});
        });
      });
    },
  });
})();
