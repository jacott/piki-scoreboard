var Tpl = Bart.Flash;

Tpl.$events({
  'click .m': function (event) {
    Bart.stopEvent();
    Bart.remove(event.currentTarget);
  },
});

App.extend(Tpl, {
  error: function (message) {
    return this.notice(message, 'error');
  },

  notice: function (message, classes) {
    Bart.removeId('Flash');
    document.body.appendChild(Tpl.$autoRender({message: message, classes: classes || 'notice'}));
  },

  loading: function () {
    this.notice('Loading...', 'loading');
  }
});


App.globalErrorCatch = function (e) {
  Tpl.error(e.reason);
  return true;
};
