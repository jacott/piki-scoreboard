define((require)=>{
  const koru         = require('koru');
  const Dom          = require('koru/dom');
  const Org          = require('models/org');
  const User         = require('models/user');

  const App = {
    org() {
      return App.orgId && Org.findById(App.orgId);
    },

    me() {
      return User.me();
    },

    setAccess() {
      const _id = koru.userId();
      const user = _id && User.findById(_id);
      Dom.setClassBySuffix(user ? user.accessClasses(App.orgId) : 'readOnly', 'Access', document.body);
      Dom.setClass('isGuest', User.isGuest(), document.body);
    },
  };

  return App;
});
