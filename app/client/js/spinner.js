var $ = Bart.current;
var Tpl = Bart.Spinner;

Tpl.$extend({
  init: function () {
    var spinner = Tpl.$render({});
    document.body.appendChild(spinner);

    App.rpc.onChange(function (show) {
      Bart.setClass('show', show, spinner);
    });

    window.addEventListener('beforeunload', function (ev) {
      if (App.rpc.count > 0)
        ev.returnValue = "You have unsaved changes.";
    });
  },
});
