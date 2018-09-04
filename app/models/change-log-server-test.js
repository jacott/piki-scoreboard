define((require, exports, module)=>{
  const session         = require('koru/session');
  const Climber         = require('models/climber');
  const Result          = require('models/result');
  const TH              = require('test-helper');

  const ChangeLog = require('./change-log');

  TH.testCase(module, ({beforeEach, afterEach, group, test})=>{
    afterEach(()=>{
      TH.clearDB();
    });

    test("parentId", ()=>{
      TH.login();
      const result = TH.Factory.createResult();

      const cl = ChangeLog.findBy('model_id', result._id);

      assert.same(cl.parent, 'Event');
      assert.same(cl.parent_id, result.event_id);
      assert.same(cl.org_id, result.event.org_id);
    });

    test("no changes", ()=>{
      TH.login();
      const climber = TH.Factory.createClimber();

      assert.difference({by: 0, model: ChangeLog}, () => {
        session.rpc('save', 'Climber', climber._id, {});
      });
    });

    test("save on remove", ()=>{
      const climber = TH.Factory.createClimber({_id: '123'});
      TH.login();
      session.rpc('remove', 'Climber', '123');

      const cl = ChangeLog.query.where('type', 'remove').fetchOne();

      assert.attributesEqual(cl, {
        _id: cl._id,
        createdAt: cl.createdAt, model_id: climber._id,
        parent: 'Climber', parent_id: climber._id,
        user_id: TH.userId(),
        org_id: climber.org_id, type: 'remove', model: 'Climber'}, ['before']);

      assert.equals(JSON.parse(cl.before), climber.attributes);

    });

    test("save on update", ()=>{
      TH.login();
      const climber = TH.Factory.createClimber({_id: '123'}),
          after = {name: 'new name'};

      session.rpc('save', 'Climber', '123', after);

      assert.same(ChangeLog.query.where('model', 'Climber').count(), 2);

      const cl = ChangeLog.query.where('type', 'update').fetchOne();

      assert.attributesEqual(cl, {
        _id: cl._id, before: JSON.stringify({name: 'Climber 1'}),
        after: JSON.stringify({name: 'new name'}),
        createdAt: cl.createdAt, model_id: climber._id,
        parent: 'Climber', parent_id: climber._id,
        user_id: TH.userId(),
        org_id: climber.org_id, type: 'update', model: 'Climber'});
    });

    test("save on create", ()=>{
      TH.login();
      let climber = TH.Factory.buildClimber({name: 'new climber'});
      climber.changes._id = '123';
      session.rpc('save', 'Climber', null, climber.changes);

      climber = Climber.findById('123');

      const query = ChangeLog.query.where('model', 'Climber');

      assert.same(query.count(), 1);

      const cl = query.fetchOne();

      assert.attributesEqual(cl.attributes, {
        _id: cl._id, createdAt: cl.createdAt, model_id: climber._id,
        user_id: TH.userId(),
        parent: 'Climber', parent_id: climber._id,
        org_id: climber.org_id, type: 'create', model: 'Climber'},['after']);

      assert.equals(JSON.parse(cl.attributes.after), climber.attributes);

    });

  });
});
