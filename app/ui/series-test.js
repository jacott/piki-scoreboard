isClient && define(function (require, exports, module) {
  var test, v;
  const Dom             = require('koru/dom');
  const session         = require('koru/session');
  const Route           = require('koru/ui/route');
  const sut             = require('./series');
  const TH              = require('./test-helper');
  const Event           = require('models/event');
  const EventSub        = require('pubsub/event-sub');
  const Factory         = require('test/factory');
  const EventTpl        = require('ui/event');
  const TeamHelper      = require('ui/team-helper');

  const {stub, spy, onEnd} = TH;

  TH.testCase(module, ({beforeEach, afterEach, group, test}) => {
    let org, series, ev1, ev2, evOther;
    beforeEach(() => {
      TH.startTransaction();
      org = Factory.createOrg();
      TH.login();
      TH.setOrg(org);
      series = Factory.createSeries();
      ev1 = Factory.createEvent({_id: 'ev1', series_id: series._id, date: '2015-01-01'});
      ev2 = Factory.createEvent({_id: 'ev2', series_id: series._id, date: '2015-05-01'});
      evOther = Factory.createEvent();
    });

    afterEach(() => {
      TeamHelper.teamType_id = null;
      EventTpl.stop();
      TH.domTearDown();
      v = null;
      TH.rollbackTransaction();
    });

    test('edit series', () => {
      Route.gotoPage(sut.Events, {seriesId: series._id});
      assert.dom('#Series', function () {
        assert.dom('.tabbed.list', function () {
          assert.dom('.tabNames', function () {
            TH.click('button.adminAccess.tab[name=Edit]', 'Edit');
          });
        });
        assert.dom('#Edit', function () {
          TH.input('[name=name]', 'new name');
          spy(Dom, 'setTitle');
          TH.click('[type=submit]');
          assert.calledWith(Dom.setTitle, 'new name');
        });
        assert.same(series.$reload().name, 'new name');

        refute.dom('#Edit');
      });
    });

    test('add event', () => {
      const tt1 = Factory.createTeamType({_id: 'tt1'});
      series.$update({teamType_ids: ['tt1']});
      Route.gotoPage(sut.Events, {seriesId: series._id});
      assert.dom('#Series', function () {
        TH.click('[name=addEvent]');
      });
      assert.dom('#AddEvent', function () {
        TH.input('[name=name]', 'my new event');
        TH.input('[name=date]', '2016-10-05');
        TH.click('[type=submit]');
      });
      refute.dom('#AddEvent');

      const event = Event.findBy('name', 'my new event');
      assert(event);

      assert.same(event.date, '2016-10-05');
      assert.same(event.org_id, series.org_id);
      assert.same(event.series_id, series._id);
      assert.equals(event.teamType_ids, ['tt1']);
    });

    test('events list', () => {
      Route.gotoPage(sut.Events, {seriesId: series._id});
      assert.dom('#Series', function () {
        assert.dom('.tabbed.list', function () {
          assert.dom('.tabNames', function () {
            assert.dom('button.selected.tab[name=Events]', 'Events');
            assert.dom('.tab.selected', {count: 1});
          });
          assert.dom('#SeriesBody.tabBody', function () {
            assert.dom('.Events table.select', function () {
              assert.dom('thead>tr>th', 'Name');
              assert.dom('thead>tr>th', 'Start Date');
              assert.dom('tbody', function () {
                assert.dom('tr', {count: 2});
                stub(EventSub, 'subscribe');
                TH.click('tr:last-child>td', ev1.displayName);
              });
            });
          });
        });
      });
      assert.calledWith(EventSub.subscribe, 'ev1');
      assert.dom('#Event');
    });

    test('switching tabs', () => {
      Route.gotoPage(sut.Events, {seriesId: series._id});
      assert.same(Route.currentHref, `/#series/${series._id}/events`);
      assert.dom('#Series', function () {
        assert.dom('.tabbed.list .tabNames', function () {
          stub(session, 'rpc').yields();
          TH.click('.tab[name=Results]');
        });
        assert.same(Route.currentHref, `/#SN1/series/${series._id}/results`);
        assert.dom('.tabBody #Results');
      });

      Route.gotoPage();
      refute.dom('#Series');
    });

    test('results', () => {
      const cats = [
        Factory.createCategory({type: 'B'}),
        ...Factory.createList(3, 'createCategory'),
      ];
      const results = [{
        event_id: 'ev1',
        cats: cats.map((cat) => {
          return {
            category_id: cat._id,
            results: [],
          };
        }),
      }];
      stub(session, 'rpc');
      Route.gotoPage(sut.Results, {seriesId: series._id});

      assert.dom('#Series', function () {
        refute.dom('.CatResult:first-child');

        assert.dom('.tabbed.list', function () {
          assert.dom('.tabNames', function () {
            assert.dom('button.selected.tab[name=Results]', 'Individual Results');
            assert.dom('.tab.selected', {count: 1});
          });
          assert.dom('.tabBody', function () {
            assert.dom('#Results.loading', function () {
              assert.calledWith(session.rpc, 'Ranking.seriesResult', series._id, TH.match.func);
              session.rpc.yield(null, results);
              refute.className(this, 'loading');
              assert.same(Route.currentHref, `/#series/${series._id}/results`);
              assert.dom('table.categories', function () {
                assert.dom('tr:first-child.heading.fmt.B>td[colspan="2"]');
                assert.dom('tr', {count: 6});
                assert.dom('tr.cat', {count: 4});
                assert.dom('tr.heading.fmt.L>td[colspan="2"]');
                assert.dom('tr.cat', TH.match.field('_id', cats[0]._id), function () {
                  TH.click('td', cats[0].name);
                });
              });
            });
          });
        });
        assert.dom('.CatResult:first-child');
      });
    });

    test('cat results', () => {
      const cl1 = Factory.createClimber({_id: 'cl1'});
      const cl2 = Factory.createClimber({_id: 'cl2'});
      const cl3 = Factory.createClimber({_id: 'cl3'});
      const cat1 = Factory.createCategory({_id: 'cat1', type: 'B'});
      const cat2 = Factory.createCategory({_id: 'cat2', type: 'L'});
      const results = [{
        event_id: 'ev1',
        cats: [{
          category_id: 'cat1',
          results: [['cl1', 100], ['cl2', 80], ['cl3', 65]],
        }, {
          category_id: 'cat2',
          results: [['cl2', 100], ['cl1', 80], ['cl3', 65]],
        }],
      }, {
        event_id: 'ev2',
        cats: [{
          category_id: 'cat1',
          results: [['cl3', 100], ['cl1', 15]],
        }],
      }];

      stub(session, 'rpc').withArgs('Ranking.seriesResult', series._id).yields(null, results);

      Route.gotoPage(sut.CatResult, {seriesId: series._id, append: 'cat1'});

      assert.dom('#Series', function () {
        assert.dom('.CatResult h1', cat1.name);
        assert.dom('.CatResult:first-child', function () {
          assert.dom('table.list>thead', function () {
            assert.dom('th.event', ev2.name);
            assert.dom('th.event+th.event', ev1.name);
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

        Route.gotoPage(sut.CatList, {seriesId: series._id});
        refute.dom('.CatResult');
      });
    });

    test('team results', () => {
      const tt1 = Factory.createTeamType({_id: 'tt1'});
      const tOther = Factory.createTeam({_id: 'tOther'});
      const tt2 = Factory.createTeamType({_id: 'tt2'});
      TeamHelper.teamType_id = tt2._id;
      const teams = Factory.createList(3, 'createTeam',
                                       (index, options) => options._id = 'team' + index);
      const tt3 = Factory.createTeamType({_id: 'tt3'});
      series.$update('teamType_ids', ['tt1', 'tt2']);
      const results = [{
        event_id: 'ev1',
        scores: {tt2: {team1: 900, team0: 400}},
      }, {
        event_id: 'ev2',
        scores: {tt2: {team0: 300}, tt1: {tOther: 200}},
      }];

      const rpc = stub(session, 'rpc').withArgs('Ranking.teamResults', series._id);

      spy(TeamHelper, 'setSeriesTeamType');
      Route.gotoPage(sut, {seriesId: series._id});
      assert.calledWith(TeamHelper.setSeriesTeamType, TH.matchModel(series));

      assert.dom('#Series', function () {
        assert.dom('button.selected.tab[name=TeamResults]', 'Team Results');
        assert.dom('.tab.selected', {count: 1});

        assert.dom('#TeamResults table.list', function () {
          assert.dom('thead', function () {
            assert.dom('th.name', function () {
              assert.dom('span', tt2.name);
              assert.dom('[name=selectTeamType]');
            });
            refute.dom('th.event');
            rpc.yield(null, results);
            assert.dom('th.event', ev2.name);
            assert.dom('th.event+th.event', ev1.name);
          });
          assert.dom('tbody', function () {
            assert.dom('tr', {count: 2});
            assert.dom('tr:first-child', function () {
              assert.dom('td.name', teams[1].name);
              assert.dom('td.total', '900');
              assert.dom('td.event', '');
              assert.dom('td.event+td.event', '900');
            });
            assert.dom('tr:last-child', function () {
              assert.dom('td.name', teams[0].name);
              assert.dom('td.total', '700');
              assert.dom('td.event', '300');
              assert.dom('td.event+td.event', '400');
            });
          });

          TH.selectMenu('[name=selectTeamType]', 'tt1', function () {
            assert.dom(this.parentNode, function () {
              assert.dom('li', {count: 2});
              assert.dom('li+li', tt2.name);
            });
            TH.click(this);
          });

          assert.dom('th.name>span', tt1.name);

          assert.dom('tbody', function () {
            assert.dom('tr', {count: 1});
            assert.dom('tr:first-child', function () {
              assert.dom('td.name', tOther.name);
              assert.dom('td.total', '200');
              assert.dom('td.event', '200');
              assert.dom('td.event+td.event', '');
            });
          });

          stub(Route, 'gotoPage');
          TH.click('thead>tr>th.event', ev2.name);
          assert.calledWith(Route.gotoPage, Dom.tpl.Event.Show, {eventId: ev2._id});
        });
      });
    });
  });
});
