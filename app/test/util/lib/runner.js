const runner = require('koru/lib/runner');
const {argv} = process;

runner(['koru/server', `test/util/${argv[2]}`], (koru, target) => target.call({
  usage(arg) {
    console.error(`
Usage: dev-util ${argv[2]} ${arg}
`);
    process.exit(1);
  },
}, argv.slice(3), argv[1]));
