#!/usr/bin/env node

/* Stuff */
const opn = require('opn');
const chalk = require('chalk');
const path = require('path');
const fs = require('fs');

/* Transforming code */
const Mustache = require('mustache');
const sass = require('node-sass');

/* Server */
const express = require('express');
const app = express();
const server = require('http').Server(app);
const io = require('socket.io')(server);

const {
  getBundler,
  BundleComponent,
  BundleStyle,
  BundleDevelopmentHTML,
  BundleErrorMessageHTML,
  BundleProductionHTML
} = require('./src/bundler');
var Files = require('./src/files')

const watcher = require('chokidar').watch(path.join(process.cwd(), Files.source),{ignored: /\.(js|mjs|jsx)$/});

let bundlers = {} // store bundlers for each app

/*
  Server routes
*/
/* Homepage - List of apps in directory */
app.get('/', (req, res) => {
  let appsList = [];
  const apps = fs.readdirSync(path.join(process.cwd(), Files.source));
  apps.forEach(a => {
    const appDirectory = path.join(process.cwd(), Files.source, a);
    if (fs.lstatSync(appDirectory).isDirectory()) {
      const appFilePath = path.join(appDirectory,Files.jsPattern);
      if (fs.existsSync(appFilePath)) {
        appsList.push({
          name:a,
          link:'/a/'+a
          // other things ?
        })
      } else {
        console.error("No js file found for app ", a);
      }
    } else {
      console.log('No apps found');
    }
  })
  let devCSS='';
  try {
    devCSS = sass.renderSync({data:fs.readFileSync(path.join(Files.assets, "dev.scss")).toString()}).css;
  }
  catch(e) {console.error(e);}
  const template = fs.readFileSync(path.join(Files.assets,'dev.directory.html')).toString();
  var renderedHTML = Mustache.render(
    template,
    {
      apps:appsList,
      devcss:devCSS
    }
  );
  res.send(renderedHTML)
})
/* App - List of apps in directory */
app.get('/a/:app', (req, res) => {
  const appName = req.params.app;
  const appDirectory = path.join(Files.source,appName)
  if (fs.existsSync(appDirectory) && fs.lstatSync(appDirectory).isDirectory()) {
    if (fs.existsSync(path.join(appDirectory,Files.jsPattern))) {
      BundleDevelopmentHTML(appName).then(html => {
        res.send(html)
      })
    } else {
      res.send({status:'error',message:"no 'index.js' or 'style.css' file in source"})
    }
  } else {
    res.send({status:'error',message:"I doesn't seem to be an app: "+req.params.app})
  }
})
/* Assets Directory */
app.use('/assets/',express.static(Files.assets) )

/*
  Socket IO
  Events between server, detecting new code, and
  client
*/
io.on('connection', function (socket) {
  /* Hot reload - CSS (with Chokidar) */
  watcher.on('all', (event, e) => {
    if (!Files.source.endsWith('/')){Files.source+="/"}
    var appname = e.replace(path.join(process.cwd(),Files.source), '').split('/')[0];
    if (e.endsWith('.css') || e.endsWith('.scss')) {
      socket.emit('restyling',true);
      var cssFileName=path.join(Files.source,appname, Files.cssPattern)
      BundleStyle(cssFileName).then(css => {
        socket.emit('css', css)
      })
    }
  })
  /* JS render request */
  socket.on('js', function (appname) {
    var jsFilePath=path.join(Files.source,appname, Files.jsPattern)
    var b = bundlers[jsFilePath] = getBundler(jsFilePath);
    /* Hot reload - JS (with Browserify) */
    b.on('update', function() {
      socket.emit('updating',true)
      BundleComponent(b, jsFilePath)
        .then(code => {socket.emit('js',code)})
        .catch(error => {
          BundleErrorMessageHTML(error)
            .then(e=>{socket.emit('bundling-error', e)})
        })
    })
    /* Bundle start */
    BundleComponent(b, jsFilePath)
      .then(code => {socket.emit('js', code)})
      .catch(error => {
        BundleErrorMessageHTML(error)
          .catch(e=>{console.log('couldnt bundle error', e)}) // should never happen
          .then(e=>{socket.emit('bundling-error', e)})
      })
  });
  /* CSS render request */
  socket.on('css', function (appName) {
    socket.emit('restyling',true);
    var cssFilePath=path.join(Files.source,appName, Files.cssPattern)
    BundleStyle(cssFilePath).then(css => {
      socket.emit('css', css)
    })
  });
  /* Component build request */
  socket.on('build', function (appName) {
    var jsFilePath=path.join(Files.source,appName, Files.jsPattern)
    var cssFilePath=path.join(Files.source,appName, Files.cssPattern);
    var b = bundlers[jsFilePath] || getBundler(jsFilePath);
    BundleComponent(b, jsFilePath).then(code => {
      BundleStyle(cssFilePath).then(css => {
        BundleProductionHTML(appName, code, css).then(html => {
          socket.emit('build', html)
        })
      })
    })
  });
});

/* Server */
server.listen(8080, (e) => {
  if (e) {console.error(e);}
  console.log(chalk.bold.blue('Check out your embedded code at \n'));
  console.log(chalk.blue('          http://localhost:8080\n'));
  //opn("http://localhost:8080/")
});
