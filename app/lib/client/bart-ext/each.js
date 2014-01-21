var $ = Bart.current;

Bart.registerHelpers({
  each: function (func, options) {
    if ($.element._endEach) return;
    if (typeof func !== 'string') throw new Error("first argument must be name of helper method to call");

    var startEach = document.createComment('start');
    var endEach = startEach._endEach = document.createComment('end');
    $.element.parentNode.insertBefore(endEach, $.element.nextSibling);

    var col = {};
    var ctpl = $.template;
    var row = Bart.lookupTemplate.call(ctpl, options.template) ||
          Bart.lookupTemplate(options.template);

    $.ctx.onDestroy(ctpl._helpers[func].call(this, callback));

    return startEach;


    function callback(doc, old, sort) {
      var id = (doc || old);
      id = id._id || id.id;
      var elm = col[id];
      if (elm) {
        if (doc) {
          Bart.getCtx(elm).updateAllTags(doc);
          if (! old || (sort && sort(doc, old) != 0))
            insert(elm, sort);
        } else {
          delete col[id];
          Bart.remove(elm);
        }
        return;
      }
      var parentNode = endEach.parentNode;
      if (!parentNode) return;
      insert(col[id] = row.$autoRender(doc), sort);
    }

    function insert(elm, sort) {
      var a = $.data(elm);
      var before = endEach;
      if (sort) {
        var prev;
        for(var prev; (prev = before.previousSibling) !== startEach; before = prev)  {
          var b = $.data(prev);
          if (a !== b && sort(a, b) >= 0) break;
        }
      }

      endEach.parentNode.insertBefore(elm, before);
    }
  },
});
