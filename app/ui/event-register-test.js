isClient && define(function (require, exports, module) {
  var test, v;
  var TH = require('./test-helper');
  var sut = require('./event-register');
  var Route = require('koru/ui/route');
  var Climber = require('models/climber');
  var App = require('ui/app');
  var Competitor = require('models/competitor');
  var Dom = require('koru/dom');

  TH.testCase(module, {
    setUp: function () {
      test = this;
      v = {};
      v.org =  TH.Factory.createOrg();
      v.tt = TH.Factory.createList(2, 'createTeamType');
      v.teams1 = TH.Factory.createList(2, 'createTeam', function (index, options) {
        options.teamType_id = v.tt[0]._id;
      });

      v.teams2 = TH.Factory.createList(2, 'createTeam', function (index, options) {
        options.teamType_id = v.tt[1]._id;
      });

      v.event = TH.Factory.createEvent({teamType_ids: [v.tt[0]._id, v.tt[1]._id]});
      var names = ['Bob', 'brendon', 'bobby', 'robert'];
      v.climbers = TH.Factory.createList(4, 'createClimber', function (index, options) {
        options.name = names[index];
        if (index === 1)
          options.team_ids = [v.teams1[0]._id];
      });
      v.u16 = TH.Factory.createCategory({group: '1 Youth Lead'});
      v.u18 = TH.Factory.createCategory({group: '1 Youth Lead'});
      v.open = TH.Factory.createCategory({group: '2 Open Lead'});

      TH.setOrg(v.org);
      v.eventSub = test.stub(App, 'subscribe').withArgs('Event').returns({stop: v.stop = test.stub()});
      TH.login();
    },

    tearDown: function () {
      TH.tearDown();
      v = null;
    },

    "test closed": function () {
      v.event.$update({closed: true});

      gotoPage();

      assert.dom('#Register.closed');
    },

    "test registering": function () {
      gotoPage();

      assert.dom('#Event #Register:not(.closed)', function () {
        assert.dom('h1', v.event.name);
        refute.dom('.Groups');
        assert.dom('fieldset', function () {
          assert.dom('label .name', {text: 'Name', parent: function () {
            TH.input('[name=name]', {value: ''}, 'bo');
            assert.dom(Dom('body>.complete'), function () {
              assert.dom('li', 'Bob');
              assert.dom('li', 'bobby');
            });
            TH.input('[name=name]', '');
            refute(Dom('body>.complete'));
            TH.input('[name=name]', 'b');
            TH.trigger(Dom('body>ul>li'), 'mousedown');
            TH.input('[name=name]', 'bre');
            TH.trigger(Dom('body>ul>li'), 'mousedown');
          }});
        });

        assert.dom('.Teams', function () {
          assert.dom('label:first-child', function () {
            assert.dom('.name', v.tt[0].name);

            assert.dom('button.select', v.teams1[0].name);
          });

          assert.dom('label:last-child', function () {
            assert.dom('.name', v.tt[1].name);

            assert.dom('button.select.none', 'Select');
            TH.selectMenu('button.select', TH.match.field('id', v.teams2[1]._id));
            assert.dom('button.select:not(.none)', v.teams2[1].name);
          });
        });

        assert.dom('.Groups', function () {
          assert.dom('h1', {count: 1});
          assert.dom('label .name', {text: '1 Youth Lead', parent: function () {
            assert.dom('button.select.category.none', '---');
            TH.selectMenu('button.select', TH.match.field('_id', v.u16._id));
            TH.selectMenu('button.select', TH.match.field('_id', null));
            assert.dom('button.select.category.none', '---');
            TH.selectMenu('button.select', TH.match.field('_id', v.u18._id));
            assert.dom('button.select.category:not(.none)', v.u18.name);
          }});

          assert.dom('label .name', {text: '2 Open Lead', parent: function () {
            TH.selectMenu('button.select', TH.match.field('_id', v.open._id));
            assert.dom('button.select.category:not(.none)', v.open.name);
          }});

        });

        assert.dom('fieldset.fields.climber', function( ){
          assert.dom('label', function () {
            assert.dom('.name', 'Competitor number');
            TH.input('[name=number]', '567a');
          });
        });

        TH.click('fieldset.actions [type=submit]');

        assert.dom('[name=number].error+.errorMsg', 'must be numeric');
        TH.input('[name=number]', '567');

        TH.click('fieldset.actions [type=submit]');
        var competitor = Competitor.query.where({climber_id: v.climbers[1]._id}).fetchOne();
        assert.equals(competitor.category_ids, [v.u18._id, v.open._id]);
        assert.same(competitor.climber.number, 567);


        assert.dom('table td', 'brendon', {parent: function () {
          assert.dom('td', [v.u18.shortName, v.open.shortName].join(', '));
        }});

        refute.dom('.Groups');
        assert.dom('form', function () {
          assert.dom('[name=name]', {value: ''}, function () {
            assert.same(document.activeElement, this);
          });

          assert.attributesEqual(Dom.getCtx(this).data.changes, {event_id: v.event._id});
        });

      });

    },

    "test adding new climber": function () {
      gotoPage();

      assert.dom('#Register', function () {
        assert.dom('label .name', {parent: function () {
          TH.input('[name=name]', 'John Smith');
        }});
      });
      assert.dom('body>ul>li', 'Add "John Smith"', function () {
        TH.trigger(this, 'mousedown');
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
      });
      assert.dom('body>ul>li', {count: 1, text: 'Already registered'});
    },

    "test cancel add": function () {
      gotoPage();

      assert.dom('#Event #Register', function () {
        TH.input('[name=name]', v.climbers[1].name);
        TH.click(Dom('body>ul>li'));

        test.stub(Route, 'replacePath');

        TH.click('[name=cancel]');

        assert.calledWith(Route.replacePath, Dom.Event.Register);
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
            assert.dom('button.select.category:not(.none)', 'Category 4', function () {
              TH.selectMenu(this, TH.match.field('_id', null));
              assert.className(this, 'none');
            });
          });
          TH.click('[type=submit]');
        });
        assert.dom('form.add');
        assert.equals(v.oComp.$reload().category_ids,[]);
      },

      "test cancel": function () {
        test.stub(Route, 'replacePath');

        TH.click('#Register form [name=cancel]');

        assert.calledWithExactly(Route.replacePath, Dom.Event.Register);
      },

      "test delete competitor": function () {
        assert.dom('#Register form.edit', function () {
          TH.click('[name=delete]');
        });

        assert.dom('.Dialog.Confirm', function () {
          assert.dom('h1', 'Deregister ' + v.climbers[1].name + '?');
          TH.click('[name=cancel]');
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
    Route.gotoPage(Dom.Event.Register, {
      orgSN: v.org.shortName, eventId: v.event._id});
    v.eventSub.yield();
  }
});
