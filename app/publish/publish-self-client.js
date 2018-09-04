define((require, exports, module)=>{
  const koru            = require('koru');
  const publish         = require('koru/session/publish');

  koru.onunload(module, ()=>{publish._destroy('Self')});

  publish({name: 'Self', init() {
    this.match('User', doc => this.userId === doc._id);

    this.match('Org', doc => true);
  }});
});
