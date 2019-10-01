isClient && define((require, exports, module)=>{
  const Route           = require('koru/ui/route');
  const EventSub        = require('pubsub/event-sub');
  const Factory         = require('test/factory');
  const App             = require('ui/app');
  const EventRegister   = require('ui/event-register');
  const TH              = require('./test-helper');

  const sut = require('./event-category');

  const {stub, spy, onEnd, intercept} = TH;

  let v = {};
  TH.testCase(module, ({beforeEach, afterEach, group, test})=>{
    group("lead and boulder", ()=>{
      beforeEach(()=>{
        v.org = Factory.createOrg();
        v.category = Factory.createCategory();
        TH.login();
        v.tt1 = Factory.createTeamType();
        v.t1 = Factory.createTeam();
        v.tt2 = Factory.createTeamType();
        v.t2 = Factory.createTeam();
        v.event = Factory.createEvent({teamType_ids: [v.tt1._id, v.tt2._id]});
        v.result = Factory.createResult({scores: [0.1]});
        Factory.createClimber();
        Factory.createCompetitor({team_ids: [v.t1._id, v.t2._id], number: 123});
        v.result2 = Factory.createResult({scores: [0.3]});
        TH.setOrg(v.org);
        v.eventSub = stub(EventSub, 'subscribe')
          .returns({stop: v.stop = stub()});
        Route.gotoPage(sut, {eventId: v.event._id, append: v.category._id, search: '&type=results'});
        v.eventSub.yield();
      });

      afterEach(()=>{
        TH.tearDown();
        v = {};
      });

      test("rendering", ()=>{
        assert.dom('#Event .Category', ()=>{
          assert.dom('h1', v.category.name);
          assert.dom('.rank table.results', ()=>{
            assert.dom('thead>tr', ()=>{
              assert.dom('th:first-child', 'Climber');
              assert.dom('th:nth-child(2)', 'Rank');
              assert.dom('th:nth-child(3)', 'Final');
              assert.dom('th:nth-child(4)', 'Qual points');
              assert.dom('th:nth-child(5)', 'Qual 2');
              assert.dom('th:nth-child(6)', 'Qual 1');
            });
            assert.dom('tbody', ()=>{
              assert.dom('tr:first-child>td.climber>.name', {text: v.result2.climber.name, parent() {
                assert.dom('.teams', ()=>{
                  assert.dom('span', v.t1.shortName);
                  assert.dom('span', v.t2.shortName);
                });
                assert.dom('.number', '' + v.result2.competitor.number);
              }});
              assert.dom('tr:last-child>td.climber>.name', v.result.climber.name);
            });
          });
          TH.login();
          v.result.setScore(1, "23");

          assert.dom('.results>tbody', ()=>{
            assert.dom('tr:first-child>td.climber>.name', {text: v.result.climber.name, parent() {
              assert.dom('.teams', ()=>{
                assert.dom('span:first-child', "");
                assert.dom('span', v.t2.shortName);
              });
              assert.dom(this.parentNode, ()=>{
                assert.dom('.score:nth-child(2)>span', '1');
                assert.dom('.score>span', {text: "23", parent: ()=>{
                  assert.dom('i', "1");
                }});
              });
            }});
            assert.dom('tr:last-child>td.climber>.name', {text: v.result2.climber.name, parent() {
              assert.dom(this.parentNode, ()=>{
                assert.dom('.score:nth-child(2)>span', '2');
                refute.dom('i');
              });
            }});
          });
          v.result.setScore(2, "13+");
          assert.dom('.results>tbody', ()=>{
            assert.dom('tr:first-child',  ()=>{
              assert.dom('.score>span', {text: "13+", parent() {
                assert.dom('i', "1");
                assert.dom(this.previousSibling, ()=>{
                  assert.dom('span', "1");
                });
              }});
            });
            assert.dom('tr:last-child', ()=>{
              assert.dom('td:nth-child(3)>span', '');
            });
          });
          v.result2.setScore(2, "43.5");
          assert.dom('.results>tbody', ()=>{
            assert.dom('tr:last-child', ()=>{
              assert.dom('.score>span', {text: "43.5", parent() {
                assert.dom('i', "1");
                assert.dom(this.previousSibling, ()=>{
                  assert.dom('span', "1.41");
                });
              }});
            });
          });
          v.result2.setScore(2, "Top");
          assert.dom('.score>span', "Top", elm =>{
            assert.same(elm.firstChild.data, "Top");
          });
        });
      });

      group("boulder category", ()=>{
        beforeEach(()=>{
          v.category = Factory.createCategory({type: 'B', heatFormat: 'QF6'});
          v.event = Factory.createEvent();
          v.result = Factory.createResult({
            scores: [0.1, 3048385], problems: [[302, 0, 1, 101, 1210]],
          });

          TH.login();

          v.eventSub.reset();
          Route.gotoPage(sut, {eventId: v.event._id, append: v.category._id, search: '&type=results'});
          v.eventSub.yield();
        });

        test("no time column", ()=>{
          TH.selectMenu('button[name=selectHeat]', 2);

          assert.dom('#Event .Category', ()=>{
            assert.dom('.rank table.results', ()=>{
              assert.dom('thead>tr', ()=>{
                assert.dom('th:first-child', 'Climber');
                assert.dom('th:nth-child(2)', 'Result');
                assert.dom('th:nth-child(3)', 'Sum');
                assert.dom('th:nth-child(4)', 'Previous heat');
              });

              refute.dom('td.heat99');
            });
          });
        });

        test("rendering qual round", ()=>{
          TH.selectMenu('button[name=selectHeat]', 1);

          assert.dom('#Event .Category', ()=>{
            assert.dom('.rank table.results', ()=>{
              assert.dom('thead>tr', ()=>{
                assert.dom('th:first-child', 'Climber');
                assert.dom('th:nth-child(2)', 'Result');
                assert.dom('th:nth-child(3)', 'Sum');
                refute.dom('th:nth-child(4)');
              });
              assert.dom('tbody>tr:first-child', ()=>{
                assert.dom('td:nth-child(2).BoulderScore.score', ()=>{
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
                assert.dom('td:nth-child(3).score', ()=>{
                  assert.dom('i', '1');
                  assert.dom('span', '3T4Z16AT14AZ', elm =>{
                    assert.dom('b', 'T');
                    assert.dom('b', 'Z');
                  });
                });
              });
            });
          });
        });

        test("entering finals", ()=>{
          assert.dom('#Event .Category', ()=>{
            assert.dom('tr#Result_'+ v.result._id, ()=>{
              TH.click('td:nth-child(3)');
            });
          });
          assert.dom('#Event .Category', ()=>{
            assert.dom('h1', 'Final - Start list');
            assert.dom('tr#Result_'+ v.result._id, ()=>{
              assert.dom('td:nth-child(2).BoulderScore', ()=>{
                assert.dom('>div', {count: 4});
                assert.dom('>div>input.top', {count: 4});
                assert.dom('>div>input.bonus', {count: 4});
                assert.dom('>div:first-child', ()=>{
                  assert.dom('.top', elm =>{
                    TH.trigger(elm, 'focus');
                    TH.change(elm, 'a');
                    assert.className(elm.parentNode, 'error');
                    assert.same(document.activeElement, elm);
                  });
                  assert.dom('.bonus', elm =>{
                    TH.trigger(elm, 'focus');
                    TH.change(elm, '4');
                  });
                });
              });
            });
            assert.dom('tr#Result_'+ v.result._id, ()=>{
              assert.dom('td:nth-child(2).BoulderScore', ()=>{
                assert.dom('>div:first-child>.top', elm =>{
                  TH.trigger(elm, 'focus');
                  TH.change(elm, '5');
                });

                assert.equals(v.result.$reload().problems, [[302, 0, 1, 101, 1210], [504]]);
              });
            });
          });
        });
      });

      group("lead category", ()=>{
        test("clicking on time in results mode", ()=>{
          TH.login();

          TH.selectMenu('button[name=selectHeat]', 3);
          assert.dom('tr#Result_'+ v.result._id, ()=>{
            TH.click('td.heat99');
          });

          assert.dom('.start table.results', ()=>{
            assert.dom('thead>tr', ()=>{
              assert.dom('th:first-child', 'Climber');
              assert.dom('th:nth-child(2)', 'Time taken');
              assert.dom('th:nth-child(3)', 'Result');
              assert.dom('th:nth-child(4)', 'Previous heat');
            });
            assert.dom('tbody', ()=>{
              assert.dom('tr:first-child>td.climber>.name', v.result2.climber.name);
              assert.dom('tr:last-child>td.climber>.name', v.result.climber.name);
            });
          });
        });

        test("entering finals", ()=>{
          TH.loginAs(Factory.createUser('admin'));

          assert.dom('#Event .Category', ()=>{
            assert.dom('tr#Result_'+ v.result._id, ()=>{
              TH.click('td:nth-child(3)');
            });
          });
          assert.dom('#Event .Category', ()=>{
            assert.dom('h1', 'Final - Start list');
            assert.dom('tr#Result_'+ v.result._id, ()=>{
              assert.dom('td:nth-child(3)>input[placeholder="n+"]');
              assert.dom('td:nth-child(2)', td =>{
                TH.trigger(td, 'pointerdown');
              });
            });
            assert.dom(
              'tr#Result_'+ v.result._id +
                '>td:nth-child(2)>input[placeholder="m:ss"]', input =>{
                  assert.same(document.activeElement, input);
                  TH.change(input, "3.44");
                }
            );
            assert.equals(v.result.$reload().time, 3*60+44);
          });
        });

        test("selecting heat", ()=>{
          TH.login();

          TH.selectMenu('button[name=selectHeat]', 2, li =>{
            assert.dom(li.parentNode, ()=>{
              assert.dom('li.selected', {text: 'General', data: TH.match.field('_id', -1)});
              assert.dom('li:not(.selected)', {text: 'Qual 1', data: TH.match.field('_id', 1)});
            });
            TH.click(li);
          });

          assert.dom('h1', 'Qual 2 - Results');

          assert.dom('.results>thead', 'Climber Result');
          assert.dom('.results>tbody>tr:first-child>td', {count: 2});
        });

        test("selecting score", ()=>{
          TH.login();
          assert.dom('#Event .Category', ()=>{
            assert.dom('tr#Result_'+ v.result._id,  ()=>{
              TH.click('td:last-child');
            });
          });

          assert.dom('#Result_'+ v.result._id, ()=>{
            assert.dom('td:last-child>input', input =>{
              TH.change(input, "23.5+");
            });
          });

          assert.equals(v.result.$reload().scores, [0.1, 235005]);
        });
      });
    });
  });
});
