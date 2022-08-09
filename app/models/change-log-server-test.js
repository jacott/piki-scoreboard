define((require, exports, module) => {
  const session         = require('koru/session');
  const util            = require('koru/util');
  const Climber         = require('models/climber');
  const Result          = require('models/result');
  const TH              = require('test-helper');
  const Factory         = require('test/factory');

  const ChangeLog = require('./change-log');

  TH.testCase(module, ({beforeEach, afterEach, group, test}) => {
    beforeEach(async () => {
      await TH.startTransaction();
      const user = await Factory.createUser();
      util.thread.connection = {userId: user._id};
      await TH.loginAs(user);
    });
    afterEach(async () => {
      await TH.rollbackTransaction();
      util.thread.connection = undefined;
    });

    test('parentId', async () => {
      const result = await Factory.createResult();

      const cl = await ChangeLog.findBy('model_id', result._id);

      assert.same(cl.parent, 'Event');
      assert.same(cl.parent_id, result.event_id);
      assert.same(cl.org_id, result.event.org_id);
    });

    test('no changes', async () => {
      const climber = await Factory.createClimber();

      await assert.difference({by: 0, model: ChangeLog}, () => session.rpc('save', 'Climber', climber._id, {}));
    });

    test('save on remove', async () => {
      const climber = await Factory.createClimber({_id: '123'});
      await session.rpc('remove', 'Climber', '123');

      const cl = await ChangeLog.query.where('type', 'remove').fetchOne();

      assert.attributesEqual(cl, {
        _id: cl._id,
        createdAt: cl.createdAt, model_id: climber._id,
        parent: 'Climber', parent_id: climber._id,
        user_id: TH.userId(),
        org_id: climber.org_id, type: 'remove', model: 'Climber'}, ['before']);

      assert.equals(JSON.parse(cl.before), climber.attributes);
    });

    test('save on update', async () => {
      const climber = await Factory.createClimber({_id: '123'}),
            after = {name: 'new name'};

      await session.rpc('save', 'Climber', '123', after);

      assert.same(await ChangeLog.query.where('model', 'Climber').count(), 2);

      const cl = await ChangeLog.query.where('type', 'update').fetchOne();

      assert.attributesEqual(cl, {
        _id: cl._id, before: JSON.stringify({name: 'Climber 1'}),
        after: JSON.stringify({name: 'new name'}),
        createdAt: cl.createdAt, model_id: climber._id,
        parent: 'Climber', parent_id: climber._id,
        user_id: TH.userId(),
        org_id: climber.org_id, type: 'update', model: 'Climber'});
    });

    test('save on create', async () => {
      let climber = await Factory.buildClimber({name: 'new climber'});
      climber.changes._id = '123';
      await session.rpc('save', 'Climber', null, climber.changes);

      climber = await Climber.findById('123');

      const query = ChangeLog.query.where('model', 'Climber');

      assert.same(await query.count(), 1);

      const cl = await query.fetchOne();

      assert.attributesEqual(cl.attributes, {
        _id: cl._id, createdAt: cl.createdAt, model_id: climber._id,
        user_id: TH.userId(),
        parent: 'Climber', parent_id: climber._id,
        org_id: climber.org_id, type: 'create', model: 'Climber'}, ['after']);

      assert.equals(JSON.parse(cl.attributes.after), climber.attributes);
    });
  });
});
