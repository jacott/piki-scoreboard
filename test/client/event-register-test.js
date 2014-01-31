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
      App.Ready.isReady = true;
      test.stub(App, 'subscribe').yields();
    },

    tearDown: function () {
      v = null;
    },

    "test adding": function () {
      AppRoute.gotoPage(Bart.Event.Register, {
        orgSN: v.org.shortName, eventId: v.event._id});

      assert.dom('#Event #Register #registrations', function () {
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
              TH.change(this, v.open._id);
            }});
        });

        TH.click('fieldset.actions [type=submit]');
        assert.dom('table td', 'brendon');
        refute.dom('.Groups');
      });
    },
  });
})();
