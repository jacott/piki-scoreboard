define(function(require, exports, module) {
  const Dom  = require('koru/dom');
  const util = require('koru/util');

  exports.clickSelect = function (onChange) {
    return function (event) {
      Dom.stopEvent();
      var me = Dom.getClosest(this, 'tr');
      var parent = event.currentTarget;
      var selected = parent.getElementsByClassName('selected');

      if (event.ctrlKey) {
        var on = ! Dom.hasClass(me, 'selected');
        while(selected.length) {
          Dom.removeClass(selected[0], 'selected');
        }
        Dom.setClass('selected', on, me);
      } else if (event.shiftKey) {
        var elm = me.nextSibling;
        while(elm && ! Dom.hasClass(elm, 'selected'))
          elm = elm.nextSibling;

        if (elm) for(elm = elm.previousSibling;elm !== me; elm = elm.previousSibling) {
          Dom.addClass(elm, 'selected');
        }
        var elm = me.previousSibling;
        while(elm && ! Dom.hasClass(elm, 'selected'))
          elm = elm.previousSibling;

        if (elm) for(elm = elm.nextSibling;elm !== me; elm = elm.nextSibling) {
          Dom.addClass(elm, 'selected');
        }
        Dom.addClass(me, 'selected');
      } else {
        Dom.toggleClass(me, 'selected');
      }

      me = (Dom.hasClass(me, 'selected') ? me : selected[0]);

      onChange && onChange(me, selected, parent);
    };
  };

});
