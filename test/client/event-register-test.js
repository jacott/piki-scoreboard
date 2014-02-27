(function (test, v) {
  buster.testCase('client/event-register:', {
    setUp: function () {
      test = this;
      v = {};
      v.org = TH.Factory.createOrg();
      v.event = TH.Factory.createEvent();
      var names = ['Bob', 'brendon', 'bobby', 'robert'];
      v.climbers = TH.Factory.createList(4, 'createClimber', function (index, options) {
        options.name = names[index];
      });
      v.u16 = TH.Factory.createCategory({group: '1 Youth Lead'});
      v.u18 = TH.Factory.createCategory({group: '1 Youth Lead'});
      v.open = TH.Factory.createCategory({group: '2 Open Lead'});

      TH.setOrg(v.org);
      v.eventSub = App.subscribe.withArgs('Event').returns({stop: test.stub()});
    },

    tearDown: function () {
      v = null;
    },

    "test registering": function () {
      gotoPage();

      assert.dom('#Event #Register', function () {
        assert.dom('h1', v.event.name);
        refute.dom('.Groups');
        assert.dom('fieldset', function () {
          assert.dom('label .name', {text: 'Name', parent: function () {
            TH.input('[name=name]', {value: ''}, 'bo');
            assert.dom('ul>li', 'Bob');
            assert.dom('ul>li', 'bobby');
            TH.input('[name=name]', '');
            refute.dom('ul');
            TH.input('[name=name]', 'b');
            TH.trigger('li', 'mousedown');
            TH.input('[name=name]', 'bre');
            TH.trigger('li', 'mousedown');
          }});
        });
        assert.dom('.Groups', function () {
          assert.dom('h1', {count: 1});
          assert.dom('label .name', {text: '1 Youth Lead', parent: function () {
            assert.dom('select[name=category_id] option:first-child', {
              value: '', text: ''});
            assert.dom('select[name=category_id] option:not([selected])', {
              value: v.u16._id, text: v.u16.name});
            assert.dom('select[name=category_id] option:not([selected])', {
                value: v.u18._id, text: v.u18.name, parent: function () {
                  TH.change(this, v.u18._id);
                }});
          }});
          assert.dom('select[name=category_id] option:not([selected])', {
            value: v.open._id, text: v.open.name, parent: function () {
              this.focus();
              TH.change(this, v.open._id);
            }});
        });

        TH.click('fieldset.actions [type=submit]');
        var competitor = AppModel.Competitor.findOne({climber_id: v.climbers[1]._id});
        assert.equals(competitor.category_ids, [v.u18._id, v.open._id]);

        assert.dom('table td', 'brendon', {parent: function () {
          assert.dom('td', [v.u18.shortName, v.open.shortName].join(', '));
        }});

        refute.dom('.Groups');
        assert.dom('form', function () {
          assert.dom('[name=name]', {value: ''}, function () {
            assert.same(document.activeElement, this);
          });

          assert.attributesEqual(Bart.getCtx(this).data.changes, {event_id: v.event._id});
        });

      });
    },

    "test adding new climber": function () {
      gotoPage();

      assert.dom('#Register', function () {
        assert.dom('label .name', {parent: function () {
          TH.input('[name=name]', 'John Smith');
          assert.dom('ul>li', 'Add "John Smith"', function () {
            TH.trigger(this, 'mousedown');
          });
        }});
      });

      assert.dom('.Dialog #AddClimber', function () {
        TH.input('[name=dateOfBirth]', '1999-10-12');
        TH.change('[name=gender]', 'm');
        TH.change('[name=club_id]', v.climbers[0].club_id);
        TH.click('[name=create]');
      });

      refute.dom('#AddClimber');
      assert.dom('.Groups');
    },

    "test can't add twice": function () {
      var oComp = TH.Factory.createCompetitor({climber_id: v.climbers[1]._id});

      gotoPage();

      assert.dom('#Event #Register', function () {
        TH.input('[name=name]', v.climbers[1].name);
        assert.dom('ul>li', {count: 1, text: 'Already registered'});
      });
    },

    "test cancel add": function () {
      gotoPage();

      assert.dom('#Event #Register', function () {
        TH.input('[name=name]', v.climbers[1].name);
        TH.click('ul>li');

        test.stub(AppRoute, 'replacePath');

        TH.click('[name=cancel]');

        assert.calledWith(AppRoute.replacePath, Bart.Event.Register);
      });
    },

    "edit": {
      setUp: function () {
        v.oComp = TH.Factory.createCompetitor({climber_id: v.climbers[1]._id});

        gotoPage();

        assert.dom('#Register td', {text: v.climbers[1].name, parent: function () {
          TH.click(this);
        }});

      },


      "test change category": function () {
        assert.dom('#Register form.edit', function () {
          assert.dom('.Groups', function () {
            assert.dom('select[name=category_id] option[selected]', {
              value: v.oComp.category_ids[0]}, function () {
                TH.change(this, '');
              });
          });
          TH.click('[type=submit]');
        });
        assert.dom('form.add');
      },

      "test cancel": function () {
        test.stub(AppRoute.history, 'back');

        TH.click('#Register form [name=cancel]');

        assert.called(AppRoute.history.back);
      },

      "test delete competitor": function () {
        assert.dom('#Register form.edit', function () {
          TH.click('[name=delete]');
        });

        assert.dom('.Dialog.Confirm', function () {
          assert.dom('h1', 'Deregister ' + v.climbers[1].name + '?');
          TH.click('[name=cancel');
        });

        refute.dom('.Dialog');

        TH.click('#Register form.edit [name=delete]');

        assert.dom('.Dialog', function () {
          TH.click('[name=okay]', 'Deregister');
        });

        assert.dom('form.add');

        refute.dom('td', v.climbers[1].name);
      },
    },
  });

  function gotoPage() {
    AppRoute.gotoPage(Bart.Event.Register, {
      orgSN: v.org.shortName, eventId: v.event._id});
    v.eventSub.yield();
  }
})();
