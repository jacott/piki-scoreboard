(function (test, v) {
  buster.testCase('client/event-category:', {
    setUp: function () {
      test = this;
      v = {};
      v = {
        org: TH.Factory.createOrg(),
        category: TH.Factory.createCategory(),
        event: TH.Factory.createEvent(),
        result: TH.Factory.createResult({scores: [0.1]}),
      };
      TH.Factory.createClimber();
      v.result2 = TH.Factory.createResult({scores: [0.3]});
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
            assert.dom('th:nth-child(2)', 'Final');
            assert.dom('th:nth-child(3)', 'Qual Rank');
            assert.dom('th:nth-child(4)', 'Qual 2');
            assert.dom('th:nth-child(5)', 'Qual 1');
            assert.dom('th:nth-child(6)', 'Start list');
          });
          assert.dom('tbody', function () {
            assert.dom('tr:first-child>td.climber', v.result2.climber.name);
            assert.dom('tr:last-child>td.climber', v.result.climber.name);
          });
        });
      });
    },

    "test selecting heat": function () {
      TH.login();

      assert.dom('select[name=selectHeat]', function () {
        assert.dom('option[selected]', {value: "-1", text: 'General result'});
        assert.dom('option:not([selected])', {value: "1", text: 'Qual 1'});
        TH.change(this, "1");
      });

      assert.dom('h1', 'Qual 1');
    },

    "test selecting climber": function () {
      TH.login();
      assert.dom('#Event #Category', function () {
        TH.click('td.climber', v.result.climber.name);

        assert.dom('h1', 'Qual 1');
        assert.dom('.heatUpdate>form#Heat', function () {

          assert.dom('label .name', {text: v.result.climber.name, parent: function () {
            TH.input('[name=score]', "23.5+");
          }});

          TH.trigger(this, 'submit');
        });

        assert.equals(v.result.$reload().scores, [0.1, 235005]);


        assert.dom('tbody>tr>td.climber', {
          text: v.result.climber.name, parent: function () {
            assert.dom('td', '23.5+');
          }
        });
      });
      TH.change('select[name=selectHeat]', "2");

      refute.dom('#Heat');
    },
  });
})();
