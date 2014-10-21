define(function (require, exports, module) {
  var test, v;
  var TH = require('test-helper');
  var ChangeLog = require('./change-log');
  var Climber = require('models/climber');
  require('models/result');
  var session = require('koru/session');

  TH.testCase(module, {
    setUp: function () {
      test = this;
      v = {};
    },

    tearDown: function () {
      TH.clearDB();
      v = null;
    },

    "test parentId": function () {
      TH.login();
      var result = TH.Factory.createResult();

      var cl = ChangeLog.findBy('model_id', result._id);

      assert.same(cl.parent, 'Event');
      assert.same(cl.parent_id, result.event_id);
      assert.same(cl.org_id, result.event.org_id);
    },

    "test no changes": function () {
      TH.login();
      var climber = TH.Factory.createClimber();

      assert.difference(0, ChangeLog, function () {
        session.rpc('save', 'Climber', climber._id, {});
      });
    },

    "test save on remove": function () {
      var climber = TH.Factory.createClimber({_id: '123'});
      TH.login();
      session.rpc('remove', 'Climber', '123');

      var cl = ChangeLog.query.where('type', 'remove').fetchOne();

      assert.attributesEqual(cl, {_id: cl._id, before: JSON.stringify(climber.attributes),
                                  createdAt: cl.createdAt, model_id: climber._id,
                                  parent: 'Climber', parent_id: climber._id,
                                  user_id: TH.userId(),
                                  org_id: climber.org_id, type: 'remove', model: 'Climber'});
    },

    "test save on update": function () {
      TH.login();
      var climber = TH.Factory.createClimber({_id: '123'}),
          after = {name: 'new name'};

      session.rpc('save', 'Climber', '123', after);

      assert.same(ChangeLog.query.where('model', 'Climber').count(), 2);

      var cl = ChangeLog.query.where('type', 'update').fetchOne();

      assert.attributesEqual(cl, {_id: cl._id, before: JSON.stringify({name: 'Climber 1'}), after: JSON.stringify({name: 'new name'}),
                                    createdAt: cl.createdAt, model_id: climber._id,
                                    parent: 'Climber', parent_id: climber._id,
                                    user_id: TH.userId(),
                                    org_id: climber.org_id, type: 'update', model: 'Climber'});
    },

    'test save on create': function () {
      TH.login();
      var climber = TH.Factory.buildClimber({name: 'new climber'});
      session.rpc('save', 'Climber', '123', climber.changes);

      climber = Climber.findById('123');

      var query = ChangeLog.query.where('model', 'Climber');

      assert.same(query.count(), 1);

      var cl = query.fetchOne();

      assert.attributesEqual(cl.attributes, {_id: cl._id, createdAt: cl.createdAt, model_id: climber._id,
                                    user_id: TH.userId(),
                                    parent: 'Climber', parent_id: climber._id,
                                    org_id: climber.org_id, type: 'create', model: 'Climber'},['after']);

      assert.equals(JSON.parse(cl.attributes.after), climber.attributes);

    },

  });
});
