var $ = Bart.current;
var Tpl = Bart.Form.CompleteList;
var Row = Tpl.Row;
var v;

Tpl.$extend({
  $created: function (ctx, elm) {
    ctx.data.forEach(function (row) {
      elm.appendChild(Row.$render(row));
    });
  },
  $destroyed: function () {
    v.input.removeEventListener('blur', close);
    v.input.removeEventListener('keydown', keydown);
    v = null;
  },
});

Bart.Form.$extend({
  completeList: function (elm, list, callback) {
    close();
    if (! list) return;
    v = {
      input: elm,
      completeList: Tpl.$autoRender(list),
      callback: callback
    };
    elm.parentNode.insertBefore(v.completeList, elm.nextSibling);
    elm.addEventListener('blur', close);
    elm.addEventListener('keydown', keydown);
  },
});

Tpl.$events({
  'mousedown li': function (event) {select(this)},
});

function keydown(event) {
  if (event.which = 13) {
    select(v.completeList.firstChild);
  }
}

function select(li) {
  if (li) {
    var data = $.data(li);
    v.input.value = data.name;
    v.callback && v.callback(data);
    close();
  }

}

function close() {
  Bart.remove(v && v.completeList);
}
