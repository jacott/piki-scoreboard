AppClient = {
  setLocationHref: function (href) {
    window.location.href = href; // can't test this function
  },

  getLocation: function () {
    return window.location;
  },
};
