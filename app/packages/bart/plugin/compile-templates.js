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

  var result = compile(compileStep.read(), compileStep);

  compileStep.addJavaScript({
    path: path.join(path_part, "bart." + basename + ".js"),
    sourcePath: compileStep.inputPath,
    data: result,
  });
});

var errorCatch;

if (process.env.METEOR_MODE === 'test') (function () {
  var fs = Npm.require('fs');

  errorCatch = {
    error: function (options) {
      console.error(options.message + "\nsourcePath: " + options.sourcePath +
                   "\nline: " + options.line);
    },
  };

  var dir = process.cwd()+'/packages/bart/test/plugin/';

  var template = fs.readFileSync(dir + 'template.bhtml');

  var result = compile(template, errorCatch);

  fs.writeFileSync(dir + 'template-test.js', '_BartTest = function(Bart) {'+result+'\n};');

  if (global.BART_WATCHER) return;
  global.BART_WATCHER = true;

  dir = process.cwd() + '/../test/templates/';

  fs.existsSync(dir) && compileTestTemplates(dir);

  function compileTestTemplates(dir) {
    var buildDir = dir.replace(/\/test\/templates\//, '/test/compiled-templates/');
    fs.existsSync(buildDir) || fs.mkdirSync(buildDir);

    fs.watch(dir, {persistent: false}, function (event, file) {
      if (event === 'change' && file.match(/.bhtml$/))
        compilefile(fs, dir, buildDir, file);
    });

    fs.readdirSync(dir).forEach(function (file) {
      if (file.match(/\./)) {
        var m = /^([^.]+)\.bhtml$/.exec(file);
        if (m) {
          compilefile(fs, dir, buildDir, file);
        }
      } else if (fs.statSync(dir+file).isDirectory()) {
        compileTestTemplates(dir+file+'/');
      }
    });
  }

  function compilefile(fs, dir, buildDir, file) {
    var template = fs.readFileSync(dir+file);
    errorCatch.inputPath = dir+file;
    var result = compile(template, errorCatch);
    var name = '_BartTest_' + dir.replace(/^.*\/test\/templates\//,'') + file.replace(/.bhtml/,'');
    fs.writeFileSync(buildDir+file.replace(/\.bhtml$/, '.js'), name.replace(/\W+/g,'_') + ' = function(Bart) {'+result+'\n};');

  }
})();

function compile(contents, compileStep) {
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
