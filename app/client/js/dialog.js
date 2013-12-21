var Tpl = Bart.Dialog;

App.extend(Tpl, {
  open: function (content) {
    document.body.appendChild(Tpl.$autoRender({content: content}));
  },
});
