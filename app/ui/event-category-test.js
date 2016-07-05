isClient && define(function (require, exports, module) {
  var test, v;
  const Route = require('koru/ui/route');
  const App   = require('ui/app');
  const sut   = require('./event-category');
  const TH    = require('./test-helper');

  TH.testCase(module, {
    setUp() {
      test = this;
      v = {
        org: TH.Factory.createOrg(),
        category: TH.Factory.createCategory(),
      };
      TH.login();
      v.tt1 = TH.Factory.createTeamType();
      v.t1 = TH.Factory.createTeam();
      v.tt2 = TH.Factory.createTeamType();
      v.t2 = TH.Factory.createTeam();
      v.event = TH.Factory.createEvent({teamType_ids: [v.tt1._id, v.tt2._id]});
      v.result = TH.Factory.createResult({scores: [0.1]});
      TH.Factory.createClimber();
      TH.Factory.createCompetitor({team_ids: [v.t1._id, v.t2._id]});
      v.result2 = TH.Factory.createResult({scores: [0.3]});
      TH.setOrg(v.org);
      v.eventSub = test.stub(App, 'subscribe').withArgs('Event').returns({stop: v.stop = test.stub()});
      Route.gotoPage(sut, {eventId: v.event._id, append: v.category._id, search: '&type=results'});
      v.eventSub.yield();
    },

    tearDown() {
      TH.tearDown();
      v = null;
    },

    "test rendering"() {
      assert.dom('#Event .Category', function () {
        assert.dom('h1', v.category.name);
        assert.dom('.rank table.results', function () {
          assert.dom('thead>tr', function () {
            assert.dom('th:first-child', 'Climber');
            assert.dom('th:nth-child(2)', 'Rank');
            assert.dom('th:nth-child(3)', 'Final');
            assert.dom('th:nth-child(4)', 'Qual points');
            assert.dom('th:nth-child(5)', 'Qual 2');
            assert.dom('th:nth-child(6)', 'Qual 1');
          });
          assert.dom('tbody', function () {
            assert.dom('tr:first-child>td.climber>.name', {text: v.result2.climber.name, parent: function () {
              assert.dom('.teams', function () {
                assert.dom('span', v.t1.shortName);
                assert.dom('span', v.t2.shortName);
              });
              assert.dom('.number', '' + v.result2.climber.number);
            }});
            assert.dom('tr:last-child>td.climber>.name', v.result.climber.name);
          });
        });
        TH.login();
        v.result.setScore(1, "23");

        assert.dom('.results>tbody', function () {
          assert.dom('tr:first-child>td.climber>.name', {text: v.result.climber.name, parent: function () {
            assert.dom('.teams', function () {
              assert.dom('span:first-child', "");
              assert.dom('span', v.t2.shortName);
            });
            assert.dom(this.parentNode, function () {
              assert.dom('.score:nth-child(2)>span', '1');
              assert.dom('.score>span', {text: "23", parent: function () {
                assert.dom('i', "1");
              }});
            });
          }});
          assert.dom('tr:last-child>td.climber>.name', {text: v.result2.climber.name, parent: function () {
            assert.dom(this.parentNode, function () {
              assert.dom('.score:nth-child(2)>span', '2');
              refute.dom('i');
            });
          }});
        });
        v.result.setScore(2, "13+");
        assert.dom('.results>tbody', function () {
          assert.dom('tr:first-child',  function () {
            assert.dom('.score>span', {text: "13+", parent: function () {
              assert.dom('i', "1");
              assert.dom(this.previousSibling, function () {
                assert.dom('span', "1");
              });
            }});
          });
          assert.dom('tr:last-child', function () {
            assert.dom('td:nth-child(3)>span', '');
          });
        });
        v.result2.setScore(2, "43.5");
        assert.dom('.results>tbody', function () {
          assert.dom('tr:last-child', function () {
            assert.dom('.score>span', {text: "43.5", parent: function () {
              assert.dom('i', "1");
              assert.dom(this.previousSibling, function () {
                assert.dom('span', "1.41");
              });
            }});
          });
        });
      });
    },

    "test switching to start order"() {
      v.result.$update({scores: [1, 310000, 220000, 330000]});
      v.result2.$update({scores: [2, 210000, 320000, 230000]});
      TH.login();

      assert.dom('.Category', function () {
        TH.click('[name=toggleStartOrder]', 'Show start order');

        assert.dom('h1', 'General - Start order');

        assert.dom('.start table.results', function () {
          assert.dom('tr:first-child>td.climber>.name', {text: v.result2.climber.name});
        });

        TH.click('[name=toggleStartOrder]', 'Show results');

        assert.dom('h1', 'General - Results');

        assert.dom('.rank table.results', function () {
          assert.dom('tr:first-child>td.climber>.name', {text: v.result.climber.name});
        });
      });
    },

    "boulder category": {
      setUp() {
        v.category = TH.Factory.createCategory({type: 'B', heatFormat: 'QF6'});
        v.event = TH.Factory.createEvent();
        v.result = TH.Factory.createResult({
          scores: [0.1, 3830485], problems: [[302, 0, 1, 101, 1210]],
        });

        TH.login();

        v.eventSub.reset();
        Route.gotoPage(sut, {eventId: v.event._id, append: v.category._id, search: '&type=results'});
        v.eventSub.yield();
      },

      "test no time column"() {
        TH.change('select[name=selectHeat]', 2);

        assert.dom('#Event .Category', function () {
          assert.dom('.rank table.results', function () {
            assert.dom('thead>tr', function () {
              assert.dom('th:first-child', 'Climber');
              assert.dom('th:nth-child(2)', 'Result');
              assert.dom('th:nth-child(3)', 'Sum');
              assert.dom('th:nth-child(4)', 'Previous heat');
            });

            refute.dom('td.heat99');
          });
        });
      },

      "test rendering qual round"() {
        TH.change('select[name=selectHeat]', 1);

        assert.dom('#Event .Category', function () {
          assert.dom('.rank table.results', function () {
            assert.dom('thead>tr', function () {
              assert.dom('th:first-child', 'Climber');
              assert.dom('th:nth-child(2)', 'Result');
              assert.dom('th:nth-child(3)', 'Sum');
              refute.dom('th:nth-child(4)');
            });
            assert.dom('tbody>tr:first-child', function () {
              assert.dom('td:nth-child(2).BoulderScore.score', function () {
                assert.dom('>div', {count: 5});
                assert.dom('>.top', {count: 3});
                assert.dom('>.bonus', {count: 1});
                assert.dom('>.top .top', '3');
                assert.dom('>.top .bonus', '2');

                assert.dom('>:not(.bonus):not(.top):nth-child(2)', '-');

                assert.dom('>.bonus:nth-child(3)>.bonus', '1');
                assert.dom('>.bonus:nth-child(3)>.top', '');

                assert.dom('>.top:nth-child(4)>.bonus', '1');
                assert.dom('>.top:nth-child(4)>.top', '1');

                assert.dom('>.top:nth-child(5)>.bonus', '10');
                assert.dom('>.top:nth-child(5)>.top', '12');
              });
              assert.dom('td:nth-child(3).score', function () {
                assert.dom('i', '1');
                assert.dom('span', '3t16 4b14');
              });
            });
          });
        });
      },

      "test entering finals"() {
        assert.dom('#Event .Category', function () {
          assert.dom('tr#Result_'+ v.result._id, function () {
            TH.trigger('td:nth-child(3)', 'mousedown');
          });
          assert.dom('h1', 'Final - Start order');
          assert.dom('tr#Result_'+ v.result._id, function () {
            assert.dom('td:nth-child(2).BoulderScore', function () {
              assert.dom('>div', {count: 4});
              assert.dom('>div>input.top', {count: 4});
              assert.dom('>div>input.bonus', {count: 4});
              assert.dom('>div:first-child', function () {
                assert.dom('.top', function () {
                  TH.trigger(this, 'focus');
                  TH.change(this, 'a');
                  assert.className(this.parentNode, 'error');
                  assert.same(document.activeElement, this);
                });
                assert.dom('.bonus', function () {
                  TH.trigger(this, 'focus');
                  TH.change(this, '4');
                });
              });
            });
          });
          assert.dom('tr#Result_'+ v.result._id, function () {
            assert.dom('td:nth-child(2).BoulderScore', function () {
              assert.dom('>div:first-child>.top', function () {
                TH.trigger(this, 'focus');
                TH.change(this, '5');
              });

              assert.equals(v.result.$reload().problems, [[302, 0, 1, 101, 1210], [504]]);
            });
          });
        });
      },
    },

    "lead category": {
      "test clicking on time in results mode"() {
        TH.login();

        TH.change('select[name=selectHeat]', 3);
        assert.dom('tr#Result_'+ v.result._id, function () {
          TH.trigger('td.heat99', 'mousedown');
        });

        assert.dom('.start table.results', function () {
          assert.dom('thead>tr', function () {
            assert.dom('th:first-child', 'Climber');
            assert.dom('th:nth-child(2)', 'Time taken');
            assert.dom('th:nth-child(3)', 'Result');
            assert.dom('th:nth-child(4)', 'Previous heat');
          });
          assert.dom('tbody', function () {
            assert.dom('tr:first-child>td.climber>.name', v.result2.climber.name);
            assert.dom('tr:last-child>td.climber>.name', v.result.climber.name);
          });
        });
      },

      "test entering finals"() {
        TH.loginAs(TH.Factory.createUser('admin'));

        assert.dom('#Event .Category', function () {
          assert.dom('tr#Result_'+ v.result._id, function () {
            TH.trigger('td:nth-child(3)', 'mousedown');
          });
          assert.dom('h1', 'Final - Start order');
          assert.dom('tr#Result_'+ v.result._id, function () {
            assert.dom('td:nth-child(3)>input[placeholder="n+"]');
            assert.dom('td:nth-child(2)', function () {
              TH.trigger(this, 'mousedown');
            });
          });
          assert.dom('tr#Result_'+ v.result._id + '>td:nth-child(2)>input[placeholder="m:ss"]', function () {
            assert.same(document.activeElement, this);
            TH.change(this, "3.44");
          });
          assert.equals(v.result.$reload().time, 3*60+44);
        });
      },

      "test selecting heat"() {
        TH.login();

        assert.dom('select[name=selectHeat]', function () {
          assert.dom('option[selected]', {value: "-1", text: 'General'});
          assert.dom('option:not([selected])', {value: "1", text: 'Qual 1'});
          TH.change(this, "2");
        });

        assert.dom('h1', 'Qual 2 - Results');

        assert.dom('.results>thead', 'Climber Result');
        assert.dom('.results>tbody>tr:first-child>td', {count: 2});
      },

      "test selecting score"() {
        TH.login();
        assert.dom('#Event .Category', function () {
          assert.dom('tr#Result_'+ v.result._id,  function() {
            TH.trigger('td:last-child', 'mousedown');
          });
        });

        assert.dom('#Result_'+ v.result._id, function () {
          assert.dom('td:last-child>input', function () {
            TH.change(this, "23.5+");
          });
        });

        assert.equals(v.result.$reload().scores, [0.1, 235005]);
      },
    },
  });
});
