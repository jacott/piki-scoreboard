(function (test, v) {
  buster.testCase('client/event:', {
    setUp: function () {
      test = this;
      v = {
        org: TH.Factory.createOrg(),
      };
      TH.setOrg(v.org);
      v.eventSub = App.subscribe.withArgs('Event').returns({stop: v.stop = test.stub()});
    },

    tearDown: function () {
      v = null;
    },

    "test event subscribing": function () {
      var events = TH.Factory.createList(2, 'createEvent', function (index, options) {
        options.date = "2014/01/0"+(8-index);
      });

      AppRoute.gotoPage(Bart.Event.Show, {eventId: events[0]._id});
      v.eventSub.yield();

      assert.calledWith(App.subscribe, 'Event', events[0]._id);

      AppRoute.gotoPage(Bart.Event.Edit);

      refute.called(v.stop);

      App.subscribe.reset();

      AppRoute.gotoPage(Bart.Event.Edit, {eventId: events[1]._id});

      assert.called(v.stop);

      assert.calledWith(App.subscribe, 'Event', events[1]._id);
    },

    "test rendering": function () {
      var events = TH.Factory.createList(2, 'createEvent', function (index, options) {
        options.date = "2014/01/0"+(8-index);
      });

      AppRoute.gotoPage(Bart.Event.Index);

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
      AppRoute.gotoPage(Bart.Event.Index);

      assert.dom('#Event', function () {
        TH.click('[name=add]');
        assert.dom('#AddEvent', function () {
          TH.input('[name=name]', 'National Cup 1 - Auckland');
          TH.input('[name=date]', '2014-03-14');
          TH.click('[type=submit]');
        });
        refute.dom('#AddEvent');
      });

      assert(AppModel.Event.exists({org_id: v.org._id, name: 'National Cup 1 - Auckland', date: '2014-03-14'}));

      assert.dom('#Event [name=add]');
    },

    "select": {
      setUp: function () {
        v.event = TH.Factory.createEvent();

        v.cats = TH.Factory.createList(3, 'createCategory', function (index, options) {
          options.shortName = 'YA ' + index;
          options.name = 'Youth A ' + index;
        });
        var c1 = TH.Factory.buildCompetitor({category_ids: [v.cats[0]._id]});
        var c2 = TH.Factory.buildCompetitor({category_ids: [v.cats[1]._id]});
        c1.$$save();
        c2.$$save();

        v.event2 = TH.Factory.createEvent();

        AppRoute.gotoPage(Bart.Event.Index);

        TH.click('td', v.event.name);
        v.eventSub.yield();
      },

      "test rendering": function () {
        assert.dom('#Event:not(.noEvent) .menu', function () {
          assert.dom('.link[name=register]');
          assert.dom('.link[name=edit]');
        });
        assert.dom('#Event #ShowEvent', function () {
          assert.dom('h1', v.event.name);
          assert.dom('.categories', function () {
            assert.dom('h1', 'Categories');
            assert.dom('.link', {text: v.cats[0].name, parent: function () {
              assert.dom('.link.adminAccess', 'QQF8');
            }});
            assert.dom('.link', v.cats[1].name);
          });
        });
      },

      "test changing format": function () {
        assert.dom('.link', {text: v.cats[0].name, parent: function () {
          TH.click('.link.adminAccess', 'QQF8');
          assert.dom('form+.link.adminAccess');
          assert.dom('form>input[name=changeFormat]', {value: "QQF8"}, function () {
            TH.input(this, 'QQF8F2');
            TH.trigger(this.parentNode, 'submit');
          });
          refute.dom('form+.link.adminAccess');
          assert.dom('.link.adminAccess', 'QQF8F2');
        }});

        assert.equals(v.event.$reload().heats[v.cats[0]._id], 'LQQF8F2');
      },

      "test format error": function () {
        assert.dom('.link', {text: v.cats[0].name, parent: function () {
          TH.click('.link.adminAccess', 'QQF8');
          assert.dom('form+.link.adminAccess');
          assert.dom('form>input[name=changeFormat]', {value: "QQF8"}, function () {
            TH.input(this, 'QQF8FX');
            TH.trigger(this.parentNode, 'submit');
          });
          assert.dom('form+.link.adminAccess', 'QQF8');
          assert.dom('form>input.error+.errorMsg', 'not valid');
        }});

        assert.equals(Bart.Event.event.heats[v.cats[0]._id], 'LQQF8'); // ensure reverted
        assert.equals(v.event.$reload().heats[v.cats[0]._id], 'LQQF8');
      },

      "test selecting category": function () {
        TH.click('.categories .link', v.cats[0].name);

        assert.dom('#Event #Category', function () {
          assert.dom('h1', v.cats[0].name);
        });
      },

      "test registration link": function () {
        TH.click('[name=register]');

        assert.dom('#Event #Register');
      },

      "test change name": function () {
        TH.click('[name=edit]');
        assert.dom('#EditEvent', function () {
          assert.dom('h1', 'Edit ' + v.event.name);
          TH.input('[name=name]', {value: v.event.name}, 'new name');
          TH.click('[type=submit]');
        });

        assert.dom('#Event td', 'new name');
      },

      "test delete": function () {
        TH.click('[name=edit]');
        assert.dom('#EditEvent', function () {
          TH.click('[name=delete]');
        });

        assert.dom('.Dialog.Confirm', function () {
          assert.dom('h1', 'Delete ' + v.event.name + '?');
          TH.click('[name=cancel');
        });

        refute.dom('.Dialog');

        assert(AppModel.Event.exists(v.event._id));

        TH.click('#EditEvent [name=delete]');

        assert.dom('.Dialog', function () {
          TH.click('[name=okay]', 'Delete');
        });

        refute.dom('#EditEvent');

        refute(AppModel.Event.exists(v.event._id));
      },
    },
  });
})();
