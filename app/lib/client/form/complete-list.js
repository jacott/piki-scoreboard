var $ = Bart.current;
var Tpl = Bart.Form.CompleteList;
var Row = Tpl.Row;
var completeList;
var input;

Tpl.$extend({
  $created: function (ctx, elm) {
    ctx.data.forEach(function (row) {
      elm.appendChild(Row.$render(row));
    });
  },
  $destroyed: function () {
    input && input.removeEventListener('blur', close, this);
    completeList && completeList.removeEventListener('mousedown', click, this);
    input = completeList = null;
  },
});

Bart.Form.$extend({
  completeList: function (elm, list) {
    close();
    if (! list) return;
    input = elm;
    input.parentNode.insertBefore(completeList = Tpl.$autoRender(list), input.nextSibling);
    input.addEventListener('blur', close, true);
    completeList.addEventListener('mousedown', click, true);
  },
});


function click(event) {
  var li = Bart.getClosest(event.target, 'li');
  if (li) {
    input.value = $.data(li).name;
    close();
  }
}

function close() {
  Bart.remove(completeList);
}
