// Karma configuration
// Generated on Sun Jul 21 2013 12:55:59 GMT+1200 (NZST)

module.exports = function(config) {
  config.set({

    // base path, that will be used to resolve files and exclude
    basePath: '',


    // frameworks to use
    frameworks: [],


    // list of files / patterns to load in the browser
    files: [
      'sinon.js',
      'geddon-src/geddon.js',
      'geddon-src/geddon/**/*.js',
      'geddon-src/geddon_adapter.js',
      "buster-compat.js",
      "browser-setup.js",
      // {pattern: 'client-src/app/client/css/**/*.css', included: false, served: true},
      // {pattern: 'client-src/**/*.map', included: false, served: true},
      "../helpers/testhelper.js", "../helpers/**-helper.js",
      "../../app/packages/*/test/**/*-test.js",
      '../client/**/*-test.js',
      '../lib/**/*-test.js',
      '../models/**/*-test.js',
      {pattern: 'startup-client.js', included: false, served: true},
    ],


    // list of files to exclude
    exclude: [
      '../../app/packages/*/test/**/server/**/*-test.js',
      '../**/server/**/*-test.js',
    ],

    customContext: "context.html",


    // test results reporter to use
    // possible values: 'dots', 'progress', 'junit', 'growl', 'coverage'
    reporters: ['progress'],


    // web server port
    port: 9876,


    // cli runner port
    runnerPort: 9100,

    // urlRoot: "/",

    // proxies: {
    //   '/packages/': 'http://localhost:3100/packages/',
    //   '/app/': 'http://localhost:3100/packages/',
    // },

    // enable / disable colors in the output (reporters and logs)
    colors: false,


    // level of logging
    // possible values: config.LOG_DISABLE || config.LOG_ERROR || config.LOG_WARN || config.LOG_INFO || config.LOG_DEBUG
    logLevel: config.LOG_WARN,


    // enable / disable watching file and executing tests whenever any file changes
    autoWatch: false,


    // Start these browsers, currently available:
    // - Chrome
    // - ChromeCanary
    // - Firefox
    // - Opera
    // - Safari (only Mac)
    // - PhantomJS
    // - IE (only Windows)
    browsers: [],


    // If browser does not capture in given timeout [ms], kill it
    captureTimeout: 60000,


    // Continuous Integration mode
    // if true, it capture browsers, run tests and exit
    singleRun: false
  });
};
