var Tpl = Bart.Dialog;

App.extend(Tpl, {
  open: function (content) {
    document.body.appendChild(Tpl.$autoRender({content: content}));
  },

  close: function () {
    var dialogs = document.getElementsByClassName('Dialog');
    if (dialogs.length > 0) Bart.remove(dialogs[dialogs.length - 1]);
  },
});
