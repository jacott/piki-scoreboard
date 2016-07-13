isClient && define(function (require, exports, module) {
  var test, v;
  const session  = require('koru/session');
  const Route    = require('koru/ui/route');
  const App      = require('ui/app');
  const EventTpl = require('ui/event');
  const sut      = require('./series');
  const TH       = require('./test-helper');

  TH.testCase(module, {
    setUp() {
      test = this;
      v = {};
      v.org =  TH.Factory.createOrg();
      TH.login();
      TH.setOrg(v.org);
      v.series = TH.Factory.createSeries();
      v.ev1 = TH.Factory.createEvent({_id: 'ev1', series_id: v.series._id, date: '2015-01-01'});
      v.ev2 = TH.Factory.createEvent({_id: 'ev2', series_id: v.series._id, date: '2015-05-01'});
      v.evOther = TH.Factory.createEvent();
    },

    tearDown() {
      EventTpl.stop();
      TH.tearDown();
      v = null;
    },

    "test events list"() {
      Route.gotoPage(sut, {seriesId: v.series._id});
      assert.dom('#Series', function () {
        assert.dom('.tabbed.list', function () {
          assert.dom('.tabNames', function () {
            assert.dom('button.selected.tab[name=events]', 'Events');
            assert.dom('.tab.selected', {count: 1});
          });
          assert.dom('.tabBody', function () {
            assert.dom('.Events table.select', function () {
              assert.dom('thead>tr>th', 'Name');
              assert.dom('thead>tr>th', 'Start Date');
              assert.dom('tbody', function () {
                assert.dom('tr', {count: 2});
                test.stub(App, 'subscribe');
                TH.click('tr:last-child>td', v.ev1.displayName);
              });
            });
          });
        });
      });
      assert.calledWith(App.subscribe, 'Event', 'ev1');
      assert.dom('#Event');
    },

    "test switching tabs"() {
      Route.gotoPage(sut, {seriesId: v.series._id});
      assert.same(Route.currentHref, `/#SN1/series/${v.series._id}/events`);
      assert.dom('#Series', function () {
        assert.dom('.tabbed.list .tabNames', function () {

          test.stub(session, 'rpc').yields();
          TH.click('.tab[name=results]');
        });
        assert.same(Route.currentHref, `/#SN1/series/${v.series._id}/results`);
        assert.dom('.tabBody #Results');
      });

      Route.gotoPage();
      refute.dom('#Series');
    },

    "test results"() {
      v.cats = [
        TH.Factory.createCategory({type: 'B'}),
        ...TH.Factory.createList(3, 'createCategory'),
        ];
      v.results = [{
        event_id: 'ev1',
        cats: v.cats.map(cat => {
          return {
            category_id: cat._id,
            results: [],
          };
        }),
      }];
      test.stub(session, 'rpc');
      Route.gotoPage(sut.Results, {seriesId: v.series._id});

      assert.dom('#Series', function () {
        refute.dom('.CatResult:first-child');

        assert.dom('.tabbed.list', function () {
          assert.dom('.tabNames', function () {
            assert.dom('button.selected.tab[name=results]', 'Results');
            assert.dom('.tab.selected', {count: 1});
          });
          assert.dom('.tabBody', function () {
            assert.dom('#Results.loading', function () {
              assert.calledWith(session.rpc, 'Series.results', v.series._id, TH.match.func);
              session.rpc.yield(null, v.results);
              refute.className(this, 'loading');
              assert.same(Route.currentHref, `/#SN1/series/${v.series._id}/results`);
              assert.dom('table.categories', function () {
                assert.dom('tr:first-child.heading.fmt.B>td[colspan="2"]');
                assert.dom('tr', {count: 6});
                assert.dom('tr.cat', {count: 4});
                assert.dom('tr.heading.fmt.L>td[colspan="2"]');
                assert.dom('tr.cat', TH.match.field('_id', v.cats[0]._id), function () {
                  TH.click('td', v.cats[0].name);
                });
              });
            });
          });
        });
        assert.dom('.CatResult:first-child');
      });
    },

    "test cat results"() {
      let cl1 = TH.Factory.createClimber({_id: 'cl1'});
      let cl2 = TH.Factory.createClimber({_id: 'cl2'});
      let cl3 = TH.Factory.createClimber({_id: 'cl3'});
      let cat1 = TH.Factory.createCategory({_id: 'cat1', type: 'B'});
      let cat2 = TH.Factory.createCategory({_id: 'cat2', type: 'L'});
      v.results = [{
        event_id: 'ev1',
        cats: [{
          category_id: 'cat1',
          results: [['cl1', 100], ['cl2', 80], ['cl3', 65]]
        }, {
          category_id: 'cat2',
          results: [['cl2', 100], ['cl1', 80], ['cl3', 65]]
        }],
      }, {
        event_id: 'ev2',
        cats: [{
          category_id: 'cat1',
          results: [['cl3', 100], ['cl1', 15]]
        }],
      }];

      test.stub(session, 'rpc').withArgs('Series.results', v.series._id).yields(null, v.results);

      Route.gotoPage(sut.CatResult, {seriesId: v.series._id, append: 'cat1'});

      assert.dom('#Series', function () {
        assert.dom('.CatResult:first-child', function () {
          assert.dom('table.list>thead', function () {
            assert.dom('th.event', v.ev2.name);
            assert.dom('th.event+th.event', v.ev1.name);
          });
          assert.dom('table.list>tbody', function () {
            assert.dom('tr:first-child', function () {
              assert.dom('td.name', cl3.name);
              assert.dom('td.total', '165');
              assert.dom('td.event', '100');
              assert.dom('td.event+td.event', '65');
            });
            assert.dom('tr:last-child:nth-child(3)', function () {
              assert.dom('td.name', cl2.name);
              assert.dom('td.total', '80');
              assert.dom('td.event', '');
              assert.dom('td.event+td.event', '80');
            });
          });
        });

        Route.gotoPage(sut.CatList, {seriesId: v.series._id});
        refute.dom('.CatResult');
      });
    },
  });
});
