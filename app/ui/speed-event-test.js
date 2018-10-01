isClient && define((require, exports, module)=>{
  const Dom             = require('koru/dom');
  const Route           = require('koru/ui/route');
  const util            = require('koru/util');
  const User            = require('models/user');
  const Factory         = require('test/factory');
  const App             = require('ui/app');
  const EventCategory   = require('ui/event-category');
  const TH              = require('./test-helper');

  const SpeedEvent = require('./speed-event');

  const {stub, spy, onEnd, intercept, match: m} = TH;

  const $ = Dom.current;

  TH.testCase(module, ({before, after, beforeEach, afterEach, group, test})=>{
    let org, user, cat, event;

    const goto = (type, heatNumber)=>{
      Route.replacePage(EventCategory, {
        eventId: event._id, append: cat._id, search: `?type=${type}&heat=${heatNumber}`});
    };

    const createResults = (ans, arg2, cb)=>{
      if (typeof arg2 === 'number') {
        for(let i = 0; i < arg2; ++i) {
          Factory.createClimber(); Factory.createCompetitor({number: i+100});
          const changes = {
            scores: [(((i+1)*498764321)%5741)/10000, [6543+i*100, 7503+i*100]]};
          cb && cb(changes);
          ans.push(Factory.createResult(changes));
        }
      } else {
        let num = 100;
        for (const id in arg2) {
          Factory.createClimber({name: 'climber_'+id});
          Factory.createCompetitor({number: ++num});
          ans[id] = Factory.createResult({_id: id, scores: arg2[id]});
        }
      }
    };

    beforeEach(()=>{
      org = Factory.createOrg();
      cat = Factory.createCategory({type: 'S'});
      event = Factory.createEvent();
      intercept(App, 'subscribe', (...args) =>{
        const last = args[args.length-1];
        if (typeof last === 'function') last();
        return {stop: ()=>{}};
      });
    });

    afterEach(()=>{
      TH.tearDown();
    });

    test("render qual startlist", ()=>{
      user = Factory.createUser('guest');
      TH.loginAs(user);

      const res = [];
      createResults(res, 3);

      res[2].scores[1] = undefined;
      res[1].scores[1][0] = undefined;
      res[0].scores[1][1] = 'fall';

      goto('startlists', 0);

      assert.dom('#Event .Category.Speed', ()=>{
        assert.dom('h1', 'Category 1');
        assert.dom('h1.selectedHeat', 'Qualifiers - Start list');
      });

      assert.dom('#Event .results', catElm =>{
        assert.dom('tbody>tr:first-child', tr =>{
          assert.dom('td.climber:first-child', td =>{
            assert.dom('.teams>span', 'SN3');
            assert.dom('.name', 'Climber 2');
            assert.dom('.number', '101');
          });
          assert.dom('td.climber:last-child', td =>{
            assert.dom('.teams>span', 'SN3');
            assert.dom('.name', 'Climber 3');
            assert.dom('.number', '102');
          });
          assert.dom('td:nth-child(2)', '');
          assert.dom('td:nth-child(3)', '');
        });
        assert.dom('tbody>tr:nth-child(2)', tr =>{
          assert.dom('td.climber:first-child .name', 'Climber 1');
          assert.dom('td.climber:last-child .name', 'Climber 2');
          assert.dom('td:nth-child(2)', '6.543');
          assert.dom('td:nth-child(3)', '7.603');
        });
        assert.dom('tbody>tr:nth-child(3):last-child', tr =>{
          assert.dom('td.climber:first-child .name', 'Climber 3');
          assert.dom('td.climber:last-child .name', 'Climber 1');
          assert.dom('td:nth-child(2)', '');
          assert.dom('td:nth-child(3)', 'fall');
        });
      });

      TH.click('[name=toggleStartOrder]');
      assert.dom('#Event .Category.Speed h1.selectedHeat', 'Qualifiers - Results');
    });

    test("render qual results", ()=>{
      user = Factory.createUser('guest');
      TH.loginAs(user);

      const res = [];
      createResults(res, 5);

      res[2].scores[1] = undefined;
      res[1].scores[1][0] = undefined;
      res[0].scores[1][1] = 'fall';

      goto('results', 0);

      assert.dom('#Event .Category.Speed', ()=>{
        assert.dom('h1', 'Category 1');
        assert.dom('h1.selectedHeat', 'Qualifiers - Results');
      });

      assert.dom('#Event .results', catElm =>{
        assert.dom('thead', 'RankClimberLane ALane B');
        assert.dom('tbody>tr:first-child', tr =>{
          assert.dom('td.rank', '1');
          assert.dom('td.climber', {count: 1}, td =>{
            assert.dom('.teams>span', 'SN3');
            assert.dom('.name', 'Climber 1');
            assert.dom('.number', '100');
          });
        });
        assert.dom('tbody>tr:nth-child(2)', tr =>{
          assert.dom('td.rank', '2');
          assert.dom('td.climber .name', 'Climber 4');
        });
        assert.dom('tbody>tr:nth-child(3)', tr =>{
          assert.dom('td.rank', '3');
          assert.dom('td.climber .name', 'Climber 5');
        });
        assert.dom('tbody>tr:last-child', tr =>{
          assert.dom('td.rank', '');
          assert.dom('td.climber .name', 'Climber 3');
        });
      });

      TH.click('[name=toggleStartOrder]');
      assert.dom('#Event .Category.Speed h1.selectedHeat', 'Qualifiers - Start list');
    });

    group("nextStage", ()=>{
      beforeEach(()=>{
        TH.loginAs(Factory.createUser('admin'));
      });

      test("tiebreak quals", ()=>{
        event.$updatePartial('heats', [cat._id, 'S']);
        const res = {};
        createResults(res, {
          r1: [0.31, [6001, 7000]],
          r2: [0.21, [6201, 6500]],
          r3: [0.41, [6201, 6501]],
          r4: [0.61, [6501, 6201]],
          r5: [0.2, [6201, 6501]],
          r6: [0.3, [7602, 7000]],
          r7: [0.4, [7704, 7000]],
        });

        goto('startlists', 0);

        stub(Route, 'gotoPage');
        TH.click('.nextStage>button');
        refute.called(Route.gotoPage);

        assert.equals(event.heats, {[cat._id]: 'S'});
        assert.dom('.nextStage>.info', 'Ties need to be broken by extra runs in lane A');

        assert.dom('tr', {data: res.r1}, tr =>{
          refute.dom('td:nth-child(2).score>input+input');
        });

        assert.equals(res.r3.scores[1], [6201, 6501, 'tie']);

        assert.dom('tr', {data: res.r3}, tr =>{
          TH.change('td:nth-child(2).score>input+input[data-attempt="1"]', '7654');
        });
        assert.dom('tr', {data: res.r4}, tr =>{
          TH.change('td:nth-child(2).score>input+input[data-attempt="1"]', '7654');
        });
        assert.dom('tr', {data: res.r5}, tr =>{
          TH.change('td:nth-child(2).score>input+input[data-attempt="1"]', '7654');
        });
        assert.equals(res.r3.scores[1], [6201, 6501, 7654]);

        TH.click('.nextStage>button');
        refute.called(Route.gotoPage);


        assert.dom('tr', {data: res.r3}, tr =>{
          TH.change('td:nth-child(2).score>input+input+input[data-attempt="2"]', '7553');
        });

        assert.dom('tr', {data: res.r4}, tr =>{
          TH.change('td:nth-child(2).score>input+input+input[data-attempt="2"]', '7553');
        });

        assert.dom('tr', {data: res.r5}, tr =>{
          TH.change('td:nth-child(2).score>input+input+input[data-attempt="2"]', '7554');
        });

        assert.equals(res.r3.scores[1], [6201, 6501, 7654, 7553]);

        TH.click('.nextStage>button');
        TH.confirm();
        assert.called(Route.gotoPage);

        assert.equals(event.heats[cat._id], 'S2');
      });

      test("tiebreak semis", ()=>{
        event.$updatePartial('heats', [cat._id, 'S']);
        const res = {};
        createResults(res, {
          r01: [0.31, [6000, 6000]],
          r02: [0.21, [6000, 6000]],
          r03: [0.41, [6000, 6000]],
          r04: [0.61, [6000, 6000]],
          r05: [0.22, [6500, 6000]],
          r06: [0.32, [6500, 6000]],
          r07: [0.42, [6500, 6000]],
        });

        goto('startlists', 0);

        TH.click('.nextStage>button');
        assert.dom('.Dialog', ()=>{
          assert.dom('div', `Do you wish to proceed from the "Qualifiers" to the "Semi final"`);
          TH.click('[name=cancel]');
        });
        assert.equals(event.heats, {[cat._id]: 'S'});
        TH.click('.nextStage>button');
        TH.confirm();

        assert.equals(event.heats, {[cat._id]: 'S2'});

        const OPPONENTS = {1: 'r04', 4: 'r01', 2: 'r03', 3: 'r02'};

        for(let i = 1; i <= 4; ++i) {
          res['r0'+i].setSpeedScore({time: 5892, stage: 2, opponent_id: OPPONENTS[i], attempt: 1});
        }

        goto('startlists', 2);

        TH.click('.nextStage>button');

        assert.equals(res.r03.scores[3], {time: 5892, opponent_id: 'r02', tiebreak: ['tie']});
        assert.dom('.nextStage>.info', 'Ties need to be broken by extra runs in lane A');


        assert.dom('tr', {data: res.r01}, tr =>{
          TH.change('td:nth-child(2).score>input[data-attempt="1"]', '7654');
          TH.change('td:nth-child(3).score>input[data-attempt="1"]', '7654');
        });
        assert.dom('tr', {data: res.r03}, tr =>{
          TH.change('td:nth-child(2).score>input[data-attempt="1"]', '7654');
          TH.change('td:nth-child(3).score>input[data-attempt="1"]', '7654');
        });
        assert.equals(res.r01.scores[3], {time: 5892, opponent_id: 'r04', tiebreak: [7654]});
        assert.equals(res.r04.scores[3], {time: 5892, opponent_id: 'r01', tiebreak: [7654]});
        assert.equals(res.r03.scores[3], {time: 5892, opponent_id: 'r02', tiebreak: [7654]});
        assert.equals(res.r02.scores[3], {time: 5892, opponent_id: 'r03', tiebreak: [7654]});

        TH.click('.nextStage>button');

        assert.equals(res.r03.scores[3], {time: 5892, opponent_id: 'r02', tiebreak: [7654, 'tie']});

        assert.dom('.nextStage>.info');

        assert.dom('tr', {data: res.r01}, tr =>{
          TH.change('td:nth-child(2).score>input[data-attempt="2"]', '8653');
          TH.change('td:nth-child(3).score>input[data-attempt="2"]', '8654');
        });
        assert.dom('tr', {data: res.r03}, tr =>{
          TH.change('td:nth-child(2).score>input[data-attempt="2"]', '8654');
          TH.change('td:nth-child(3).score>input[data-attempt="2"]', '8653');
        });
        assert.equals(res.r02.scores[3].tiebreak, [7654, 8653]);
        assert.equals(res.r03.scores[3].tiebreak, [7654, 8654]);

        TH.click('.nextStage>button');
        TH.confirm();

        refute.dom('.nextStage>.info');

        assert.equals(event.heats[cat._id], 'S21');
      });

      test("qual rerun", ()=>{
        const res = []; createResults(res, 3);

        goto('startlists', 0);

        TH.click('.nextStage>button');
        TH.confirm();

        assert.equals(event.heats, {[cat._id]: 'SR'});
      });

      test("semi to final", ()=>{
        event.$updatePartial('heats', [cat._id, 'S2']);

        const res = []; createResults(res, 8);

        let time = 6123;
        let i=0;
        for (const r of res) {
          r.$updatePartial('scores', ['3', {time: time+=343, opponent_id: res[8-(++i)]._id}]);
        }

        goto('startlists', 2);

        TH.click('.nextStage>button');
        TH.confirm();

        assert.equals(event.heats, {[cat._id]: 'S21'});

        goto('startlists', 2);

        assert.dom('#Event', ()=>{
          assert.dom('.reopen', 'Reopen Semi final');
          TH.click('.reopen');
        });
        assert.dom('.Dialog', ()=>{
          assert.dom('div', 'Are you sure you want to reopen "Semi final" and later stages?');
          TH.click('[name=okay]');
        });

        assert.dom('#Event', ()=>{
          refute.dom('.reopen');
          assert.dom('.nextStage');
        });

        assert.equals(event.heats, {[cat._id]: 'S2'});
      });

      test("no quals entered", ()=>{
        const res = []; createResults(res, 2);
        goto('startlists', 0);

        res[0].$updatePartial('scores', [1, [null, 7503]]);

        stub(Route, 'gotoPage');
        TH.click('.nextStage>button');
        refute.called(Route.gotoPage);

        assert.dom('.nextStage>.info', 'All scores need to be entered');

        assert.equals(event.heats, {[cat._id]: 'S'});


        res[0].$updatePartial('scores', [1, [6763, 7503]]);

        TH.click('.nextStage>button');
        TH.confirm();
        assert.calledWith(Route.gotoPage, EventCategory, m(
          o => assert.specificAttributes(o, {
            eventId: event._id, append: cat._id, search: '?type=results&heat=0'})));

        assert.equals(event.heats, {[cat._id]: 'SR'});

        createResults(res, 8);
        TH.click('.nextStage>button');
        TH.confirm();
        assert.equals(event.heats, {[cat._id]: 'S3'});

        createResults(res, 8);
        TH.click('.nextStage>button');
        TH.confirm();
        assert.equals(event.heats, {[cat._id]: 'S4'});
      });
    });

    test("general result qual rerun", ()=>{
      event.$updatePartial('heats', [cat._id, 'SCR']);
      const res = {};
      createResults(res, {
        r1: [0.31, [6001, 7000], [6301, 7000]],
        r2: [0.21, [6102, 7000], [7000, 6201]],
        r3: [0.41, [6204, 7000], [6201, 7000]],
        r4: [0.61, ['fs', 7000], [6001, 7000]],
        r5: [0.2, [6501, 'fs'], [6001, 'fs']],
      });

      TH.loginAs(Factory.createUser('judge'));
      goto('results', -1);

      assert.dom('#Event .Speed .GeneralList', list =>{
        assert.dom('thead th', {count: 4});
        assert.dom('tbody', body =>{
          assert.dom('tr', {count: 5});
          assert.dom('tr:nth-child(1)', tr =>{
            assert.dom('.rank', '1');
            assert.dom('.climber .name', 'climber_r4');
            assert.dom(':nth-last-child(2).score', '6.00');
            assert.dom(':last-child.score', 'false start');
          });
          assert.dom('tr:nth-child(2)', tr =>{
            assert.dom('.rank', '2');
            assert.dom('.climber .name', 'climber_r2');
            assert.dom(':nth-last-child(2).score', '6.20');
            assert.dom(':last-child.score', '6.10');
          });
          assert.dom('tr:nth-child(3)', tr =>{
            assert.dom('.rank', '3');
            assert.dom('.climber .name', 'climber_r3');
            assert.dom(':nth-last-child(2).score', '6.20');
            assert.dom(':last-child.score', '6.20');
          });

          assert.dom('tr:nth-child(4)', tr =>{
            assert.dom('.rank', '4');
            assert.dom('.climber .name', 'climber_r1');
            assert.dom(':nth-last-child(2).score', '6.30');
            assert.dom(':last-child.score', '6.00');
          });
          assert.dom('tr:nth-child(5)', tr =>{
            assert.dom('.rank', '5');
            assert.dom('.climber .name', 'climber_r5');
            assert.dom(':nth-last-child(2).score', 'false start');
            assert.dom(':last-child.score', 'false start');
          });
        });
      });
    });

    test("general result", ()=>{
      event.$updatePartial('heats', [cat._id, 'S']);
      const res = {};
      createResults(res, {
        r1: [0.31, [6001, 7000]],
        r2: [0.21, [6102, 7000]],
        r3: [0.41, [6204, 7000]],
        r4: [0.61, [6308, 7000]],
        r5: [0.2, [6501, 7000]],
        r6: [0.3, [6602, 7000]],
        r7: [0.4, [6704, 7000]],
        r8: [0.6, [6808, 7000]],
        r9: [0.1, [8300, 7016]],
        r10: [0.931, [6001, 7000]],
        r11: [0.931, [6001, 7000]],
        r12: [0.921, [6102, 7000]],
        r13: [0.941, [6204, 7000]],
        r14: [0.961, [6308, 7000]],
        r15: [0.92, [6501, 7000]],
        r16: [0.93, [6602, 7000]],
        r17: [0.94, [6704, 7000]],
        r18: [0.96, [6808, 7000]],
        r19: [0.91, [8300, 7016]],
      });

      TH.loginAs(Factory.createUser('judge'));
      goto('results', -1);

      assert.dom('#Event .Speed .GeneralList', list =>{
        assert.dom('thead th', {count: 3});
        assert.dom('tbody', body =>{
          assert.dom('tr', {count: 19});
          assert.dom('tr:nth-child(1)', tr =>{
            assert.dom('.climber .name', 'climber_r10');
            assert.dom('.score', '6.00');
          });
          assert.dom('tr:nth-child(16)', tr =>{
            assert.dom('.climber .name', 'climber_r8');
            assert.dom('.score', '6.80');
          });
          assert.dom('tr:nth-child(19)', tr =>{
            assert.dom('.climber .name', 'climber_r19');
            assert.dom('.score', '7.01');
          });
        });

        event.$updatePartial('heats', [cat._id, 'S4']);
        assert.dom('thead th', {count: 4});

        res.r10.$updatePartial('scores', ['5', {opponent_id: 'r8', time: 6891}]);
        res.r8.$updatePartial('scores', ['5', {opponent_id: 'r10', time: 6247}]);

        assert.dom('tbody>tr:nth-child(1)', tr =>{
          assert.dom('.climber .name', 'climber_r8');
          assert.dom('.score:nth-child(3)', '6.24');
          assert.dom('.score:last-child', '6.80');
        });
        assert.dom('tbody>tr:nth-child(2)', tr =>{
          assert.dom('.climber .name', 'climber_r10');
          assert.dom('.score:nth-child(3)', '6.89');
          assert.dom('.score:last-child', '6.00');
        });
      });
    });

    test("selectHeat", ()=>{
      event.$updatePartial('heats', [cat._id, 'S4321']);

      TH.loginAs(Factory.createUser('judge'));
      goto('results', -1);

      stub(Route, 'replacePage');
      TH.selectMenu('#Event [name=selectHeat]', 0, elm =>{
        assert.domParent('li', {data: m.field('_id', -1), text: 'General'});
        assert.domParent('li', {data: m.field('_id', 2), text: 'Semi-final'});
        TH.click(elm);
      });

      assert.calledWith(Route.replacePage, Dom.Event.Category, {
        eventId: event._id, append: cat._id, search: '?type=results&heat=0'});
    });

    group("finals startList", ()=>{
      test("petit final", ()=>{
        TH.loginAs(Factory.createUser('judge'));

        event.$updatePartial('heats', [cat._id, 'S1']);

        const res = [];
        createResults(res, 6);

        goto('startlists', 1);

        assert.dom('#Event .Speed .ABList', list =>{
        });
      });

      test("qual final", ()=>{
        TH.loginAs(Factory.createUser('judge'));

        event.$updatePartial('heats', [cat._id, 'SR']);

        const res = {};
        createResults(res, {
          r1: [0.31, [6001, 7000]],
          r2: [0.21, [6102, 7000]],
          r3: [0.41, [6204, 7000]],
          r4: [0.61, ['fs', 7000]],
          r5: [0.20, [6501, 'fs']],
          r6: [0.30, ['fall', 'fall']],
        });

        goto('startlists', 1);

        assert.dom('#Event .Speed .ABList', list =>{
          assert.dom('tbody>tr', {count: 6});
          assert.dom('tbody>tr:first-child', tr =>{
            assert.dom('td.climber:first-child .name', 'climber_r5');
            assert.dom('td.climber:last-child .name', 'climber_r1');
            assert.dom('td:nth-child(2)>input', {value: ''}, input =>{
              input.focus();
              TH.change(input, '5673');
              assert.equals(res.r5.scores[2], [5673]);
              assert.equals(input.value, '5.673');
              assert.same(document.activeElement, input);
            });
          });
        });
      });

      test("enter round of sixteen", ()=>{
        TH.loginAs(Factory.createUser('judge'));

        event.$updatePartial('heats', [cat._id, 'S4']);

        const res = [];
        createResults(res, 20);

        goto('startlists', 4);

        assert.dom('#Event .Speed .ABList', list =>{
          assert.dom('tbody>tr:nth-child(3)', tr =>{
            assert.dom('td.climber:first-child .name', 'Climber 4');
            assert.dom('td:nth-child(2)>input', {value: ''}, input =>{
              input.focus();
              TH.change(input, '1.432');
              assert.same(document.activeElement, input);
              assert.equals(res[3].scores[5], {time: 1432, opponent_id: res[12]._id});
            });
            assert.dom('td.climber:first-child:not(.winner)');

            assert.dom('td.climber:last-child .name', 'Climber 13');
            assert.dom('td:nth-child(3)>input', {value: ''}, input =>{
              input.focus();
              input.value = 'xyz';
              TH.keydown(input, 27);
              assert.same(input.value, '');
              TH.change(input, 'fs');
              assert.equals(res[12].scores[5], {time: 'fs', opponent_id: res[3]._id});
              TH.change(input, '6');
              assert.equals(res[12].scores[5], {time: 6000, opponent_id: res[3]._id});
              assert.equals(input.value, '6.000');
              assert.same(document.activeElement, input);
            });
            assert.same(tr.getAttribute('winner'), 'a');
            TH.change(document.activeElement, 'fs');
            assert.same(tr.getAttribute('winner'), 'a');
            TH.change(document.activeElement, '  ');
            assert.equals(res[12].scores[5], null);
            assert.same(tr.getAttribute('winner'), '');
            TH.change(document.activeElement, '1234');
            assert.same(tr.getAttribute('winner'), 'b');
          });
        });
      });
    });

    test("enter qual scores", ()=>{
      TH.loginAs(Factory.createUser('judge'));

      const res = [];
      createResults(res, 3);

      res[2].scores[1] = undefined;
      res[1].scores[1][0] = undefined;
      res[0].scores[1][1] = 'fall';

      goto('startlists', 0);

      assert.dom('#Event .results', catElm =>{
        assert.dom('tbody>tr:nth-child(2)', tr =>{
          assert.dom('td.climber:first-child .name', 'Climber 1');
          assert.dom('td.climber:last-child .name', 'Climber 2');
          assert.dom('td:nth-child(2)>input', {value: '6.543'}, input =>{
            input.focus();
            TH.change(input, '1432');
            assert.equals(res[0].scores[1], [1432, 'fall']);
            assert.equals(input.value, '1.432');
            assert.same(document.activeElement, input);
          });

          assert.dom('td:nth-child(3)>input', {value: '7.603'}, input =>{
            input.focus();
            input.value = 'xyz';
            TH.keydown(input, 27);
            assert.same(input.value, '7.603');
            TH.change(input, 'fs');
            assert.equals(res[1].scores[1], [undefined, 'fs']);
            TH.change(input, '6');
            assert.equals(input.value, '6.000');
            assert.same(document.activeElement, input);
            TH.change(input, '  ');
            assert.equals(res[1].scores[1], [undefined, undefined]);
          });
        });
        assert.dom('tbody>tr:nth-child(3):last-child', tr =>{
          assert.dom('td.climber:first-child .name', 'Climber 3');
          assert.dom('td.climber:last-child .name', 'Climber 1');
          assert.dom('td:nth-child(2)>input', {value: ''});
          assert.dom('td:nth-child(2)>input', {value: ''});
          assert.dom('td:nth-child(3)>input', {value: 'fall'});
        });

        assert.dom('tbody>tr:first-child', tr =>{
          assert.dom('td.climber:first-child .name', 'Climber 2');
          assert.dom('td.climber:last-child .name', 'Climber 3');
        });

        createResults(res, 1, changes =>{
          changes.scores[0] = 0.001;
        });

        assert.dom('tbody>tr:first-child', tr =>{
          assert.dom('td.climber:first-child .name', 'Climber 4');
          assert.dom('td.climber:last-child .name', 'Climber 1');
        });

        assert.dom('tbody>tr:last-child', tr =>{
          assert.dom('td.climber:first-child .name', 'Climber 3');
          assert.dom('td.climber:last-child .name', 'Climber 2');
        });

        res[3].$remove();

        assert.dom('tbody>tr:first-child', tr =>{
          assert.dom('td.climber:first-child .name', 'Climber 2');
          assert.dom('td.climber:last-child .name', 'Climber 3');
        });
      });
    });
  });
});
