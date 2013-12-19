config.options = {
  files: [
    "helpers/testhelper.js",
    "helpers/**-helper.js",
    "server-helpers/**-helper.js",
    "server-setup.js",
    "packages/**/*-test.js",
    "server/**/*-test.js",
    "lib/**/*-test.js",
    "models/**/*-test.js",
  ],

  exclude: [
    "**/client/**"
  ],
};
