TH.assertRemoveRpc = function (model) {
  var test = geddon.test;
  test.spy(global, 'check');
  var doc = {
    _id: Random.id(),
    authorize: test.stub(),
    $remove: test.stub(),
  };
  test.stub(model, 'findOne').returns(doc);
  TH.call(model.modelName+".remove", doc._id);

  assert.calledWith(check, doc._id, String);
  assert.calledWith(doc.authorize, TH.userId(), {remove: true});
  assert.called(doc.$remove);
};
