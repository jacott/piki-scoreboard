var $ = Bart.current;
var Tpl = Bart.Form.CompleteList;
var Row = Tpl.Row;
var v;

Tpl.$extend({
  $created: function (ctx, elm) {
    ctx.data.forEach(function (row) {
      elm.appendChild(Row.$render(row));
    });
    Bart.addClass(elm.firstChild, 'selected');
  },
  $destroyed: function () {
    v.input.removeEventListener('blur', close);
    v.input.removeEventListener('keydown', keydown, true);
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
    elm.addEventListener('keydown', keydown, true);
  },
});

Tpl.$events({
  'mousedown li': function (event) {select(this)},
});

function keydown(event) {
  var cur = v.completeList.querySelector('.complete>.selected');

  switch (event.which) {
  case 13: // enter
    select(cur);
    break;
  case 38: // up
    highlight(cur, cur.previousSibling || v.completeList.firstChild);
    break;
  case 40: // down
    highlight(cur, cur.nextSibling || v.completeList.lastChild);
    break;
  default:
    return;
  }

  event.stopImmediatePropagation();
  event.preventDefault();
}

function select(li) {
  if (li) {
    var data = $.data(li);
    v.input.value = data.name;
    v.callback && v.callback(data);
    close();
  }
}

function highlight(curElm, newElm) {
  Bart.removeClass(curElm, 'selected');
  Bart.addClass(newElm, 'selected');

}

function close() {
  Bart.remove(v && v.completeList);
}
