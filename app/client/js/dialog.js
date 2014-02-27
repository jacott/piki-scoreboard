var $ = Bart.current;
var Tpl = Bart.Dialog;

App.extend(Tpl, {
  open: function (content, options) {
    var elm = Tpl.$autoRender({content: content});
    document.body.appendChild(elm);
    if (options && options.focus) {
      Bart.focus(elm, options.focus);
    }
  },

  close: function (elm) {
    if (elm)
      return Bart.remove(Bart.getClosest(elm, '.Dialog'));

    var dialogs = document.getElementsByClassName('Dialog');
    if (dialogs.length > 0) Bart.remove(dialogs[dialogs.length - 1]);
  },

  confirm: function (data) {
    document.body.appendChild(Tpl.Confirm.$autoRender(data));
  },
});

Tpl.Confirm.$helpers({
  classes: function () {
    $.element.setAttribute('class', 'ui-dialog '+ (this.classes || ''));
  },

  content: function () {
    var content = this.content;
    if (typeof content === 'string')
      return Bart.html(content);
    else
      return content.$render(this.data);
  },
});

Tpl.Confirm.$events({
  'click button': function (event) {
    var data = $.ctx.data;
    Bart.remove(event.currentTarget);
    data.callback.call(data, this.name === 'okay');
  },
});
