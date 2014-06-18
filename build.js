({
  baseUrl: "app",
  paths: {
    requireLib: "../node_modules/koru/node_modules/requirejs/require",
  },

  packages: ['koru', 'koru/model', 'koru/session', 'koru/user-account', 'koru/session'],

  include: 'requireLib',
//  optimize: 'none',

  stubModules: ['koru/dom/template-compiler'],

  onBuildRead: function (moduleName, path, contents) {
    if (moduleName === 'koru/css/loader')
      return "define({loadAll: function(){}});";

    return contents;
  },


  name: "client",
  out: "build/index.js",
})
