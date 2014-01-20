(function (test, v) {
  buster.testCase('client/event:', {
    setUp: function () {
      test = this;
      v = {
        org: TH.Factory.createOrg(),
      };
      App.orgId = v.org._id;
    },

    tearDown: function () {
      v = null;
    },

    "test rendering": function () {
      var events = TH.Factory.createList(2, 'createEvent', function (index, options) {
        options.date = "2014/01/0"+(8-index);
      });

      AppRoute.gotoPage(Bart.Event.Index);

      assert.dom('#Event', function () {
        assert.dom('.events', function () {
          assert.dom('h1', 'Events');
          assert.dom('h1+table', function () {
            assert.dom('tr>td', events[0].name, function () {
              assert.domParent('td', events[0].date);
            });
            assert.dom('tr:first-child>td', events[1].name, function () {
              assert.domParent('td', events[1].date);
            });
          });
        });
        assert.dom('nav [name=add]', 'Add new event');
      });
    },

    "test adding new event": function () {
      AppRoute.gotoPage(Bart.Event.Index);

      assert.dom('#Event', function () {
        TH.click('[name=add]');
        assert.dom('#AddEvent', function () {
          TH.input('[name=name]', 'National Cup 1 - Auckland');
          TH.input('[name=date]', '2014/03/14');
          TH.click('[type=submit]');
        });
        refute.dom('#AddEvent');
      });

      assert(AppModel.Event.exists({org_id: v.org._id, name: 'National Cup 1 - Auckland', date: '2014/03/14'}));

      assert.dom('#Event [name=add]');
    },

    "select": {
      setUp: function () {
        v.event = TH.Factory.createEvent();
        v.event2 = TH.Factory.createEvent();

        AppRoute.gotoPage(Bart.Event.Index);

        TH.click('td', v.event.name);
      },

      "test rendering": function () {
        assert.dom('#Event #ShowEvent', function () {
          assert.dom('.link[name=register]');
          assert.dom('.link[name=edit]');
          assert.dom('h1', v.event.name);
        });
      },

      "//test registration rendering": function () {
        TH.click('[name=register]');

        assert.dom('#Event #Register #registrations', function () {
          assert.dom('h1', v.event.name);
          assert.dom('fieldset', function () {
            assert.dom('label .name', {text: 'Name', parent: function () {
              assert.dom('[name=name]');
            }});
          });
        });
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
