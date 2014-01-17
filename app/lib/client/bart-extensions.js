Bart.updateOnCallback = function (ctx, observeFunc) {
  var needUpdate = null;

  ctx.onDestroy(cleanup);

  var stopOb = observeFunc(function () {
    if (needUpdate) return;
    needUpdate = Meteor.setTimeout(update, 50);

    function update() {
      needUpdate = null;
      ctx.updateAllTags();
    }
  });

  function cleanup() {
    needUpdate && Meteor.clearTimeout(needUpdate);
    stopOb && stopOb.stop();
    stopOb = needUpdate = null;
  }
};
