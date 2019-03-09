#!/usr/bin/env node

/* Stuff */
var opn = require('opn');
var chalk = require('chalk');
var path = require('path');
var fs = require('fs');
var package = JSON.parse(fs.readFileSync('package.json', 'utf8'))

/* Transforming code */
var watchify = require('watchify');
var browserify = require('browserify');
var Mustache = require('mustache');
var minify = require('html-minifier').minify;
var sass = require('node-sass');

var sourcePath = package.reactEmbedded.path || 'src';
var jsFilePattern = 'index.js';
var cssFilePattern = 'style.scss';
var includeFilePattern = 'include.html';

/* Server */
var express = require('express');
var app = express();
var server = require('http').Server(app);
var io = require('socket.io')(server);

const watcher = require('chokidar').watch(path.join(process.cwd(), sourcePath),{ignored: /\.(js|mjs|jsx)$/});

var browserifies = {}

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
  var devCSS='';
  try {
    devCSS = sass.renderSync({data:fs.readFileSync(path.join(__dirname, "assets/dev.scss")).toString()}).css;
  } catch(e) {console.log(e);}
  var template = fs.readFileSync(path.join(__dirname, 'assets','dev.directory.html')).toString();
  var args = {
    apps:appList,
    devcss:devCSS
  }
  res.send(Mustache.render(template, args))
})

app.get('/a/:app', (req, res) => {
  var appname = req.params.app;
  var f = path.join(package.reactEmbedded.path||'src',appname)
  if (fs.existsSync(f) && fs.lstatSync(f).isDirectory()) {
    if (fs.existsSync(path.join(f,jsFilePattern)) && fs.existsSync(path.join(f,cssFilePattern)) ) {

      BundleApplicationHTML(appname).then(html => {
        res.send(html)
      })

    } else {
      res.send({status:'error',message:"no 'index.js' or 'style.css' file in source"})
    }
  } else {
    res.send({status:'error',message:"I doesn't seem to be an app: "+req.params.app})
  }
})

app.use('/assets/',express.static(path.join(__dirname, 'assets')) )

/* Socket IO - hot reload */
io.on('connection', function (socket) {
  let previousId;
  const safeJoin = currentId => {
    socket.leave(previousId);
    socket.join(currentId);
    previousId = currentId;
  };
  /* Chokidar event - CSS */
  watcher.on('all', (event, e) => {
    if (!sourcePath.endsWith('/')){sourcePath+="/"}
    var appname = e.replace(path.join(process.cwd(),sourcePath), '').split('/')[0];
    if (e.endsWith('.css') || e.endsWith('.scss')) {
      socket.emit('restyling',true);
      var cssFileName=path.join(sourcePath,appname, cssFilePattern)
      BundleCSS(cssFileName).then(css => {
        socket.emit('css', css)
      })
    }
  })
  /* JS render request */
  socket.on('js', function (appname) {
    var jsFileName=path.join(sourcePath,appname, jsFilePattern)
    var b = browserifies[jsFileName] = getBrowserify(jsFileName);
    b.on('update', function() {
      socket.emit('updating',true)
      BundleJS(b, jsFileName)
        .then(code => {socket.emit('js',code)})
        .catch(error => {BundleError(error).then(error=>{socket.emit('bundling-error', error)})})
    })

    BundleJS(b, jsFileName)
      .then(code => {socket.emit('js', code)})
      .catch(error => {
        BundleError(error)
          .catch(e=>{console.log('couldnt bundle error', e)})
          .then(err=>{socket.emit('bundling-error', err)})
      })
  });
  /* CSS render request */
  socket.on('css', function (appname) {
    socket.emit('restyling',true);
    var cssFileName=path.join(sourcePath,appname, cssFilePattern)
    BundleCSS(cssFileName).then(css => {
      socket.emit('css', css)
    })
  });
  /* Component build request */
  socket.on('build', function (appname) {
    var jsFileName=path.join(sourcePath,appname, jsFilePattern)
    var cssFileName=path.join(sourcePath,appname, cssFilePattern);
    var b = browserifies[jsFileName];
    if (!b) {b=getBrowserify(jsFileName)};
    BundleJS(b, jsFileName).then(code => {
      BundleCSS(cssFileName).then(css => {
        BundleOutputHTML(appname, code, css, production=true).then(html => {
          socket.emit('build', html)
        })
      })
    })
  });
});

