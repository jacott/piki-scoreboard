define(function (require, exports, module) {
  const session         = require('koru/session');
  const Climber         = require('models/climber');
  require('models/result');
  const TH              = require('test-helper');

  const ChangeLog = require('./change-log');

  let v = null;

  TH.testCase(module, {
    setUp() {
      v = {};
    },

    tearDown() {
      TH.clearDB();
      v = null;
    },

    "test parentId"() {
      TH.login();
      var result = TH.Factory.createResult();

      var cl = ChangeLog.findBy('model_id', result._id);

      assert.same(cl.parent, 'Event');
      assert.same(cl.parent_id, result.event_id);
      assert.same(cl.org_id, result.event.org_id);
    },

    "test no changes"() {
      TH.login();
      var climber = TH.Factory.createClimber();

      assert.difference({by: 0, model: ChangeLog}, () => {
        session.rpc('save', 'Climber', climber._id, {});
      });
    },

    "test save on remove"() {
      const climber = TH.Factory.createClimber({_id: '123'});
      TH.login();
      session.rpc('remove', 'Climber', '123');

      var cl = ChangeLog.query.where('type', 'remove').fetchOne();

      assert.attributesEqual(cl, {_id: cl._id,
                                  createdAt: cl.createdAt, model_id: climber._id,
                                  parent: 'Climber', parent_id: climber._id,
                                  user_id: TH.userId(),
                                  org_id: climber.org_id, type: 'remove', model: 'Climber'}, ['before']);

      assert.equals(JSON.parse(cl.before), climber.attributes);

    },

    "test save on update"() {
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

    'test save on create'() {
      TH.login();
      var climber = TH.Factory.buildClimber({name: 'new climber'});
      climber.changes._id = '123';
      session.rpc('save', 'Climber', null, climber.changes);

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
