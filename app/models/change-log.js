var model = AppModel.Base.defineSubclass('ChangeLog', {
  get parentSubject () {
    var pm = AppModel[this.parent];
    return new pm(pm.attrFind(this.parent_id));
  }
}).defineFields({
  createdAt: 'timestamp',
  model: 'modelName',
  model_id: 'modelId',
  parent: 'modelName',
  parent_id: 'modelId',
  type: 'text',
  before: 'text',
  after: 'text',
  aux: 'text',
});

App.loaded('AppModel.ChangeLog', model);

App.require(['AppModel.User', 'AppModel.Org'], function () {
  model.defineFields({
    user_id: 'belongs_to',
    org_id: 'belongs_to',
  });
});