/* Bundling functions */
/* CSS bundle (sass) */
function BundleCSS(cssFileName) {
  return new Promise(function(resolve, reject) {
    if (fs.existsSync(cssFileName)) {
      var css = fs.readFileSync(cssFileName).toString();
      try {
        var result = sass.renderSync({data:css});
        resolve(result.css.toString());
      } catch (e) {
        reject(e)
      }
    } else {
      console.error('No css file named %s', cssFilePattern)
    }
  });
}
/* JS bundle (browserify & babel)*/
function BundleJS(bundler, jsFileName){
  return new Promise(function(resolve, reject) {
      bundler.add(jsFileName);
      bundler.transform("babelify", {presets: ["@babel/preset-env", "@babel/preset-react"], plugins:['recharts']})
      bundler.transform("uglifyify", {global:true})
      bundler.bundle( (e, buffer) => {
        if (e) {
          reject(e);
        } else {
          var code = buffer.toString();
          resolve(code)
        }
      }).on('error', e => {
        reject(e)
      })
  });
}
/* Bundle Component */
function BundleOutputHTML(appname, code, css) {
  return new Promise(function(resolve, reject) {
    var html = fs.readFileSync(path.join(__dirname, '/assets/bundle.index.html')).toString();

    /* Include optional include tags */
    var includeFileName=path.join(sourcePath,appname, includeFilePattern);
    var include='';
    if (fs.existsSync(includeFileName)) {
      var include=fs.readFileSync(includeFileName).toString();
    }
    /* Include React scripts */
    var reactScript = fs.readFileSync(path.join(__dirname, 'assets/react.production.min.js'));
    var reactDomScript = fs.readFileSync(path.join(__dirname, 'assets/react-dom.production.min.js'));

    /* render html with variables */
    var wholeHTML = Mustache.render(
      html,
      {
        app:appname,
        include:include,
        code:code,
        css:css,
        reactScript:reactScript,
        reactDomScript:reactDomScript
      }
    )
    resolve(wholeHTML)
  });
}

function BundleError(e) {
  return new Promise(function(resolve, reject) {
    try {
      var html = fs.readFileSync(path.join(__dirname, '/assets/error.index.html')).toString();
      var Convert = require('ansi-to-html');
      var convert = new Convert({
        fg: '#000',
        bg: '#000',
        newline: true,
        escapeXML: false,
        stream: false,
        spaces:true
      });
      if (!e.loc) {
        e.loc={line:'...',column:'...'}
      }
      var formattedHTML = Mustache.render(
        html,
        {
          error:convert.toHtml(e.message.toString())/*.replace('\n','<br/>').replace(new RegExp("/^[0-9]*$/i", "gm"),'<br/>')*/,
          type:e.name,
          code:e.code || '..',
          line:e.loc.line || '..',
          column:e.loc.column || '..',
          filename:e.filename || '..',
        }
      )
      resolve({
        error:e,
        data:{name:e.name, message:e.message},
        html:formattedHTML
      })
    } catch (e) {
      reject(e)
    }
  });
}

function BundleApplicationHTML(appname) {
  return new Promise(function(resolve, reject) {
    var html = fs.readFileSync(path.join(__dirname, '/assets/dev.index.html')).toString();

    /* development css from sass*/
    var devCSS='';
    try {
      devCSS = sass.renderSync({data:fs.readFileSync(path.join(__dirname, "assets/dev.scss")).toString()}).css;
    } catch(e) {console.log(e);}

    var includeFileName=path.join(sourcePath,appname, includeFilePattern);
    var include='';
    if (fs.existsSync(includeFileName)) {
      var include=fs.readFileSync(includeFileName).toString();
    }
    var wholeHTML = Mustache.render(
      html,
      {
        app:appname,
        include:include,
        devcss:devCSS
      }
    )

    resolve(wholeHTML)
  });
}

/* configure the browserify bundler */
function getBrowserify(jsFileName) {
  var b = watchify(browserify(Object.assign({}, watchify.args, {
    entries:jsFileName,
    cache : {}, // <---- here is important things for optimization
    packageCache : {}, // <----  and here
    libs: {
      src:['./libs/*.js']
    },
    options: {
      alias: [
        './libs/recharts.js:recharts',
        './libs/react.production.min.js:react',
        './libs/react-dom.production.min.js:react-dom'
      ],
      external:[
        './libs/recharts.js',
        './libs/react.production.min.js',
        './libs/react-dom.production.min.js'
      ]
    }
  })));
  //b.on('error', e=> {console.log(e);})
  return b
}
/* Server */
server.listen(8080, (e) => {
  if (e) {console.error(e);}
  console.log(chalk.bold.blue('Check out your embedded code at \n'));
  console.log(chalk.blue('          http://localhost:8080\n'));
  opn("http://localhost:8080/")
});
