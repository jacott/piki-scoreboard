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
        assert.dom('.rank table.results', function () {
          assert.dom('thead>tr', function () {
            assert.dom('th:first-child', 'Climber');
            assert.dom('th:nth-child(2)', 'Rank');
            assert.dom('th:nth-child(3)', 'Final');
            assert.dom('th:nth-child(4)', 'Qual Rank');
            assert.dom('th:nth-child(5)', 'Qual 2');
            assert.dom('th:nth-child(6)', 'Qual 1');
          });
          assert.dom('tbody', function () {
            assert.dom('tr:first-child>td.climber', v.result2.climber.name);
            assert.dom('tr:last-child>td.climber', v.result.climber.name);
          });
        });
        TH.login();
        v.result.setScore(1, "23");
        assert.dom('.results>tbody', function () {
          assert.dom('tr:first-child>td.climber', {text: v.result.climber.name, parent: function () {
            assert.dom('.score:nth-child(2)>span', '1');
            assert.dom('.score>span', {text: "23", parent: function () {
              assert.dom('i', "1");
            }});
          }});
          assert.dom('tr:last-child>td.climber', {text: v.result2.climber.name, parent: function () {
            assert.dom('.score:nth-child(2)>span', '2');
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

    "test switching to start order": function () {
      v.result.$update({$set: {scores: [1, 310000, 220000, 330000]}});
      v.result2.$update({$set: {scores: [2, 210000, 320000, 230000]}});
      TH.login();

      assert.dom('#Category', function () {
        TH.click('[name=toggleStartOrder]', 'Show start order');

        assert.dom('h1', 'General - Start order');

        assert.dom('.start table.results', function () {
          assert.dom('tr:first-child>td.climber', {text: v.result2.climber.name});
        });

        TH.click('[name=toggleStartOrder]', 'Show results');

        assert.dom('h1', 'General - Results');

        assert.dom('.rank table.results', function () {
          assert.dom('tr:first-child>td.climber', {text: v.result.climber.name});
        });
      });
    },

    "test no time column in boulder events": function () {
      v.category = TH.Factory.createCategory({type: 'B', heatFormat: 'FF6'});
      v.event = TH.Factory.createEvent();
      v.result = TH.Factory.createResult({scores: [0.1]});

      TH.login();

      v.eventSub.reset();
      AppRoute.gotoPage(Bart.Event.Category, {eventId: v.event._id, append: v.category._id});
      v.eventSub.yield();

      TH.change('select[name=selectHeat]', 2);

      assert.dom('#Event #Category', function () {
        assert.dom('.rank table.results', function () {
          assert.dom('thead>tr', function () {
            assert.dom('th:first-child', 'Climber');
            assert.dom('th:nth-child(2)', 'Result');
            assert.dom('th:nth-child(3)', 'Previous heat');
          });

          refute.dom('td.heat99');
        });
      });
    },

    "test clicking on time in results mode": function () {
      TH.login();

      TH.change('select[name=selectHeat]', 3);
      assert.dom('tr#Result_'+ v.result._id + '>td.climber', {text: v.result.climber.name, parent: function () {
        TH.click('td.heat99');
      }});

      assert.dom('.start table.results', function () {
        assert.dom('thead>tr', function () {
          assert.dom('th:first-child', 'Climber');
          assert.dom('th:nth-child(2)', 'Time taken');
          assert.dom('th:nth-child(3)', 'Result');
          assert.dom('th:nth-child(4)', 'Previous heat');
        });
        assert.dom('tbody', function () {
          assert.dom('tr:first-child>td.climber', v.result2.climber.name);
          assert.dom('tr:last-child>td.climber', v.result.climber.name);
        });
      });
    },

    "test entering finals": function () {
      TH.login();
      assert.dom('#Event #Category', function () {
        assert.dom('tr#Result_'+ v.result._id + '>td.climber', {text: v.result.climber.name, parent: function () {
          TH.click('td:nth-child(3)');
        }});
        assert.dom('h1', 'Final - Start order');
        assert.dom('tr#Result_'+ v.result._id + '>td.climber', {text: v.result.climber.name, parent: function () {
          assert.dom('td:nth-child(3)>input');
          assert.dom('td:nth-child(2)', function () {
            TH.click(this);
          });
        }});
        assert.dom('tr#Result_'+ v.result._id + '>td:nth-child(2)>input', function () {
          assert.same(document.activeElement, this);
          TH.change(this, "3:44");
        });
        assert.equals(v.result.$reload().time, 3*60+44);
        assert.dom('tr#Result_'+ v.result._id + '>td:nth-child(2)>span', '3:44');
      });
    },

    "test selecting heat": function () {
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

    "test selecting score": function () {
      TH.login();
      assert.dom('#Event #Category', function () {
        assert.dom('tr#Result_'+ v.result._id + '>td.climber', {text: v.result.climber.name, parent: function () {
          TH.click('td:last-child');
        }});
      });

      assert.dom('#Result_'+ v.result._id, function () {
        assert.dom('td:last-child.input>input', function () {
          TH.change(this, "23.5+");
        });
      });

      assert.equals(v.result.$reload().scores, [0.1, 235005]);


      assert.dom('#Result_'+ v.result._id, function () {
          assert.dom('td>input~span', '23.5+');
      });
    },
  });
})();
