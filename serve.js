#!/usr/bin/env node

/* Server */
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

var filePath = package.reactEmbedded.path || 'src';
var jsFileName = path.join( filePath, package.reactEmbedded.index || 'index.js' ) ;
var cssFileName = path.join( filePath, package.reactEmbedded.css || 'style.css' );

/* Server */
var express = require('express');
var app = express();
var server = require('http').Server(app);
var io = require('socket.io')(server);

const watcher = require('chokidar').watch(path.join(process.cwd(), filePath))

server.listen(8080);

app.get('/', (req, res) => {
  BundleCode().then(code => {
    BundleHTML(code).then( r => {
      res.send(r.whole)
    })
  })
})

app.get('/a/:app', (req, res) => {
  var f = path.join(package.reactEmbedded.path||'src',req.params.app)
  if (fs.existsSync(f) && fs.lstatSync(f).isDirectory()) {
    if (fs.existsSync(path.join(f,'index.js')) && fs.existsSync(path.join(f,'style.css')) ) {

      BundleCode().then(code => {
        BundleHTML(code).then( r => {
          res.send(r.whole)
        })
      })

    } else {
      res.send({status:'error',message:"no 'index.js' or 'style.css' file in source"})
    }
  } else {
    res.send({status:'error',message:"I doesn't seem to be an app: "+req.params.app})
  }
})

app.get('/assets/:file', (req, res) => {
  var f = path.join(__dirname,'assets',req.params.file)
  var text = fs.readFileSync(f);
  res.send(text)
})

io.on('connection', function (socket) {
  watcher.on('all', (event, e) => {
    socket.emit('updating',true);
    BundleCode().then(code => {
      socket.emit('component', code)
    })
  })
  socket.on('build', function (data) {
    BundleCode().then(code => {
      BundleHTML(code).then(html => {
        socket.emit('build', html.output)
      })
    })
  });
});

function BundleCode(){
  return new Promise(function(resolve, reject) {
    var b = browserify();
    b.add(jsFileName);
    b.transform("babelify", {presets: ["@babel/preset-env", "@babel/preset-react"]})
    b.transform("uglifyify", {global:true})
    b.bundle( (e, buffer) => {
      if (e) return console.log(e);
      var code = buffer.toString();
      resolve(code)
    })
  });
}
function BundleHTML(code, production=false) {
  return new Promise(function(resolve, reject) {
    var html = fs.readFileSync(path.join(__dirname, '/assets/dev.index.html'))
    var css = fs.readFileSync(cssFileName);
    var js = fs.readFileSync(jsFileName)

    var el = new jsdom.JSDOM(html);
    var doc = el.window.document;
    doc.getElementById('embedded-bundle').innerHTML=code;
    doc.getElementById('embedded-style').innerHTML=css;

    if (production===true) {
      doc.getElementById('embedded-script-react').innerHTML = fs.readFileSync(path.join(__dirname, 'assets/react.production.min.js'));
      doc.getElementById('embedded-script-react-dom').innerHTML = fs.readFileSync(path.join(__dirname, 'assets/react-dom.production.min.js'));
    }
    /* inject html code to copy and paste */
    var wholeHTML = Mustache.render(
      doc.getElementsByTagName('html')[0].outerHTML,
      {
        name:'AppName'
      }
    )

    /* inject html code to copy and paste */
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
    doc.getElementById('embed-text').innerHTML=outputHTML;
    resolve({whole:wholeHTML, output:outputHTML})
  });
}

console.log(chalk.bold.blue('Check out your embedded code at \n'));
console.log(chalk.blue('          http://localhost:8080\n'));
