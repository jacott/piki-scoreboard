isClient && define((require, exports, module)=>{
  const Dom             = require('koru/dom');
  const Route           = require('koru/ui/route');
  const Climber         = require('models/climber');
  const Competitor      = require('models/competitor');
  const Team            = require('models/team');
  const EventSub        = require('pubsub/event-sub');
  const App             = require('ui/app');
  const TeamHelper      = require('ui/team-helper');
  const TH              = require('./test-helper');

  const {stub, spy, onEnd, match: m} = TH;

  const sut = require('./event-register');

  let v = {};
  TH.testCase(module, ({beforeEach, afterEach, group, test})=>{
    beforeEach(()=>{
      v.org =  TH.Factory.createOrg({_id: App.orgId = "org123"});
      v.tt = TH.Factory.createList(3, 'createTeamType', (index, options) => {
        options.name = ['Club', 'School', 'Country'][index];
      });
      TeamHelper.teamType_id = v.tt[0]._id;
      v.teams1 = TH.Factory.createList(2, 'createTeam', function (index, options) {
        options.teamType_id = v.tt[0]._id;
        options.name = 'Team '+ (5 - index);
      });

      v.teams2 = TH.Factory.createList(2, 'createTeam', function (index, options) {
        options.teamType_id = v.tt[1]._id;
      });

      v.event = TH.Factory.createEvent({teamType_ids: [v.tt[0]._id, v.tt[1]._id]});
      const names = ['Bob', 'brendon', 'bobby', 'robert'];
      v.climbers = TH.Factory.createList(4, 'createClimber', function (index, options) {
        options.name = names[index];
        options.number = '12'+index;
        if (index === 1)
          options.team_ids = [v.teams1[0]._id];
      });
      v.u16 = TH.Factory.createCategory({group: '1 Youth Lead'});
      v.u18 = TH.Factory.createCategory({group: '1 Youth Lead'});
      v.open = TH.Factory.createCategory({group: '2 Open Lead'});

      TH.setOrg(v.org);
      v.eventSub = stub(EventSub, 'subscribe').yields().returns({stop: v.stop = stub()});
      TH.login();
    });

    afterEach(()=>{
      TH.tearDown();
      TeamHelper.teamType_id = null;
      v = {};
    });

    test("closed", ()=>{
      v.event.$update({closed: true});

      gotoPage();

      assert.dom('#Register.closed');
    });

    test("registering", ()=>{
      gotoPage();

      assert.dom('#Event [name=Register].selected');
      assert.dom('#Event #Register:not(.closed)', function () {
        refute.dom('.Groups');
        assert.dom('fieldset', function () {
          assert.dom('label .name', {text: 'Name', parent() {
            TH.input('[name=name]', {value: ''}, 'bo');
            assert.dom(Dom('body>.complete'), function () {
              assert.dom('li', 'Bob');
              assert.dom('li', 'bobby');
            });
            TH.input('[name=name]', '');
            refute(Dom('body>.complete'));
            TH.input('[name=name]', 'b');
            TH.trigger(Dom('body>ul>li'), 'pointerdown');
            TH.input('[name=name]', 'bre');
            TH.trigger(Dom('body>ul>li'), 'pointerdown');
          }});
        });

        assert.dom('.Teams', function () {
          assert.dom('label:first-child', function () {
            assert.dom('.name', v.tt[0].name);

            assert.dom('button.select', v.teams1[0].name);
          });

          refute.dom('span.name', 'Country');

          assert.dom('label:last-child', function () {
            assert.dom('.name', v.tt[1].name);

            assert.dom('button.select.none', 'Select');
            TH.selectMenu('button.select', v.teams2[1]._id);
            assert.dom('button.select:not(.none)', v.teams2[1].name);
          });
        });

        assert.dom('.Groups', function () {
          assert.dom('h1', {count: 1});
          assert.dom('label .name', {text: '1 Youth Lead', parent() {
            assert.dom('button.select.category.none', '---');
            TH.selectMenu('button.select', v.u16._id);
            TH.selectMenu('button.select', m.field('_id', null));
            assert.dom('button.select.category.none', '---');
            TH.selectMenu('button.select', v.u18._id);
            assert.dom('button.select.category:not(.none)', v.u18.name);
          }});

          assert.dom('label .name', {text: '2 Open Lead', parent() {
            TH.selectMenu('button.select', v.open._id);
            assert.dom('button.select.category:not(.none)', v.open.name);
          }});

        });

        assert.dom('.Groups>fieldset.fields', function( ){
          assert.dom('label', function () {
            assert.dom('.name', 'Competitor number');
            assert.dom('[name=number]', {value: '121'});
            TH.input('[name=number]', '567a');
          });
        });

        TH.click('fieldset.actions [type=submit]');

        assert.dom('[name=number].error+.errorMsg', 'must be numeric');
        TH.input('[name=number]', '567');

        TH.click('fieldset.actions [type=submit]');
        const competitor = Competitor.query.where({climber_id: v.climbers[1]._id}).fetchOne();
        assert.equals(competitor.category_ids, [v.u18._id, v.open._id]);
        assert.same(competitor.number, 567);
        assert.same(competitor.climber.number, 567);

        assert.dom('table>thead', ()=>{
          assert.dom('th[data-sort=team]', 'Club');
          TH.selectMenu(
            'th[data-sort=team]>[name=selectTeamType]',
            m.field('name', 'School'), elm =>{
              assert.dom(elm.parentNode, ()=>{
                assert.dom('li', {count: 2});
                assert.dom('li:first-child', 'Club');
              });
              return true;
            });
        });

        assert.dom('table td', {text: 'brendon', parent() {
          assert.dom('td.team', v.teams1[0].shortName);
          assert.dom('td.cat', function () {
            assert.dom('abbr', v.u18.shortName);
            assert.dom('abbr+abbr', v.open.shortName);
          });
        }});

        refute.dom('.Groups');
        assert.dom('form', function () {
          assert.dom('[name=name]', {value: ''}, function () {
            assert.same(document.activeElement, this);
          });

          assert.attributesEqual(Dom.ctx(this).data.changes, {event_id: v.event._id});
        });

      });

    });

    test("adding new climber", ()=>{
      gotoPage();

      assert.dom('#Register', function () {
        assert.dom('label .name', {parent() {
          TH.input('[name=name]', 'John Smith');
        }});
      });
      assert.dom('body>ul>li', 'Add "John Smith"', function () {
        TH.trigger(this, 'pointerdown');
      });

      assert.dom('.Dialog #AddClimber', function () {
        TH.input('[name=dateOfBirth]', '1999-10-12');
        TH.change('[name=gender]', 'm');
        TH.click('[name=create]');
      });

      refute.dom('#AddClimber');
      assert.dom('.Groups');
    });

    test("can't add twice", ()=>{
      const oComp = TH.Factory.createCompetitor({climber_id: v.climbers[1]._id});

      gotoPage();

      assert.dom('#Event #Register', function () {
        TH.input('[name=name]', v.climbers[1].name);
      });
      assert.dom('body>ul>li', {count: 1, text: 'Already registered'});
    });

    test("cancel add", ()=>{
      gotoPage();

      assert.dom('#Event #Register', function () {
        TH.input('[name=name]', v.climbers[1].name);
        TH.click(Dom('body>ul>li'));

        stub(Route, 'replacePath');

        TH.click('[name=cancel]');

        assert.calledWith(Route.replacePath, Dom.tpl.Event.Register);
      });
    });

    group("edit", ()=>{
      beforeEach(()=>{
        v.oComp = TH.Factory.createCompetitor({climber_id: v.climbers[1]._id, team_ids: [v.teams1[0]._id]});

        gotoPage();

        assert.dom('#Register td', {text: v.climbers[1].name, parent() {
          TH.click(this);
        }});
      });

      test("editClimber", ()=>{
        assert.dom('#Register form.edit', function () {
          TH.click('[name=editClimber]');
        });

        assert.dom('#Climber', function () {
          assert.dom('#EditClimber', function () {
            assert.dom('[name=name]', {value: v.climbers[1].name});
          });
        });
      });

      test("change team", ()=>{
        assert.dom('#Register form.edit', function () {
          assert.dom('.Teams', function () {
            assert.dom('label:first-child', function () {
              assert.dom('.name', v.tt[0].name);

              assert.dom('button.select:not(.none)', v.teams1[0].name);
              TH.selectMenu('button.select', m.field('_id', null), function () {
                assert.dom(this.parentNode, function () {
                  assert.dom('li:first-child>i', 'none');
                  assert.dom('li:nth-child(2)', 'Team 4');
                  assert.dom('li:nth-last-child(2)', 'Team 5');
                  assert.dom('li:last-child', 'add new team');
                });
                TH.click(this);
              });
              assert.dom('button.select.none', 'Select');

              TH.selectMenu('button.select', '$new');
            });
          });
        });
        assert.dom('#AddTeam', function () {
          TH.click('[name=cancel]');
        });
        refute.dom('#AddTeam');
        TH.selectMenu('.Teams label:first-child button.select', '$new');
        assert.dom('#AddTeam', function () {
          TH.input('[name=name]', 'Dynomites Wellington');
          TH.input('[name=shortName]', 'Wgtn');
          TH.click('[type=submit]');
        });
        refute.dom('#AddTeam');
        assert.dom('button.select:not(.none)', 'Dynomites Wellington');
        assert.same(Team.findBy('name', 'Dynomites Wellington').teamType_id, v.tt[0]._id);
      });

      test("change category", ()=>{
        assert.dom('#Register form.edit', function () {
          assert.dom('.Groups', function () {
            assert.dom('button.select.category:not(.none)', 'Category 4', function () {
              TH.selectMenu(this, m.field('_id', null));
              assert.className(this, 'none');
            });
          });
          TH.click('[type=submit]');
        });
        assert.dom('form.add');
        assert.equals(v.oComp.$reload().category_ids,[]);
      });

      test("cancel", ()=>{
        stub(Route, 'replacePath');

        TH.click('#Register form [name=cancel]');

        assert.calledWithExactly(Route.replacePath, Dom.tpl.Event.Register);
      });

      test("delete competitor", ()=>{
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
      });
    });
  });

  function gotoPage() {
    Route.gotoPage(Dom.tpl.Event.Register, {
      orgSN: v.org.shortName, eventId: v.event._id});
    v.eventSub.yield();
  }
});
