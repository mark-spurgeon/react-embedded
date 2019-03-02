#!/usr/bin/env node

/* Stuff */
var opn = require('opn');
var chalk = require('chalk');
var path = require('path');
var fs = require('fs');
var package = JSON.parse(fs.readFileSync('package.json', 'utf8'))

/* Transforming code */
var request = require('request');
var jsdom = require('jsdom');
var browserify = require('browserify');
var Mustache = require('mustache');
var minify = require('html-minifier').minify;
var sass = require('node-sass');

var sourcePath = package.reactEmbedded.path || 'src'
var jsFilePattern = 'index.js'
var cssFilePattern = 'style.scss'


/* Server */
var express = require('express');
var app = express();
var server = require('http').Server(app);
var io = require('socket.io')(server);

const watcher = require('chokidar').watch(path.join(process.cwd(), sourcePath))

/* Server routes */
app.get('/', (req, res) => {
  var appList = []
  var apps = fs.readdirSync(path.join(process.cwd(), sourcePath));
  apps.forEach(a => {
    var appdir = path.join(process.cwd(), sourcePath, a);
    if (fs.lstatSync(appdir).isDirectory()) {
      if (fs.existsSync(path.join(appdir,jsFilePattern))) {
        appList.push({
          name:a,
          link:'/a/'+a
          // other things
        })
      } else {
        console.error("No js file found for app ", a);
      }
    } else {
      console.log('No apps found');
    }
  })
  var template = fs.readFileSync(path.join(__dirname, 'assets','dev.directory.html')).toString();
  var args = {
    apps:appList
  }
  res.send(Mustache.render(template, args))
})

app.get('/a/:app', (req, res) => {
  var appname = req.params.app;
  var f = path.join(package.reactEmbedded.path||'src',appname)
  if (fs.existsSync(f) && fs.lstatSync(f).isDirectory()) {
    if (fs.existsSync(path.join(f,jsFilePattern)) && fs.existsSync(path.join(f,cssFilePattern)) ) {

      var jsFileName=path.join(sourcePath,appname, jsFilePattern)
      var cssFileName=path.join(sourcePath,appname, cssFilePattern)
      BundleCode(jsFileName).then(code => {
        BundleCSS(cssFileName).then(css => {
          BundleHTML(appname, code, css).then( r => {
            res.send(r.whole)
          })
        })
      })

    } else {
      res.send({status:'error',message:"no 'index.js' or 'style.css' file in source"})
    }
  } else {
    res.send({status:'error',message:"I doesn't seem to be an app: "+req.params.app})
  }
})

app.use('/assets/',express.static(path.join(__dirname, 'assets')) )

/* Socket IO - */
io.on('connection', function (socket) {
  watcher.on('all', (event, e) => {
    if (!sourcePath.endsWith('/')){sourcePath+="/"}
    var appname = e.replace(path.join(process.cwd(),sourcePath), '').split('/')[0];
    if (e.endsWith('.js')) {
      socket.emit('updating',true);
      var jsFileName=path.join(sourcePath,appname, jsFilePattern)
      BundleCode(jsFileName).then(code => {
        socket.emit('component', code)
      })
    } else if (e.endsWith('.css') || e.endsWith('.scss')) {
      socket.emit('restyling',true);
      var cssFileName=path.join(sourcePath,appname, cssFilePattern)
      BundleCSS(cssFileName).then(css => {
        socket.emit('css', css)
      })
    }
  })
  socket.on('build', function (appname) {
    var jsFileName=path.join(sourcePath,appname, jsFilePattern)
    var cssFileName=path.join(sourcePath,appname, cssFilePattern)
    BundleCode(jsFileName).then(code => {
      BundleCSS(cssFileName).then(css => {
        BundleHTML(appname, code, css, production=true).then(html => {
          socket.emit('build', html.output)
        })
      })
    })
  });
});

/* Bundling functions */
function BundleCSS(cssFileName) {
  return new Promise(function(resolve, reject) {
    if (fs.existsSync(cssFileName)) {
      var css = fs.readFileSync(cssFileName).toString();
      var result = sass.renderSync({data:css});
      resolve(result.css.toString());
    } else {
      console.error('No css file named %s', cssFilePattern)
    }
  });
}
function BundleCode(jsFileName){
  return new Promise(function(resolve, reject) {
    if (fs.existsSync(jsFileName)) {
      var b = browserify();
      b.add(jsFileName);
      b.transform("babelify", {presets: ["@babel/preset-env", "@babel/preset-react"]})
      b.transform("uglifyify", {global:true})
      b.bundle( (e, buffer) => {
        if (e) return console.log(e);
        var code = buffer.toString();
        resolve(code)
      })
    } else {
      console.error("Error: no js file named '%s'", jsFilePattern);
    }
  });
}
function BundleHTML(appname, code, css, production=false) {
  return new Promise(function(resolve, reject) {
    var html = fs.readFileSync(path.join(__dirname, '/assets/dev.index.html'))

    var el = new jsdom.JSDOM(html);
    var doc = el.window.document;
    doc.getElementById('embedded-bundle').innerHTML=code;
    doc.getElementById('embedded-style').innerHTML=css;

    /* add code to import React and ReactDOM */
    if (production===true) {
      doc.getElementById('embedded-script-react').innerHTML = fs.readFileSync(path.join(__dirname, 'assets/react.production.min.js'));
      doc.getElementById('embedded-script-react-dom').innerHTML = fs.readFileSync(path.join(__dirname, 'assets/react-dom.production.min.js'));
    }
    /* inject html code to copy and paste */
    var wholeHTML = Mustache.render(
      doc.getElementsByTagName('html')[0].outerHTML,
      {
        app:appname
      }
    )
    /* minify html for minimum size */
    var outputText = doc.getElementById('embedded-body').outerHTML;
    var outputHTML = minify(outputText, {
      removeAttributeQuotes:true,
      collapseWhitespace:true,
      minifyCSS:true,
      removeComments:true,
      removeEmptyAttributes:true,
      trimCustomFragments:true,
      useShortDoctype:true
    })
    resolve({whole:wholeHTML, output:outputHTML})
  });
}

/* Server */
server.listen(8080, (e) => {
  if (e) {console.error(e);}
  console.log(chalk.bold.blue('Check out your embedded code at \n'));
  console.log(chalk.blue('          http://localhost:8080\n'));
  opn("http://localhost:8080/")
});
