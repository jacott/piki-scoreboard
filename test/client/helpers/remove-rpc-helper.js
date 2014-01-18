TH.assertRemoveRpc = function (model) {
  var test = geddon.test;
  var doc = {
    constructor: {modelName: model.modelName},
    _id: Random.id(),
  };
  var $remove = test.stub(model.docs, 'remove');
  test.spy(Meteor, 'call');
  test.stub(model, 'findOne').returns(doc);
  model.prototype.$remove.call(doc);

  assert.calledWith(Meteor.call, model.modelName+'.remove', doc._id);

  assert.calledWith($remove, doc._id);
  assert.same($remove.thisValues[0], model.docs);
};
