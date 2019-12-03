isClient && define((require, exports, module)=>{
  const Dom             = require('koru/dom');
  const Subscription    = require('koru/pubsub/subscription');
  const Route           = require('koru/ui/route');
  const util            = require('koru/util');
  const Result          = require('models/result');
  const User            = require('models/user');
  const EventSub        = require('pubsub/event-sub');
  const Factory         = require('test/factory');
  const EventCategory   = require('ui/event-category');
  const TH              = require('./test-helper');

  const SpeedEvent = require('./speed-event');

  const {stub, spy, onEnd, intercept, match: m} = TH;

  const $ = Dom.current;

  TH.testCase(module, ({before, after, beforeEach, afterEach, group, test})=>{
    let org, user, cat, event, climbers;

    const gotoNextStage = (stageName, tiebreak)=>{
      TH.click('.nextStage');
      if (tiebreak) {
        assert.dom('.nextStage>.info', /Break ties by further attempts on Lane A./);
      } else {
        refute.dom('.nextStage>.info');
        TH.confirm();
        assert.dom(document.body, ()=>{
          assert.dom('#Event .Speed .selectedHeat', stageName+' - Results');
        });
        const format = event.heats[cat._id];
        const ns = format[format.length-1];
        goto('startlists', ns === 'R' ? 1 : +ns);
      }
    };

    const withStartlist = (text)=>{
      let so = 0.1234;
      climbers = [];
      for(const name of text.split(/\s+/)) {
        if (name === '') continue;
        climbers.push(Factory.createClimber({name}));
        const competitor = Factory.createCompetitor();
        so += 0.0001;
        Factory.createResult({_id: 'res'+name, scores: [so]});
      }
      TH.loginAs(Factory.createUser('admin'));
      goto('startlists', 0);
      assert.dom('#Event .Speed table.results>tbody', tbody =>{
        assert.dom('tr', {count: climbers.length});
        const rows = tbody.querySelectorAll("tr");
        for(let i = 0; i < climbers.length; ++i) {
          assert.dom(`tr:nth-child(${i+1})`, tr =>{
            assert.dom('td:first-child.climber .name', climbers[i].name);
          });
        }
      });
    };

    const resultsAre = (stageName, results, tiebreak)=>{
      const elm = Dom('#Event .Speed');
      elm || assert.dom('#Event .Speed');
      try {
        assert.dom('.selectedHeat', stageName+' - Start list');
        let i = 0;
        if (stageName === 'Final')  {
          const rows = results.trim().split('\n').map(r => r.trim().split(/\s+/));
          for(let i = 0; i < 2; ++i) {
            const parts = rows[i];
            assert.dom(`table:${i == 0 ? 'first' : 'last'}-of-type `+
                       'tbody>tr:first-child:last-child', ()=>{
              assert.dom('td:first-child.climber .name', parts[0]);
              TH.change('td:nth-child(2) input', parts[1]);
              assert.dom('td:last-child.climber .name', parts[2]);
              TH.change('td:nth-child(3) input', parts[3]);
            });
          }
        } else assert.dom('table.results>tbody', ()=>{
          for (let row of results.split('\n')) {
            row = row.trim();
            if (row === '') continue;
            const parts = row.split(/\s+/);
            assert.dom(`tr:nth-child(${++i})`, tr =>{
              assert.dom('td:first-child.climber .name', parts[0]);
              TH.change('td:nth-child(2) input', parts[1]);
              assert.dom('td:last-child.climber .name', parts[2]);
              TH.change('td:nth-child(3) input', parts[3]);
            });
          }
        });
        gotoNextStage(stageName, tiebreak);
      } catch(err) {
        assert.fail(err.message + "\n" + htmlToText(elm), 1);
      }
    };

    const tiebreaksAre = (stageName, attempt, results, tiebreak)=>{
      assert.dom('#Event .Speed', elm =>{
        assert.dom('.selectedHeat', stageName+' - Start list');
        for (const row of results.split('\n')) {
          if (row === '') continue;
          const parts = row.split(/\s+/);
          assert.dom('td:first-child.climber .name', {text: parts[0], parent: p =>{
            assert.domParent(
              `td:nth-child(2) input[tabindex="10"][data-attempt="${attempt}"]`, input =>{
                TH.change(input,parts[1]);
              });
          }});
          if (parts.length > 2) {
            assert.dom('td:last-child.climber .name', {text: parts[2], parent: p =>{
              assert.domParent(`td:nth-child(3) input[data-attempt="${attempt}"]`, input =>{
                TH.change(input,parts[3]);
              });
            }});
          }
        }
        gotoNextStage(stageName, tiebreak);
      });
    };

    const htmlToText = html =>{
      const {childNodes} = html, len = childNodes.length;
      let result = '';
      for(let i = 0; i < len; ++i) {
        const elm = childNodes[i];
        if (elm.nodeType === document.TEXT_NODE)
          result += elm.textContent.replace(/\s+/g, ' ');
        else {
          switch(elm.tagName) {
          case 'BR': case 'TR':
            result += '\n';
            break;
          }
          const ans = htmlToText(elm);
          if (ans)
            result += ans + ' ';
        }
      }

      return result;
    };

    const generalResultsAre = (results)=>{
      goto('results', -1);
      const elm = Dom('#Event .Speed');
      elm || assert.dom('#Event .Speed');
      try {
        let i = -1;
        for (const row of results.split('\n')) {
          if (row === '') continue;
          if (++i == 0) {
            assert.dom('thead', ()=>{
              let j = 0;
              for (const heading of row.split(/\s+/)) {
                ++j;
                assert.dom(`th:nth-child(${j})`, heading.replace(/_/g, ' ').trim());
              }
            });
          } else {
            assert.dom(`tbody tr:nth-child(${i})`, tr =>{
              let j = 0;
              for (let v of row.split(/\s+/)) {
                v = v.replace(/_/g, ' ').trim();
                ++j;
                if (j == 2)
                  assert.dom(`td:nth-child(${j}).climber .name`, v);
                else
                  assert.dom(`td:nth-child(${j})`, v);
              }
            });
          }
        }
      } catch(err) {
        assert.fail(err.message + "\n" + htmlToText(elm), 1);
      }
    };

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

    const stubSub = (...args) =>{
      const last = args[args.length-1];
      if (typeof last === 'function') last();
      return {stop: ()=>{}};
    };

    beforeEach(()=>{
      org = Factory.createOrg();
      cat = Factory.createCategory({type: 'S'});
      event = Factory.createEvent();
      intercept(Subscription, 'subscribe', stubSub);
    });

    afterEach(()=>{
      TH.tearDown();
    });

    group("scenarios", ()=>{

      // All scores are compared to 1/1000th second (rule 9.15-B1).

      /* Test qual rankings (rule 9.17-A). 1. Competitors are ranked according to their faster
       * time. 2. Competitors with the same time are ranked relative to each other according to
       * their slower time. 3. Competitors with no valid time.
       *
       * TODO: IFSC Rules do not address what rank to give to H, a registered
       * competitor who does not climb at all. Lisia interprets this silence as meaning that H
       * should have no rank in the competition - exactly as if H was not registered. Currently Piki
       * gives H a rank lower than all other competitors.
       */
      test("qual rankings #1", ()=>{
        withStartlist(`
A
B
C
D
E
F
G
X
Y
H
I
J
K
L
M
N
Z
`);
        resultsAre('Qualifiers', `
A 1.112 H -
B 4.444 I FALL
C 1.111 J FS
D fall  K 4.444
E 4.444 L 8.881
F fall  M 8.888
G fall  N -
X -     Z -
Y 8.888 A 3.333

H -     B 1.111
I fs    C fall
J -     D 4.444
K -     E fs
L 4.444 F fall
M 4.444 G -
N fs    X fall
Z 9.999 Y 4.444
`);
        generalResultsAre(`
Rank Climber 1/4-final Qual
1    B       _          1.111
2    C       _          1.111
3    A       _          1.112
4    L       _          4.444
5    M       _          4.444
5    Y       _          4.444
7    K       _          4.444
7    D       _          4.444
9    Z       _          9.999
10   X       _          fall
10   I       _          false_start
10   G       _          fall
10   N       _          false_start
10   J       _          false_start
10   F       _          fall
10   E       _          false_start
17   H       _          _
`);
      });

            test("qual rankings #2", ()=>{
        withStartlist(`
A
B
C
D
E
F
G
`);
        resultsAre('Qualifiers', `
A 5.555 E 7.777
B 4.444 F 9.999
C fs    G fs
D 6.666 A 5.555
E fs    B 9.999
F 2.222 C fs
G fall  D 9.999
`);
        generalResultsAre(`
Rank Climber Semi-final Qual
1    F       _          2.222
2    B       _          4.444
3    A       _          5.555
4    D       _          6.666
5    G       _          false_start
5    C       _          false_start
5    E       _          false_start
`);
      });


      // Test placement in stages of final.

      test("quota of 4", ()=>{
                withStartlist(`
A
B
C
D
E
F
G
`);

        resultsAre('Qualifiers', `
A 3.333 E fall
B 8.888 F 4.444
C 2.222 G -
D -     A fs
E 5.555 B 8.888
F fall  C 8.888
G fall  D 1.111
`);

        resultsAre('Semi final', `
D 9.999 E 1.111
C 7.777 F 9.999
`);

        resultsAre('Final', `
D 8.888 F 1.111
E 9.999 C 2.222
`);

        generalResultsAre(`
Rank Climber Final  Semi-final Qual
1    C       2.222  7.777      2.222
2    E       9.999  1.111      5.555
3    F       1.111  9.999      4.444
4    D       8.888  9.999      1.111
5    B       _      _          8.888
6    G       _      _          fall
6    A       _      _          false_start
`);
      });

      // If a stage of the final round is not carried out, the comp is considered concluded, and
      // the winners of the last completed stage are ranked relative to each other based on their
      // qual rank (rule 9.18-C).
      test("quota of 8", ()=>{
        withStartlist(`
A
B
C
D
E
F
G
H
I
J
K
L
M
N
O
P
`);
        resultsAre('Qualifiers', `
A 9.9 I 9
B 8.8 J fs
C 7.7 K 9
D 6.6 L 9
E 5.5 M 9
F 4.4 N 9
G 3.3 O 9
H 2.2 P 9
I 1.1 A 9
J -   B 9
K 8.1 C 9
L 7.1 D 9
M 6.1 E 9
N 5.1 F 9
O 4.1 G 9
P 3.1 H 9
`);

        resultsAre('Quarter final', `
I 9.9 E 8.8
G 1.1 O 8.8
H fs  N wc
P 8.8 F fall
`);

        resultsAre('Semi final', `
E 1.1 G 3.3
N 3.3 P 4.4
`);

        generalResultsAre(`
Rank Climber Final Semi-final  1/4-final    Qual
1    N       _     3.300       wc           5.100
2    E       _     1.100       8.800        5.500
3    G       _     3.300       1.100        3.300
4    P       _     4.400       8.800        3.100
5    O       _     _           8.800        4.100
6    I       _     _           9.900        1.100
7    H       _     _           fs           2.200
8    F       _     _           fall         4.400
9    M       _     _           _            6.100
10   D       _     _           _            6.600
11   L       _     _           _            7.100
12   C       _     _           _            7.700
13   K       _     _           _            8.100
14   B       _     _           _            8.800
15   A       _     _           _            9.000
16   J       _     _           _            false_start

`);
      });

      // I vs A in stage of 16 below:
      // The winner of a race in a stage of the final where both competitors have the same time or
      // both do not have a valid time (but neither has a false start) is the competitor with the
      // higher qual ranking, or where their qual rank is equal, the race is re-run (rule 9.9-B3)

      // Competitors eliminated in quarter final below:
      // Competitors eliminated in a stage of the final are ranked relative to each other in order
      // of their times in the stage they were eliminated in, if tied then their times in succeeding
      // previous stages **except that their times can't be compared in any stage where one of them
      // has a wildcard**, and if nec. their times in the qual round (rule 9.18-A2)
      test("quota of 16", ()=>{
        withStartlist(`
A
B
C
D
E
F
G
H
I
J
K
L
M
N
O
P
`);
        resultsAre('Qualifiers', `
A 9.9 I 9.9
B 8.8 J 9.9
C 7.7 K 9.9
D 6.6 L 9.9
E 5.5 M 9.9
F 4.4 N 9.9
G 3.3 O 9.9
H 2.2 P 9.9
I 1.1 A 9.9
J 9.1 B 9.9
K 8.1 C 9.9
L 7.1 D 9.9
M 6.1 E 9.9
N 5.1 F 9.9
O 4.1 G 9.9
P 3.1 H 9.9
`);

        resultsAre('1/8 final', `
I fall A fall
E 7.7  M 6.6
G wc   K fs
O 3.3  C 2.2
H 1.1  J fall
N fs   D wc
P 8.8  B 9.9
F 6.6  L 5.5
`);

        resultsAre('Quarter final', `
I 9.9 M 3.3
G 9.9 C 1.1
H 2.2 D 9.9
P 4.4 L 9.9
`);

        generalResultsAre(`
Rank Climber Semi-final 1/4-final   1/8-final     Qual
1    H       _          2.200       1.100         2.200
2    P       _          4.400       8.800         3.100
3    M       _          3.300       6.600         6.100
4    C       _          1.100       2.200         7.700
5    I       _          9.900       fall          1.100
6    G       _          9.900       wc            3.300
7    D       _          9.900       wc            6.600
8    L       _          9.900       5.500         7.100
9    O       _          _           3.300         4.100
10   F       _          _           6.600         4.400
11   E       _          _           7.700         5.500
12   B       _          _           9.900         8.800
13   N       _          _           fs            5.100
14   K       _          _           fs            8.100
15   J       _          _           fall          9.100
16   A       _          _           fall          9.900
`);
      });


      // Where fewer than 4 competitors record a valid time in the qual, there is no final round
      // (rule 9.1B2, 9.5). The rules do not state that ties for 1st, 2nd or 3rd should be broken so
      // Lisia proposes that Piki leave them unbroken.

      // TODO: test that Piki shows the competition as complete after the Qual - no option to run a
      // final.

      test("less than 4 valid qual times #1", ()=>{
        withStartlist(`
A
B
C
D
`);

        resultsAre('Qualifiers', `
A fall   C 9.99
B 5.551  D fall
C 5.555  A fall
D fall   B 9.99
`);

        generalResultsAre(`
Rank Climber     Qual
1    B           5.551
2    C           5.555
3    D           fall
3    A           fall
`);
      });

      test("less than 4 valid qual times #2", ()=>{
        withStartlist(`
A
B
C
D
E
F
G
`);

        resultsAre('Qualifiers', `
A fs    E fall
B 5.555 F fall
C fall  G 9.991
D fall  A -
E fall  B 9.999
F fall  C fall
G 5.555 D fall
`);

        generalResultsAre(`
Rank Climber     Qual
1    G           5.555
2    B           5.555
3    C           fall
3    D           fall
3    A           false_start
3    F           fall
3    E           fall
`);
      });


      // Test rule 9.17-B: when there is a tie for the quota for the final, the tied competitors
      // rerun, but their times in the reruns are only used to decide who qualifies for the final,
      // not for any other purpose, i.e. they do not affect qual rankings.

      // And test rule 9.6-B: that competitors tied following the Qual round are randomly placed in
      // the final

      test("quota tie", ()=>{
        withStartlist(`
Ron
Hermione
Ginny
Luna
Harry
`);

        resultsAre('Qualifiers', `
Ron      9.876   Luna     9.876
Hermione 9.876   Harry    9.876
Ginny    1.111   Ron      9.876
Luna     9.876   Hermione 9.876
Harry    9.876   Ginny    9.876
`, 'tiebreak');

        tiebreaksAre('Qualifiers', 1, `
Ron      9.8
Hermione 9.8
Luna     9.6
Harry    9.7
`, 'tiebreak');

        tiebreaksAre('Qualifiers', 2, `
Ron      9.8
Hermione 9.7
`);

        generalResultsAre(`
Rank Climber   Semi-final Qual
1    Ginny        _       1.111
2    Hermione     _       9.876
2    Luna         _       9.876
2    Harry        _       9.876
5    Ron          _       9.876
`);

        goto('startlists', 2);

        resultsAre('Semi final', `
Ginny    5.555  Harry    4.444
Luna     6.666  Hermione 7.777
`);

        generalResultsAre(`
Rank Climber   Final Semi-final Qual
1    Luna      _     6.666      9.876
1    Harry     _     4.444      9.876
3    Ginny     _     5.555      1.111
4    Hermione  _     7.777      9.876
5    Ron       _     _          9.876
`);
      });

      test("rand placement", ()=>{
        withStartlist(`
A
B
C
D
E
`);
        resultsAre('Qualifiers', `
A 3.334 D 1.111
B 3.333 E 3.331
C 3.334 A 8.888
D fs    B 8.888
E 8.888 C 8.888
`);

        resultsAre('Semi final', `
E 6.666 A 1.111
B 4.444 C 5.555
`);

        generalResultsAre(`
Rank Climber Final Semi-final Qual
1    B       _     4.444       3.333
2    A       _     1.111       3.334
3    C       _     5.555       3.334
4    E       _     6.666       3.331
5    D       _      _         false_start
`);
      });


      // Test relative overall rank of competitors eliminated and not tied in a stage of Final
      // Round: faster beats slower beats {fall/fs/-}

      test("eliminated not tied in Final", ()=>{
        withStartlist(`
A
B
C
D
E
F
G
H
I
J
K
L
M
N
O
P
`);
        resultsAre('Qualifiers', `
A 9.9 I 9.9
B 8.8 J 9.9
C 7.7 K 9.9
D 6.6 L 9.9
E 5.5 M 9.9
F 4.4 N 9.9
G 3.3 O 9.9
H 2.2 P 9.9
I 1.1 A 9.9
J 9.1 B 9.9
K 8.1 C 9.9
L 7.1 D 9.9
M 6.1 E 9.9
N 5.1 F 9.9
O 4.1 G 9.9
P 3.1 H 9.9
`);

        resultsAre('1/8 final', `
I 1.1    A 2.222
E 2.229  M 1.1
G 2.221  K 1.1
O wc     C -
H 1.1    J fall
N fall   D 1.1
P 2.222  B 1.1
F wc     L fs
`);

        generalResultsAre(`
Rank Climber 1/4-final  1/8-final    Qual
1    I       _          1.100        1.100
2    H       _          1.100        2.200
3    O       _          wc           4.100
4    F       _          wc           4.400
5    M       _          1.100        6.100
6    D       _          1.100        6.600
7    K       _          1.100        8.100
8    B       _          1.100        8.800
9    G       _          2.221        3.300
10   P       _          2.222        3.100
11   A       _          2.222        9.900
12   E       _          2.229        5.500
13   N       _          fall         5.100
14   L       _          fs           7.100
15   C       _          -            7.700
16   J       _          fall         9.100
`);
      });



      // test relative overall rank of competitors eliminated and tied in 1/4-final,
      // with previous stage scores also tied: fall, fall, false start, false start
      test("eliminated and tied in Final", ()=>{
        withStartlist(`
A
B
C
D
E
F
G
H
I
J
K
L
M
N
O
P
`);
        resultsAre('Qualifiers', `
A 9.9 I 9.9
B 8.8 J 9.9
C 7.7 K 9.9
D 6.6 L 9.9
E 5.5 M 9.9
F 4.4 N 9.9
G 3.3 O 9.9
H 2.2 P 9.9
I 1.1 A 9.9
J 9.1 B 9.9
K 8.1 C 9.9
L 7.1 D 9.9
M 6.1 E 9.9
N 5.1 F 9.9
O 4.1 G 9.9
P 3.1 H 9.9
`);

        resultsAre('1/8 final', `
I fall A fall
E 4.4  M fall
G fs   K fs
O 3.3  C 2.2
H 1.1  J fall
N fs   D fs
P 8.8  B 9.9
F fall L fall
`);

        resultsAre('Quarter final', `
I 9.9 E 3.3
G 9.9 C 1.1
H 2.2 N 9.9
P 4.4 F 9.9
`);

        generalResultsAre(`
Rank Climber Semi-final 1/4-final   1/8-final     Qual
1    H       _          2.200       1.100         2.200
2    P       _          4.400       8.800         3.100
3    E       _          3.300       4.400         5.500
4    C       _          1.100       2.200         7.700
5    I       _          9.900       fall          1.100
6    G       _          9.900       fs            3.300
7    F       _          9.900       fall          4.400
8    N       _          9.900       fs            5.100
9    O       _          _           3.300         4.100
10   B       _          _           9.900         8.800
11   M       _          _           fall          6.100
12   D       _          _           fs            6.600
13   L       _          _           fall          7.100
14   K       _          _           fs            8.100
15   J       _          _           fall          9.100
16   A       _          _           fall          9.900
`);
      });


      test("eliminated and tied times in Final", ()=>{
        /**
         * relative overall rank of competitors eliminated and tied in 1/4-final, with previous
         * stage scores not all tied: faster time, slower time, equal times
         **/
        withStartlist(`
A
B
C
D
E
F
G
H
I
J
K
L
M
N
O
P
`);
        resultsAre('Qualifiers', `
A 9.9 I 9.9
B 8.8 J 9.9
C 7.7 K 9.9
D 6.6 L 9.9
E 5.5 M 9.9
F 4.4 N 9.9
G 3.3 O 9.9
H 2.2 P 9.9
I 1.1 A 9.9
J 9.1 B 9.9
K 8.1 C 9.9
L 7.1 D 9.9
M 6.1 E 9.9
N 5.1 F 9.9
O 4.1 G 9.9
P 3.1 H 9.9
`);

        resultsAre('1/8 final', `
I 8.8  A 8.8
E 4.4  M fall
G 1.1  K 1.1
O 3.3  C 2.2
H 1.1  J fall
N 5.5  D 5.5
P 8.8  B 9.9
F 5.5  L 5.5
`);

        resultsAre('Quarter final', `
I 9.9 E 3.3
G 9.9 C 1.1
H 2.2 N 9.9
P 4.4 F 9.9
`);

        generalResultsAre(`
Rank Climber Semi-final 1/4-final   1/8-final     Qual
1    H       _          2.200       1.100         2.200
2    P       _          4.400       8.800         3.100
3    E       _          3.300       4.400         5.500
4    C       _          1.100       2.200         7.700
5    G       _          9.900       1.100         3.300
6    F       _          9.900       5.500         4.400
7    N       _          9.900       5.500         5.100
8    I       _          9.900       8.800         1.100
9    K       _          _           1.100         8.100
10   O       _          _           3.300         4.100
11   D       _          _           5.500         6.600
12   L       _          _           5.500         7.100
13   A       _          _           8.800         9.900
14   B       _          _           9.900         8.800
15   M       _          _           fall          6.100
16   J       _          _           fall          9.100
`);
      });


      /* test Final Round race results
       *
       * TODO: ensure there is no difference between how the winner of the race for 1st is decided and how
       * the winner of other races in the Final round are decided.
       *
       * test wildcard beats false start
       * test wc beats -
       * test time beats fall
       * test time beats -
       */
      test("race results #1", ()=>{
        withStartlist(`
A
B
C
D
`);

        resultsAre('Qualifiers', `
A 2.222 C 9.999
B 4.444 D 9.999
C 1.111 A 9.999
D 3.333 B 9.999
`);
        resultsAre('Semi final', `
C fs    B wc
A -     D wc
`);

        resultsAre('Final', `
C 5.555 A fall
B -     D 5.555
`);

        generalResultsAre(`
Rank Climber Final  Semi-final  Qual
1    D       5.555  wc          3.333
2    B       -      wc          4.444
3    C       5.555  fs          1.111
4    A       fall   -           2.222
`);
      });


      /* test Final Round race results
       *
       * test faster time beats slower time
       * test equal time ties with equal time
       * test fall ties with fall
       * test time beats fs
       * test fall beats fs
       * test race ties are broken by Qual ranking, then additional attempts
       *
       * TODO: IFSC Rules do not currently state what to do if *both* competitors fail to
       * report. Once the Rules do address this, update Piki. In the meantime, Piki treats - vs - as
       * a tie.
       */
      test("race ties", ()=>{
        withStartlist(`
A
B
C
D
E
F
G
H
`);

        resultsAre('Qualifiers', `
A 5.555 E 9.991
B 5.555 F 9.991
C 5.555 G 9.991
D 5.555 H 9.991
E 5.555 A 9.999
F 5.555 B 9.991
G 5.559 C 9.991
H 5.555 D 9.991
`);

        resultsAre('Quarter final', `
H 5.555 G 5.555
B 5.551 C 5.555
D fall  A fall
F wc    E -
`);

        resultsAre('Semi final', `
H fs    B fs
D -     F -
`, 'tiebreak');

        tiebreaksAre('Semi final', 1, `
H fall  B fall
D 5.551 F 5.559
`, 'tiebreak');

        tiebreaksAre('Semi final', 2, `
H 5.555 B fall
`);

        resultsAre('Final', `
B -     F fs
H fall  D 5.555
        `);

        generalResultsAre(`
Rank Climber Final  Semi-final 1/4-final Qual
1    D       5.555  -          fall      5.555
2    H       fall   fs         5.555     5.555
3    F       fs     -          wc        5.555
4    B       -      fs         5.551     5.555
5    C       _      _          5.555     5.555
6    G       _      _          5.555     5.559
7    E       _      _          -         5.555
8    A       _      _          fall      5.555
`);
      });

      /* test Final Round race results:
       * test wildcard beats fall
       * test wildcard beats time
       * test fs beats -
       * test fall beats -
       *
       */

      test("race results #2", ()=>{
        withStartlist(`
A
B
C
D
`);

        resultsAre('Qualifiers',`
A 1.1   C 9.9
B 2.2   D 9.9
C 3.3   A 9.9
D 4.4   B 9.9
`);

        resultsAre('Semi final', `
A fall  D wc
B 4.4   C wc
`);

        resultsAre('Final', `
A fs    B -
D fall  C -
`);

        generalResultsAre(`
Rank Climber Final  Semi-final  Qual
1    D       fall   wc          4.400
2    C       -      wc          3.300
3    A       fs     fall        1.100
4    B       -      4.400       2.200
`);
      });

      /* test Final Round race results:
       * When climbers are tied in a race in the final and tied in
       * the qual round but had rerun in the qual to qualify for the quota, that rerun should not be
       * used to separate the tie in the final (9.17B)
       *
       */

      test("race results #3", ()=>{
        withStartlist(`
A
B
C
D
E
`);

        resultsAre('Qualifiers',`
A 3.3   D 9.9
B 3.3   E 9.9
C 3.3   A 9.9
D 3.3   B 9.9
E 3.3   C 9.9
`, 'tiebreak');

        tiebreaksAre('Qualifiers', 1, `
A 4.4
B 3.3
C 1.1
D 2.2
E 5.5
`);

        resultsAre('Semi final', `
D fall  A fall
B 4.4   C 4.4
`, 'tiebreak');

        tiebreaksAre('Semi final', 1, `
D 3.3   A 2.2
B 2.2   C 8.8
`);

        resultsAre('Final', `
D 3.3   C fall
A fs    B wc
`);

        generalResultsAre(`
Rank Climber Final  Semi-final  Qual
1    B       wc     4.400       3.300
2    A       fs     fall        3.300
3    D       3.300  fall        3.300
4    C       fall   4.400       3.300
`);
      });


      /* TODO: invalid combinations of scores in races in the Final round
       * fs vs fs (race should be rerun, rule 9.12-A2b)
       * wc vs wc
       */

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
      user = Factory.createUser('admin');
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

        res[2].setSpeedScore({time: 5000, attempt: 1});

        assert.dom('tbody>tr:first-child', tr =>{
          assert.dom('td.rank', '1');
          assert.dom('td.climber .name', 'Climber 3');
          assert.dom('td.score', '5.000');
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
        assert.dom('.nextStage>.info', 'Break ties by further attempts on Lane A.');

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
        assert.dom('.nextStage>.info', 'Break ties by further attempts on Lane A.');


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

      test("qual no final", ()=>{
        const res = []; createResults(res, 3);

        goto('startlists', 0);

        TH.click('.nextStage>button');
        TH.confirm();

        assert.equals(event.heats, {[cat._id]: 'SC'});
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

        assert.dom('.nextStage>.info', 'All scores must be entered.');

        assert.equals(event.heats, {[cat._id]: 'S'});


        res[0].$updatePartial('scores', [1, [6763, 7503]]);

        TH.click('.nextStage>button');
        TH.confirm();
        assert.calledWith(Route.gotoPage, EventCategory, m(
          o => assert.specificAttributes(o, {
            eventId: event._id, append: cat._id, search: '?type=results&heat=0'})));

        assert.equals(event.heats, {[cat._id]: 'SC'});

        TH.click('.reopen>button');
        TH.confirm();
        createResults(res, 8);
        TH.click('.nextStage>button');
        TH.confirm();
        assert.equals(event.heats, {[cat._id]: 'S3'});

        TH.click('.reopen>button');
        TH.confirm();
        createResults(res, 8);
        TH.click('.nextStage>button');
        TH.confirm();
        assert.equals(event.heats, {[cat._id]: 'S4'});
      });
    });

    test("click to enter scores", ()=>{
      TH.loginAs(Factory.createUser('admin'));
      event.$updatePartial('heats', [cat._id, 'S']);
      const res = {};
      createResults(res, {
        r1: [0.31, [6001, 7000]],
        r2: [0.21, [6102, 7000]],
        r3: [0.41, [6204, 7000]],
        r4: [0.61, [6308, 7000]],
      });

      goto('results', 0);

      spy(Route, 'gotoPage');

      assert.dom('#Event .Speed .quals', list =>{
        assert.dom('.score', 6.001, elm =>{
          TH.click(elm);
          assert.calledWith(Route.gotoPage, EventCategory);
        });
      });
      assert.dom('#Event .Speed .ABList', list =>{
        assert.dom('input', {value: "6.001"});
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
            assert.dom('.score', '6.001');
          });
          assert.dom('tr:nth-child(16)', tr =>{
            assert.dom('.climber .name', 'climber_r18');
            assert.dom('.score', '6.808');
          });
          assert.dom('tr:nth-child(19)', tr =>{
            assert.dom('.climber .name', 'climber_r19');
            assert.dom('.score', '7.016');
          });
        });

        event.$updatePartial('heats', [cat._id, 'S4']);
        assert.dom('thead th', {count: 4});

        res.r10.$updatePartial('scores', ['5', {opponent_id: 'r8', time: 6891}]);
        res.r8.$updatePartial('scores', ['5', {opponent_id: 'r10', time: 6247}]);

        assert.dom('tbody>tr:nth-child(1)', tr =>{
          assert.dom('.climber .name', 'climber_r8');
          assert.dom('.score:nth-child(3)', '6.247');
          assert.dom('.score:last-child', '6.808');
        });
        assert.dom('tbody>tr:nth-child(2)', tr =>{
          assert.dom('.climber .name', 'climber_r10');
          assert.dom('.score:nth-child(3)', '6.891');
          assert.dom('.score:last-child', '6.001');
        });
      });

      TH.click('.score:last-child', '6.808');
      assert.dom('#Event .Speed .quals');
      goto('results', -1);

      TH.click('.score', '6.891');
      assert.dom('#Event .Speed .ABList .score', '6.891');
    });

    test("selectHeat", ()=>{
      event.$updatePartial('heats', [cat._id, 'S4321']);

      TH.loginAs(Factory.createUser('judge'));
      goto('results', -1);

      stub(Route, 'gotoPage');
      TH.selectMenu('#Event [name=selectHeat]', 0, elm =>{
        assert.domParent('li', {data: m.field('_id', -1), text: 'General'});
        assert.domParent('li', {data: m.field('_id', 2), text: 'Semi-final'});
        TH.click(elm);
      });

      assert.calledWith(Route.gotoPage, Dom.tpl.Event.Category, {
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
          assert.dom('td.climber:first-child .name', 'Climber 2');
          assert.dom('td.climber:last-child .name', 'Climber 3');
        });

        assert.dom('tbody>tr:last-child', tr =>{
          assert.dom('td.climber:first-child .name', 'Climber 3');
          assert.dom('td.climber:last-child .name', 'Climber 1');
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
