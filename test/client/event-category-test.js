(function (test, v) {
  buster.testCase('client/event-category:', {
    setUp: function () {
      test = this;
      v = {};
      v = {
        org: TH.Factory.createOrg(),
        category: TH.Factory.createCategory(),
        event: TH.Factory.createEvent(),
        result: TH.Factory.createResult({scores: [0.3]}),
      };
      TH.Factory.createClimber();
      v.result2 = TH.Factory.createResult({scores: [0.1]});
      TH.setOrg(v.org);
      v.eventSub = App.subscribe.withArgs('Event').returns({stop: v.stop = test.stub()});
      AppRoute.gotoPage(Bart.Event.Category, {eventId: v.event._id, append: v.category._id});
      v.eventSub.yield();
    },

    tearDown: function () {
      v = null;
    },

    "test rendering": function () {
      assert.dom('#Event #Category', function () {
        assert.dom('h1', v.category.name);
        assert.dom('table.results', function () {
          assert.dom('thead>tr', function () {
            assert.dom('th:first-child', 'Climber');
          });
          assert.dom('tbody', function () {
            assert.dom('tr:first-child>td.climber', v.result2.climber.name);
            assert.dom('tr:last-child>td.climber', v.result.climber.name);
          });
        });
      });
    },
  });
})();
