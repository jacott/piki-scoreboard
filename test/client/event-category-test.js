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
            assert.dom('tr:first-child>td.climber', v.result.climber.name);
            assert.dom('tr:last-child>td.climber', v.result2.climber.name);
          });
        });
        TH.login();
        v.result.setScore(1, "23");
        assert.dom('.results>tbody', function () {
          assert.dom('tr:first-child>td.climber', {text: v.result.climber.name, parent: function () {
            assert.dom('.score>span', {text: "23", parent: function () {
              assert.dom('i', "1");
            }});
          }});
          assert.dom('tr:last-child>td.climber', {text: v.result2.climber.name, parent: function () {
            refute.dom('i');
          }});
        });
        v.result.setScore(2, "13+");
        assert.dom('.results>tbody', function () {
          assert.dom('tr:first-child>td.climber', {text: v.result.climber.name, parent: function () {
            assert.dom('.score>span', {text: "13+", parent: function () {
              assert.dom('i', "1");
              assert.dom(this.previousSibling, function () {
                assert.dom('span', "1");
              });
            }});
          }});
          assert.dom('tr:last-child', function () {
            assert.dom('td:nth-child(3)>span', '');
          });
        });
        v.result2.setScore(2, "43.5");
        assert.dom('.results>tbody', function () {
          assert.dom('tr:last-child>td.climber', {text: v.result2.climber.name, parent: function () {
            assert.dom('.score>span', {text: "43.5", parent: function () {
              assert.dom('i', "1");
              assert.dom(this.previousSibling, function () {
                assert.dom('span', "1.41");
              });
            }});
          }});
        });
      });
    },

    "test selecting heat": function () {
      TH.login();

      assert.dom('select[name=selectHeat]', function () {
        assert.dom('option[selected]', {value: "-1", text: 'General result'});
        assert.dom('option:not([selected])', {value: "1", text: 'Qual 1'});
        TH.change(this, "2");
      });

      assert.dom('h1', 'Qual 2');

      assert.dom('.results>thead', 'Climber Result');
      assert.dom('.results>tbody>tr:first-child>td', {count: 2});
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

        assert.equals(v.result.$reload().scores, [2, 235005]);


        assert.dom('tbody>tr>td.climber', {
          text: v.result.climber.name, parent: function () {
            assert.dom('td>span', '23.5+');
          }
        });
      });
      TH.change('select[name=selectHeat]', "2");

      refute.dom('#Heat');
    },
  });
})();
