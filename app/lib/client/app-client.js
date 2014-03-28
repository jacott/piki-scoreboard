AppClient = {
  setLocationHref: function (href) {
    window.location.href = href; // can't test this function
  },

  getLocation: function () {
    return window.location;
  },

  text: function (text) {
    var m = /^([^:]+):(.*)$/.exec(text);
    if (m) {
      var fmt = App.ResourceString.en[m[1]];
      if (fmt) {
        return App.format(fmt, m[2].split(':'));
      }
    }
    return App.ResourceString.en[text] || text;
  },
};
