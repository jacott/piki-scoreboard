var Tpl = Bart.Form.CompleteList;
var Row = Tpl.Row;

Tpl.$extend({
  $created: function (ctx, elm) {
    ctx.data.forEach(function (row) {
      elm.appendChild(Row.$render(row));
    });
  },
});

Bart.Form.$extend({
  completeList: function (elm, list) {
    elm.parentNode.insertBefore(Tpl.$autoRender(list), elm.nextSibling);
  },
});
