define(function (require, exports, module) {
  var test, v;
  var TH = require('test-helper');
  var ChangeLog = require('./change-log');

  TH.testCase(module, {
    setUp: function () {
      test = this;
      v = {};
    },

    tearDown: function () {
      TH.clearDB();
      v = null;
    },

    "//registerObserveModel": {
      setUp: function () {
        TH.stubOplog();
        v.Foo = {modelName: 'Foo'};
        ChangeLog.registerObserveModel(v.Foo);
      },

      tearDown: function () {
        v.handle && v.handle.stop();
      },

      "test parent": function () {
        v.handle = v.Foo.observeChangeLog(['f123'], {
          added: v.added = test.stub()
        });
        AppOplog.simulate('i', 'ChangeLog', 'c12', {_id: 'c12', parent: 'Fuz', parent_id: 'f123', after: "text"});
        AppOplog.simulate('i', 'ChangeLog', 'c13', {_id: 'c13', parent: 'Foo', parent_id: 'n123', after: "text"});

        refute.called(v.added);

        AppOplog.simulate('i', 'ChangeLog', 'c14', v.expected = {_id: 'c14', parent: 'Foo', parent_id: 'f123', after: "text"});

        assert.calledWith(v.added, 'c14', v.expected);
      },

      "test model": function () {
        v.handle = v.Foo.observeChangeLog(['f123'], {
          added: v.added = test.stub()
        });
        AppOplog.simulate('i', 'ChangeLog', 'c12', {_id: 'c12', model: 'Fuz', model_id: 'f123', after: "text"});
        AppOplog.simulate('i', 'ChangeLog', 'c13', {_id: 'c13', model: 'Foo', model_id: 'n123', after: "text"});
        AppOplog.simulate('i', 'ChangeLog', 'c131', {_id: 'c131', parent: 'Foo', parent_id: 'f123', model: 'Foo', model_id: 'f123', after: "text"});

        assert.calledOnce(v.added); // for parent; not for model

        AppOplog.simulate('i', 'ChangeLog', 'c14', v.expected = {_id: 'c14', model: 'Foo', model_id: 'f123', after: "text"});

        assert.calledWith(v.added, 'c14', v.expected);
      },
    },

    "//test parentId": function () {
      TH.login();
      var result = TH.Factory.createResult();

      TH.call('Result.setScore', result._id, 99, "1:23");

      var cl = ChangeLog.findOne({model_id: result._id});

      assert.same(cl.parent, 'Event');
      assert.same(cl.parent_id, result.event_id);
      assert.same(cl.org_id, result.event.org_id);
    },

    "//test no changes": function () {
      TH.login();
      var climber = TH.Factory.createClimber();

      assert.difference(0, ChangeLog, function () {
        TH.call('Climber.save', climber._id, {});
      });
    },

    "//test save on update": function () {
      TH.login();
      var climber = TH.Factory.createClimber({_id: '123'}),
          after = {name: 'new name'};

      TH.call('Climber.save', '123', after);

      assert.same(ChangeLog.find({model: 'Climber'}).count(), 1);

      var cl = ChangeLog.findOne();

      assert.equals(cl.attributes, {_id: cl._id, before: JSON.stringify({name: 'Climber 1'}), after: JSON.stringify(after),
                                    createdAt: cl.createdAt, model_id: climber._id,
                                    parent: 'Climber', parent_id: climber._id,
                                    user_id: TH.userId(),
                                    org_id: climber.org_id, type: 'update', model: 'Climber'});

      TH.call('Climber.save', '123', {dateOfBirth: '1999-12-31'});

      assert.same(ChangeLog.find({model: 'Climber'}).count(), 1);
      refute(ChangeLog.exists(cl._id));
      cl =  ChangeLog.findOne();

      assert.equals(JSON.parse(cl.before), {name: 'Climber 1', dateOfBirth: '2000-01-01'});
      assert.equals(JSON.parse(cl.after), {name: 'new name', dateOfBirth: '1999-12-31'});
    },

    '//test save on create': function () {
      TH.login();
      var climber = TH.Factory.buildClimber({name: 'new climber'});
      TH.call('Climber.save', '123', climber.changes);

      climber = AppModel.Climber.findOne('123');

      assert.same(ChangeLog.find({}).count(), 1);

      var cl = ChangeLog.findOne({});

      assert.equals(cl.attributes, {_id: cl._id, after: JSON.stringify(climber.attributes), createdAt: cl.createdAt, model_id: climber._id,
                                    user_id: TH.userId(),
                                    parent: 'Climber', parent_id: climber._id,
                                    org_id: climber.org_id, type: 'create', model: 'Climber'});
    },

  });
});
