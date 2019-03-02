/*
  Copyright © 2019 Mark Spurgeon

*/

var fs = require('fs');
var path = require('path');
var chalk = require('chalk');
var prompt = require('prompt')
var package = JSON.parse(fs.readFileSync('package.json', 'utf8'))

const [,, ...args] = process.argv

const appName = args[0];

prompt.start();

getSourcePath().then(sourcePath => {
  var appFolder = path.join(sourcePath, appName);
  if (fs.existsSync(appFolder)) {
    console.error("App has already been created at ", chalk.blue(appName));
  } else {
    try {
      fs.mkdirSync(appFolder);
    } catch (e) {
      console.error(e);
    }
    var initItems = fs.readdirSync(path.join(__dirname, 'init/'));
    initItems.forEach(item => {
      var fpath = path.join(__dirname, 'init/', item);
      var f = fs.readFileSync(fpath);
      fs.writeFileSync(path.join(appFolder, item), f);
    })
  }
})

function getSourcePath() {
  return new Promise(function(resolve, reject) {
    if (package.reactEmbedded && package.reactEmbedded.path && fs.existsSync(path.join(process.cwd(),package.reactEmbedded.path))) {
      console.log('Found source path: '+chalk.blue(package.reactEmbedded.path));
      resolve(path.join(process.cwd(),package.reactEmbedded.path))
    } else {
      console.log('No source path. Would you like to create one?');
      prompt.get({
        properties:{
          source:{
            description:"Choose source path",
            default:'src/',
            required:false
          }
        }
      }, function(e, result) {
        var sourcePath = path.join(process.cwd(),result.source);

        package.reactEmbedded = {
          path:result.source.toString()
        }
        fs.writeFileSync('package.json', JSON.stringify(package, null, 2))

        if (fs.existsSync(sourcePath)) {
          console.error('Source path already exists at ', chalk.blue(result.source.toString()));
          resolve(sourcePath)
        } else {
          try {
            fs.mkdirSync(sourcePath);
            resolve(sourcePath)
          } catch (e) {
            console.error(e);
            reject(e);
          }
        }
      })
    }
  });
}
