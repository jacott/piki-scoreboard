var path = Npm.require('path');

Plugin.registerSourceHandler("bhtml", function (compileStep) {
  if (! compileStep.arch.match(/^browser(\.|$)/)) return;

  var path_part = path.dirname(compileStep.inputPath);
  if (path_part === '.')
    path_part = '';
  if (path_part.length && path_part !== path.sep)
    path_part = path_part + path.sep;
  var ext = path.extname(compileStep.inputPath);
  var basename = path.basename(compileStep.inputPath, ext);

  var result = compile(compileStep.read());

  compileStep.addJavaScript({
    path: path.join(path_part, "bart." + basename + ".js"),
    sourcePath: compileStep.inputPath,
    data: result,
  });
});

if (process.env.METEOR_MODE === 'test') {
  (function () {
    var fs = Npm.require('fs');

    var dir = process.cwd()+'/packages/bart/test/plugin/';

    var template = fs.readFileSync(dir + 'template.bhtml');

    var result = compile(template);

    fs.writeFileSync(dir + 'template-test.js', '_BartTest = function(Bart) {'+result+'\n};');
  })();
}


function compile(contents) {
  contents = contents.toString('utf8');
  try {
    var result = BartCompiler.toJavascript(contents);
    return result;
  } catch(ex) {
    if (ex instanceof BartCompiler.Error) {
      compileStep.error({
        message: ex.message,
        sourcePath: compileStep.inputPath,
        line: contents.slice(0, ex.point).split("\n").length,
      });
      return;
    } else
      throw ex;
  }
}
