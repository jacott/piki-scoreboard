isClient && define(function (require, exports, module) {
  var test, v;
  const Route   = require('koru/ui/route');
  const util    = require('koru/util');
  const Climber = require('models/climber');
  const Event   = require('models/event');
  const Result  = require('models/result');
  const Series  = require('models/series');
  const App     = require('ui/app');
  const sut     = require('./event');
  require('./event-category');
  require('./event-register');
  const TH      = require('./test-helper');

  TH.testCase(module, {
    setUp() {
      test = this;
      v = {};
      v.org =  TH.Factory.createOrg();
      TH.login();
      TH.setOrg(v.org);
      v.eventSub = test.stub(App, 'subscribe').withArgs('Event').returns({stop: v.stop = test.stub()});
    },

    tearDown() {
      TH.tearDown();
      v = null;
    },

    "test event subscribing"() {
      var events = TH.Factory.createList(2, 'createEvent', function (index, options) {
        options.date = "2014/01/0"+(8-index);
      });

      Route.gotoPage(sut.Show, {eventId: events[0]._id});
      v.eventSub.yield();

      assert.calledWith(App.subscribe, 'Event', events[0]._id);

      Route.gotoPage(sut.Edit);

      refute.called(v.stop);

      App.subscribe.reset();

      Route.gotoPage(sut.Edit, {eventId: events[1]._id});

      assert.called(v.stop);

      assert.calledWith(App.subscribe, 'Event', events[1]._id);
    },

    "test rendering"() {
      var events = TH.Factory.createList(2, 'createEvent', function (index, options) {
        options.date = "2014/01/0"+(6+index);
      });

      Route.gotoPage(sut.Index);

      assert.dom('#Event', function () {
        assert.dom('button.selected.event.tab', 'Events');
        assert.dom('button:not(.selected).series.tab', 'Series');
        assert.dom('.list', function () {
          assert.dom('nav', 'Add new event');
          assert.dom('table', function () {
            assert.dom('tr>td', events[0].name, function () {
              assert.domParent('td', events[0].date);
            });
            assert.dom('tr:first-child>td', events[1].name, function () {
              assert.domParent('td', events[1].date);
            });
          });
        });
      });
    },

    "test showing series tab"() {
      var series = TH.Factory.createList(2, 'createSeries', function (index, options) {
        options.date = "2014/01/0"+(6+index);
      });
      Route.gotoPage(sut.Index, {hash: '#series'});

      assert.dom('#Event', function () {
        assert.dom('button:not(.selected).event.tab', 'Events');
        assert.dom('button.selected.series.tab', 'Series');
        assert.dom('.list', function () {
          assert.dom('nav', 'Add new series');
          assert.dom('table', function () {
            assert.dom('tr>td', series[0].name, function () {
              assert.domParent('td', series[0].date);
            });
            assert.dom('tr:first-child>td', series[1].name, function () {
              assert.domParent('td', series[1].date);
            });
          });
        });
      });
    },

    "test switching tabs"() {
      Route.gotoPage(sut.Index);

      test.spy(Route, 'replacePage');

      TH.click('button:not(.selected).series.tab');
      assert.dom('button.selected.series.tab');
      assert.calledWith(Route.replacePage, sut.Index, TH.match.field('hash', '#series'));

      Route.replacePage.reset();

      TH.click('button:not(.selected).event.tab');
      assert.dom('button.selected.event.tab');
      assert.calledWith(Route.replacePage, sut.Index, TH.match.field('hash', '#event'));
    },

    "test adding new event"() {
      let tt1 = TH.Factory.createTeamType();
      let tt2 = TH.Factory.createTeamType({default: true});
      Route.gotoPage(sut.Index);

      assert.dom('#Event', function () {
        TH.click('[name=add]');
        assert.dom('#AddEvent', function () {
          TH.input('[name=name]', 'National Cup 1 - Auckland');
          TH.input('[name=date]', '2014-03-14');
          assert.dom('.onOff[data-field=closed]');
          assert.dom('.teamTypeList', function () {
            assert.dom('li', {count: 2});
            assert.dom('li:first-child', function () {
              assert.dom('.name', tt1.name);
              refute.className(this, 'checked');
              TH.click('.check');
              assert.className(this, 'checked');
            });

            assert.dom('li:last-child', function () {
              assert.dom('.name', tt2.name);
              assert.className(this, 'checked');
              TH.click('.check');
              refute.className(this, 'checked');
            });
          });
          test.spy(Route.history, 'back');
          TH.click('[type=submit]');
        });
        assert.called(Route.history.back);
      });

      assert(Event.exists({org_id: v.org._id, name: 'National Cup 1 - Auckland', date: '2014-03-14'}));
    },

    "test adding new series"() {
      let tt1 = TH.Factory.createTeamType();
      let tt2 = TH.Factory.createTeamType({default: true});
      Route.gotoPage(sut.Index, {hash: '#series'});

      assert.dom('#Event', function () {
        TH.click('[name=add]');
        assert.dom('#AddSeries', function () {
          TH.input('[name=name]', 'National Cup Series 2015');
          TH.input('[name=date]', '2014-03-14');
          assert.dom('.onOff[data-field=closed]');
          assert.dom('.teamTypeList', function () {
            assert.dom('li', {count: 2});
            assert.dom('li:first-child', function () {
              assert.dom('.name', tt1.name);
              refute.className(this, 'checked');
              TH.click('.check');
              assert.className(this, 'checked');
            });

            assert.dom('li:last-child', function () {
              assert.dom('.name', tt2.name);
              assert.className(this, 'checked');
              TH.click('.check');
              refute.className(this, 'checked');
            });
          });

          test.spy(Route.history, 'back');
          TH.click('[type=submit]');
        });
      });

      assert.called(Route.history.back);
      let series = Series.findBy("name", 'National Cup Series 2015');
      assert(series);
      assert.same(series.org, v.org);

      // assert(Event.exists({org_id: v.org._id, name: 'National Cup 1 - Auckland', date: '2014-03-14'}));

      // assert.dom('#Event [name=add]');
    },

    "select": {
      setUp() {
        TH.login();
        v.tt = TH.Factory.createList(2, 'createTeamType');
        v.event = TH.Factory.createEvent({teamType_ids: [v.tt[0]._id]});

        v.cats = TH.Factory.createList(3, 'createCategory', function (index, options) {
          options.shortName = 'YA ' + index;
          options.name = 'Youth A ' + index;
        });
        v.c1 = TH.Factory.buildCompetitor({category_ids: [v.cats[0]._id]});
        v.c2 = TH.Factory.buildCompetitor({category_ids: [v.cats[1]._id]});
        v.c1.$$save();
        v.c2.$$save();

        v.event2 = TH.Factory.createEvent();

        Route.gotoPage(sut.Index);

        assert.dom('#Event', function () {
          TH.click('td', v.event.name);
        });

        v.eventSub.yield();
      },

      "//test team ranking"() {
        assert.dom('#Event #Show', function () {
          TH.click('.link[name=teamResults]');
        });

        assert.dom('#Event');
      },

      "test rendering"() {
        var result = Result.query.where({event_id: v.event._id, category_id: v.cats[0]._id, climber_id: v.c1.climber_id}).fetchOne();

        result.setScore(1, '13');
        result.setScore(2, '23+');
        result.setScore(3, '');

        assert.dom('#Event:not(.noEvent) .menu', function () {
          assert.dom('.link[name=register]');
          assert.dom('.link[name=edit]');
        });
        assert.dom('#Event #Show', function () {
          assert.dom('h1', v.event.name + ' - Category results');
          assert.dom('.categories', function () {
            assert.dom('.link', {text: v.cats[0].name, parent: 2}, function () {
              assert.dom('.link', {count: 3});
              assert.dom('.link', "Qual 1");
              assert.dom('.link', "Qual 2");
            });
            assert.dom('.link', {text: v.cats[1].name, parent: 2}, function () {
              assert.dom('.link', {count: 1});
            });

            TH.click('.link', "Qual 2");
          });
        });

        assert.dom('#Event .Category', function () {
          assert.dom('h1.selectedHeat', 'Qual 2 - Results');
        });

        Route.gotoPage(sut.Index);
        v.eventSub.reset();
        TH.click('td', v.event2.name);
        v.eventSub.yield();

        Route.gotoPage(sut.Index);
        v.eventSub.reset();
        TH.click('td', v.event.name);
        v.eventSub.yield();

        assert.dom('.link', "Qual 2");
      },

      "test add category"() {
        v.cats[2].$update('heatFormat', 'QQQF3F4');
        var comp = TH.Factory.buildCompetitor({event_id: v.event._id, category_ids: [v.cats[2]._id]});
        assert.dom('.categories', function () {
          refute.dom('button', 'Youth A 2');
          comp.$$save();
        });
        assert.dom('.categories', function () {
          assert.dom('td[colspan="8"]', {count: 2});
          assert.dom('[colspan="8"]', 'Format: Qualifier 1; Qualifier 2; Final (8 competitors)');
          assert.dom('[colspan="8"]', 'Format: Qualifier 1; Qualifier 2; Qualifier 3; Semi-final (3 competitors); Final (4 competitors)');
          assert.dom('.categories tr.L button', 'Youth A 2');
        });
      },

      "test selecting category"() {
        TH.click('.categories .link', v.cats[0].name);

        assert.dom('#Event .Category', function () {
          assert.dom('h1', v.cats[0].name);
        });
      },

      "test registration link"() {
        TH.click('[name=register]');

        assert.dom('body', function () {
          assert.dom('#Event #Register');
        });
      },

      "Edit": {
        setUp() {
          TH.click('[name=edit]');
        },

        "test changing format"() {
          assert.dom('.categories input[name=changeFormat]', {value: "QQF8"}, function () {
            assert.dom(this.parentNode, function () {
              assert.dom('.desc', "Qualifier 1; Qualifier 2; Final (8 competitors)");
            });
            TH.change(this, 'QQF8F2');
            assert.dom(this.parentNode, function () {
              assert.dom('.desc', "Qualifier 1; Qualifier 2; Semi-final (8 competitors); Final (2 competitors)");
            });
          });

          assert.equals(v.event.$reload().heats[v.cats[0]._id], 'LQQF8F2');
        },

        "test format error"() {
          assert.dom('.categories input[name=changeFormat]', {value: "QQF8"}, function () {
            TH.change(this, 'QQF8FX');
          });
          assert.dom('input.error+.errorMsg', 'is not valid');

          assert.equals(sut.event.heats[v.cats[0]._id], 'LQQF8'); // ensure reverted
          assert.equals(v.event.$reload().heats[v.cats[0]._id], 'LQQF8');
        },

        "test add category"() {
          var comp = TH.Factory.buildCompetitor({category_ids: [v.cats[2]._id]});
          assert.dom('.categories', function () {
            refute.dom('label span', 'Youth A 2');
            comp.$$save();
            assert.dom('label span', 'Youth A 2');
          });
        },

        "test add series"() {
          const series = TH.Factory.createSeries();
          assert.dom('#EditEvent', function () {
            TH.selectMenu('[name=series_id].select', series._id);
            TH.click('[type=submit]');
          });

          assert.same(v.event.$reload().series, series);
        },

        "test change name"() {
          assert.dom('#EditEvent', function () {
            assert.dom('h1', 'Edit ' + v.event.name);
            TH.input('[name=name]', {value: v.event.name}, 'new name');
            TH.click('[type=submit]');
          });

          assert.dom('#Event td', 'new name');
        },

        "test delete"() {
          assert.dom('#EditEvent', function () {
            TH.click('[name=delete]');
          });

          assert.dom('.Dialog.Confirm', function () {
            assert.dom('h1', 'Delete ' + v.event.name + '?');
            TH.click('[name=cancel]');
          });

          refute.dom('.Dialog');

          assert(Event.exists(v.event._id));

          TH.click('#EditEvent [name=delete]');

          assert.dom('.Dialog', function () {
            TH.click('[name=okay]', 'Delete');
          });

          refute.dom('#EditEvent');

          refute(Event.exists(v.event._id));
        },

        "test shows event teamTypes"() {
          assert.dom('#EditEvent', function () {
            assert.dom('.onOff[data-field=closed]');
            assert.dom('.teamTypeList', function () {
              assert.dom('li', {count: 2});
              assert.dom('li.checked', {count: 1});
              assert.dom('li:first-child', function () {
                assert.dom('.name', v.tt[0].name);
                assert.className(this, 'checked');
                TH.click('.check');
              });
            });

            TH.click('[type=submit]');
            v.event.$reload();
            assert.equals(v.event.teamType_ids, []);

          });

        },
      },
    },

  });
});
