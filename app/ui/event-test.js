isClient && define(function (require, exports, module) {
  var test, v;
  var TH = require('./test-helper');
  var sut = require('./event');
  var Route = require('koru/ui/route');
  var Climber = require('models/climber');
  var App = require('ui/app');
  var Result = require('models/result');
  var Event = require('models/event');
  require('./event-category');

  TH.testCase(module, {
    setUp: function () {
      test = this;
      v = {};
      v.org =  TH.Factory.createOrg();
      TH.login();
      TH.setOrg(v.org);
      v.eventSub = test.stub(App, 'subscribe').withArgs('Event').returns({stop: v.stop = test.stub()});
    },

    tearDown: function () {
      TH.tearDown();
      v = null;
    },

    "test event subscribing": function () {
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

    "test rendering": function () {
      var events = TH.Factory.createList(2, 'createEvent', function (index, options) {
        options.date = "2014/01/0"+(8-index);
      });

      Route.gotoPage(sut.Index);

      assert.dom('#Event', function () {
        assert.dom('.events', function () {
          assert.dom('h1', 'Events');
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

    "test adding new event": function () {
      Route.gotoPage(sut.Index);

      assert.dom('#Event', function () {
        TH.click('[name=add]');
        assert.dom('#AddEvent', function () {
          TH.input('[name=name]', 'National Cup 1 - Auckland');
          TH.input('[name=date]', '2014-03-14');
          TH.click('[type=submit]');
        });
        refute.dom('#AddEvent');
      });

      assert(Event.exists({org_id: v.org._id, name: 'National Cup 1 - Auckland', date: '2014-03-14'}));

      assert.dom('#Event [name=add]');
    },

    "select": {
      setUp: function () {
        TH.login();
        v.event = TH.Factory.createEvent();

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

        TH.click('td', v.event.name);
        v.eventSub.yield();
      },

      "test rendering": function () {
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
      },

      "test selecting category": function () {
        TH.click('.categories .link', v.cats[0].name);

        assert.dom('#Event .Category', function () {
          assert.dom('h1', v.cats[0].name);
        });
      },

      "test registration link": function () {
        TH.click('[name=register]');

        assert.dom('#Event #Register');
      },

      "Edit": {
        setUp: function () {
          TH.click('[name=edit]');
        },

        "test changing format": function () {
          assert.dom('.categories input[name=changeFormat]', {value: "QQF8"}, function () {
            TH.change(this, 'QQF8F2');
          });

          assert.equals(v.event.$reload().heats[v.cats[0]._id], 'LQQF8F2');
        },

        "test format error": function () {
          assert.dom('.categories input[name=changeFormat]', {value: "QQF8"}, function () {
            TH.change(this, 'QQF8FX');
          });
          assert.dom('input.error+.errorMsg', 'not valid');

          assert.equals(sut.event.heats[v.cats[0]._id], 'LQQF8'); // ensure reverted
          assert.equals(v.event.$reload().heats[v.cats[0]._id], 'LQQF8');
        },


        "test change name": function () {
          assert.dom('#EditEvent', function () {
            assert.dom('h1', 'Edit ' + v.event.name);
            TH.input('[name=name]', {value: v.event.name}, 'new name');
            TH.click('[type=submit]');
          });

          assert.dom('#Event td', 'new name');
        },

        "test delete": function () {
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
      },
    },

  });
});
