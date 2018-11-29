isClient && define((require, exports, module)=>{
  const Dom             = require('koru/dom');
  const Route           = require('koru/ui/route');
  const util            = require('koru/util');
  const Result          = require('models/result');
  const User            = require('models/user');
  const Factory         = require('test/factory');
  const App             = require('ui/app');
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
        assert.dom('.nextStage>.info', /Ties need to be broken/);
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
      assert.dom('#Event .Speed', ()=>{
        assert.dom('.selectedHeat', stageName+' - Start list');
        let i = 0;
        assert.dom('table.results>tbody', ()=>{
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
      });

    };

    const tiebreaksAre = (stageName, attempt, results, tiebreak)=>{
      assert.dom('#Event .Speed', elm =>{
        assert.dom('.selectedHeat', stageName+' - Start list');
        for (const row of results.split('\n')) {
          if (row === '') continue;
          const parts = row.split(/\s+/);
          assert.dom('td:first-child.climber .name', {text: parts[0], parent: p =>{
            assert.domParent(`td:nth-child(2) input[data-attempt="${attempt}"]`, input =>{
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

    const generalResultsAre = (results)=>{
      goto('results', -1);
      assert.dom('#Event .Speed', ()=>{
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
      });
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

    group("scenarios", ()=>{

      // TODO IFSC Rules do not address what rank to give to H, a registered competitor
      // who does not climb at all. Lisia interprets this silence as meaning that H should have no
      // rank in the competition - exactly as if H was not registered. Currently Piki gives H
      // a rank lower than all other competitors.
      test("qual scores", ()=>{
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
`);
        resultsAre('Qualifiers', `
A 3.333 H -
B 4.444 I fs
C 2.222 J fs
D -     K 6.666
E 5.555 L 8.888
F fall  M 4.444
G fall  N -

H -     A 8.888
I fall  B 1.111
J fs    C fall
K 9.999 D 5.555
L 6.661 E fs
M 4.444 F fall
N fs    G -
`);
        generalResultsAre(`
Rank Climber Semi-final Qual
1    B       _          1.11
2    C       _          2.22
3    A       _          3.33
4    M       _          4.44
5    D       _          5.55
6    K       _          6.66
6    L       _          6.66
8    J       _          false_start
8    N       _          false_start
8    G       _          fall
8    I       _          false_start
8    F       _          fall
8    E       _          false_start
14   H       _          _
`);
            });

      // test placement in stages of final
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
Rank Climber Final Semi-final Qual
1    C       2.22  7.77       2.22
2    E       9.99  1.11       5.55
3    F       1.11  9.99       4.44
4    D       8.88  9.99       1.11
5    B       _     _          8.88
6    G       _     _          fall
6    A       _     _          false_start
`);
      });

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
Rank Climber Final Semi-final 1/4-final    Qual
1    N       _     3.30       wc           5.10
2    E       _     1.10       8.80         5.50
3    G       _     3.30       1.10         3.30
4    P       _     4.40       8.80         3.10
5    O       _     _          8.80         4.10
6    I       _     _          9.90         1.10
7    H       _     _          fs           2.20
8    F       _     _          fall         4.40
9    M       _     _          _            6.10
10   D       _     _          _            6.60
11   L       _     _          _            7.10
12   C       _     _          _            7.70
13   K       _     _          _            8.10
14   B       _     _          _            8.80
15   A       _     _          _            9.00
16   J       _     _          _            false_start

`);
      });

      // test placement in stages of final
      // test the relative overall rank of competitors eliminated and tied in 1/4-final,
      // at least one of whom has wildcard in prev stage
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

        resultsAre('Round of 16', `
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
Rank Climber Semi-final 1/4-final  Round_of_16  Qual
1    H       _          2.20       1.10         2.20
2    P       _          4.40       8.80         3.10
3    M       _          3.30       6.60         6.10
4    C       _          1.10       2.20         7.70
5    I       _          9.90       fall         1.10
6    G       _          9.90       wc           3.30
7    D       _          9.90       wc           6.60
8    L       _          9.90       5.50         7.10
9    O       _          _          3.30         4.10
10   F       _          _          6.60         4.40
11   E       _          _          7.70         5.50
12   B       _          _          9.90         8.80
13   N       _          _          fs           5.10
14   K       _          _          fs           8.10
15   J       _          _          fall         9.10
16   A       _          _          fall         9.90
`);
      });


      // TODO: WRT repeat Qual, find out from IFSC whether and how slower times should be used
      // to break ties; whether and how 1/1000th precision should be used
      // to break ties.

      // test repeat Qual, including:
      // Rank in event decided by competitor's fastest time in Repeat to 1/1000th second.
      // Tiebreak procedure for competitors tied for medal place:
      // 1. Compare slower times in repeat to 1/1000th second;
      // 2. Compare faster times in first Qual to 1/1000th second;
      // 3. Compare slower times in first Qual to 1/1000th second;
      // 4. Tiebreak attempts on Lane A.

      // TODO: figure out why steps 1 and 2 above are not happening in "repeat Quals ties" test (competitors
      // B and C) but are happening in "repeat Quals more ties" test (competitors G and B)

      // Tiebreak procedure for competitors tied for non-medal place:
      // 1. Compare slower times in repeat to 1/1000th second.
      // 2. Compare faster times in first Qual to 1/100th second.
      // 3. Remaining ties remain.
      test("// repeat Qual ties", ()=>{
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

        resultsAre('Final', `
A 5.551  C 9.999
B 5.555  D 9.991
C 5.555  A 9.999
D 5.555  B 9.999
`);

//         tiebreaksAre('Final', 1, `
// B 1.11
// C 9.99
// `);

        generalResultsAre(`
Rank Climber Final       Qual
1    A       5.55        fall
2    D       5.55        fall
3    B       5.55        5.55
4    C       5.55        5.55
`);
      });


      test("repeat Qual more ties", ()=>{
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
A fall  E fall
B 5.555 F fall
C fall  G 9.991
D fall  A fall
E fall  B 9.999
F fall  C fall
G 5.555 D fall
`);

        resultsAre('Final', `
A 3.331 E 9.99
B 1.11  F 9.99
C 3.333 G 9.99
D 3.333 A 9.99
E 2.222 B 9.99
F 2.222 C 8.881
G 1.11  D 8.888
`, 'tiebreak');

        tiebreaksAre('Final', 1, `
E 5.555
F 5.551
`);

        generalResultsAre(`
Rank Climber Final       Qual
1    G       1.11        5.55
2    B       1.11        5.55
3    F       2.22        fall
4    E       2.22        fall
5    A       3.33        fall
6    C       3.33        fall
7    D       3.33        fall
`);
      });


      test("repeat Qual even more ties", ()=>{
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
A 5.555 E fall
B fall  F 8.88
C 5.51  G fall
D fall  A 6.66
E fall  B fall
F 5.551 C 9.99
G fall  D fall
`);

        resultsAre('Final', `
A fall  E fall
B 3.33  F fall
C fall  G fall
D 2.22  A fall
E 4.44  B fall
F fall  C fall
G 1.11  D fall
`);

        generalResultsAre(`
Rank Climber Final       Qual
1    G       1.11        fall
2    D       2.22        fall
3    B       3.33        fall
4    E       4.44        fall
5    C       fall        5.51
6    A       fall        5.55
6    F       fall        5.55
`);
      });


      // test rankings in Qual when there is a tie for the quota for final
      test("quota tie ms precision", ()=>{
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
B 5.551 F 4.444
C 2.222 G -
D -     A fs
E 5.555 B 8.888
F fall  C 8.888
G fall  D 1.111
`);

        generalResultsAre(`
Rank Climber Semi-final Qual
1    D       _          1.11
2    C       _          2.22
3    F       _          4.44
4    B       _          5.55
5    E       _          5.55
6    G       _          fall
6    A       _          false_start
`);
      });

      test("quota tie slower time", ()=>{
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
A 3.333 E 8.889
B 5.555 F 4.444
C 2.222 G -
D -     A fs
E 5.555 B 8.888
F fall  C 8.888
G 5.559 D 1.111
`);

        generalResultsAre(`
Rank Climber Semi-final Qual
1    D       _          1.11
2    C       _          2.22
3    F       _          4.44
4    B       _          5.55
5    G       _          5.55
5    E       _          5.55
7    A       _          false_start
`);
      });

      test("quota tie add attempts", ()=>{
        withStartlist(`
Ron
Hermione
Ginny
Luna
Harry
`);

        resultsAre('Qualifiers', `
Ron 9.876 Luna 9.876
Hermione 9.876 Harry 9.876
Ginny 9.876 Ron 9.876
Luna 9.876 Hermione 9.876
Harry 9.876 Ginny 9.876
`, 'tiebreak');

        tiebreaksAre('Qualifiers', 1, `
Ron 9.8
Hermione 9.8
Ginny 9.7
Luna 9.6
Harry 9.7
`, 'tiebreak');

        tiebreaksAre('Qualifiers', 2, `
Ron 9.8
Hermione 9.7
`);

        generalResultsAre(`
Rank Climber   Semi-final Qual
1    Ginny        _       9.87
1    Hermione     _       9.87
1    Luna         _       9.87
1    Harry        _       9.87
5    Ron          _       9.87
`);
      });


      // test random placement in 1st stage of final of competitors tied in Qual
      test("rand placement", ()=>{
        withStartlist(`
A
B
C
D
E
`);
        resultsAre('Qualifiers', `
A 3.334 D 3.333
B 3.333 E 3.331
C 3.332 A 8.888
D fs    B 8.888
E 8.888 C 8.888
`);

        resultsAre('Semi final', `
B 4.444 E 1.111
C 4.444 A 1.111
`);

        generalResultsAre(`
Rank Climber Final Semi-final Qual
1    A       _     1.11       3.33
1    E       _     1.11       3.33
3    C       _     4.44       3.33
3    B       _     4.44       3.33
5    D       _      _         false_start
`);
      });


      // test relative overall rank of competitors eliminated and not tied
      // in a stage of Final Round
      // faster beats slower beats {fall/fs} beats -
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

        resultsAre('Round of 16', `
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
Rank Climber 1/4-final  Round_of_16  Qual
1    I       _          1.10         1.10
2    H       _          1.10         2.20
3    O       _          wc           4.10
4    F       _          wc           4.40
5    M       _          1.10         6.10
6    D       _          1.10         6.60
7    K       _          1.10         8.10
8    B       _          1.10         8.80
9    G       _          2.22         3.30
10   P       _          2.22         3.10
11   A       _          2.22         9.90
12   E       _          2.22         5.50
13   N       _          fall         5.10
14   L       _          fs           7.10
15   J       _          fall         9.10
16   C       _          -            7.70
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

        resultsAre('Round of 16', `
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
Rank Climber Semi-final 1/4-final  Round_of_16  Qual
1    H       _          2.20       1.10         2.20
2    P       _          4.40       8.80         3.10
3    E       _          3.30       4.40         5.50
4    C       _          1.10       2.20         7.70
5    I       _          9.90       fall         1.10
6    G       _          9.90       fs           3.30
7    F       _          9.90       fall         4.40
8    N       _          9.90       fs           5.10
9    O       _          _          3.30         4.10
10   B       _          _          9.90         8.80
11   M       _          _          fall         6.10
12   D       _          _          fs           6.60
13   L       _          _          fall         7.10
14   K       _          _          fs           8.10
15   J       _          _          fall         9.10
16   A       _          _          fall         9.90
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

        resultsAre('Round of 16', `
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
Rank Climber Semi-final 1/4-final  Round_of_16  Qual
1    H       _          2.20       1.10         2.20
2    P       _          4.40       8.80         3.10
3    E       _          3.30       4.40         5.50
4    C       _          1.10       2.20         7.70
5    G       _          9.90       1.10         3.30
6    F       _          9.90       5.50         4.40
7    N       _          9.90       5.50         5.10
8    I       _          9.90       8.80         1.10
9    K       _          _          1.10         8.10
10   O       _          _          3.30         4.10
11   D       _          _          5.50         6.60
12   L       _          _          5.50         7.10
13   A       _          _          8.80         9.90
14   B       _          _          9.90         8.80
15   M       _          _          fall         6.10
16   J       _          _          fall         9.10
`);
      });


      // test Final Round race results:
      // test wildcard beats false start
      // test fall beats - (faller gets a wildcard)
      // test time beats -
      // test time beats fall
      test("race results", ()=>{
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
A -     D fall
`);

        resultsAre('Final', `
C 5.555 A -
B fall  D 5.555
`);

        generalResultsAre(`
Rank Climber Final Semi-final Qual
1    D       5.55  fall       3.33
2    B       fall  wc         4.44
3    C       5.55  fs         1.11
4    A       -     -       2.22
`);
      });

      // test Final Round race results:
      // test faster time beats slower time
      // test equal time ties with equal time
      // test fall ties with fall
      // test wc beats -
      // test false start beats - (false starter gets a wildcard)
      // test false start ties with false start
      // test - ties with -
      // test ties are broken by Qual valid faster time, then Qual slower time,
      // then additional attempts
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
H 5.555 E 5.551
G 5.555 B 5.555
D fall  A fall
F wc    C -
`);

        resultsAre('Semi final', `
E fs    B fs
D -     F -
`, 'tiebreak');

        tiebreaksAre('Semi final', 1, `
E fall  B fall
D 5.551 F 5.559
`, 'tiebreak');

        tiebreaksAre('Semi final', 2, `
E 5.555 B fall
`);

        resultsAre('Final', `
B -     F fs
E fall  D 5.555
        `);

        generalResultsAre(`
Rank Climber Final Semi-final 1/4-final Qual
1    D       5.55  -          fall      5.55
2    E       fall  fs         5.55      5.55
3    F       fs    -          wc        5.55
4    B       -     fs         5.55      5.55
5    H       _     _          5.55      5.55
5    G       _     _          5.55      5.55
7    A       _     _          fall      5.55
8    C       _     _          -         5.55
`);
      });


      // test final race (race for 1st and 2nd): time beats fs
      // test Final Round race results:
      // wildcard beats time
      // wildcard beats fall
      test("final race time beats fs", ()=>{
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
A 4.4   D wc
B fall  C wc
`);

        resultsAre('Final', `
A 1.1   B 2.2
D 5.5   C fs
`);

        generalResultsAre(`
Rank Climber Final  Semi-final  Qual
1    D       5.50   wc          4.40
2    C       fs     wc          3.30
3    A       1.10   4.40        1.10
4    B       2.20   fall        2.20
`);
      });


      test("final race fall beats fs", ()=>{
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
A 4.4   D 2.2
B 3.3   C 1.1
`);

        resultsAre('Final', `
A 1.1   B 2.2
D fall  C fs
`);

        generalResultsAre(`
Rank Climber Final  Semi-final  Qual
1    D       fall   2.20        4.40
2    C       fs     1.10        3.30
3    A       1.10   4.40        1.10
4    B       2.20   3.30        2.20
`);
      });
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
