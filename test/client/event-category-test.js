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

    "test selecting climber": function () {
      TH.login();
      assert.dom('#Event #Category', function () {
        TH.click('td.climber', v.result.climber.name);

        assert.dom('.heatUpdate>form#Heat', function () {
          assert.dom('h1', 'Qualification 1');

          assert.dom('label .name', {text: v.result.climber.name, parent: function () {
            TH.input('[name=score]', "23.5+");
          }});

          TH.trigger(this, 'submit');
        });

        assert.equals(v.result.$reload().scores, [0.3, 235005]);


        assert.dom('tbody>tr>td.climber', {
          text: v.result.climber.name, parent: function () {
            assert.dom('td', '23.5+');
          }
        });
      });
    },
  });
})();
