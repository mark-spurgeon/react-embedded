#!/usr/bin/env node

/* Server */
var express = require('express');
var app = express();
var chalk = require('chalk');

/* IO */
var path = require('path');
var fs = require('fs');
var jsdom = require('jsdom');
var browserify = require('browserify');
var package = JSON.parse(fs.readFileSync('package.json', 'utf8'))
var Mustache = require('mustache');

var jsFileName = package.reactEmbedded.index || 'src/index.js';
var cssFileName = package.reactEmbedded.css || 'src/style.css';


app.get('/', function(req, res) {
  var html = fs.readFileSync(path.join(__dirname, '/assets/dev.index.html'))
  var css = fs.readFileSync(cssFileName);
  var js = fs.readFileSync(jsFileName)

  var b = browserify({standalone: 'Embedded'});
  b.add(jsFileName);
  b.transform("babelify", {presets: ["@babel/preset-env", "@babel/preset-react"]})
  b.transform("browserify-global-shim", {"react": "React", "react-dom":"ReactDOM"})
  b.bundle( (e, buffer) => {
    if (e) return console.log(e);
    /* inject js and css */
    var el = new jsdom.JSDOM(html);
    var doc = el.window.document;
    doc.getElementById('embedded-bundle').innerHTML=buffer.toString();
    doc.getElementById('embedded-style').innerHTML=css;

    /* inject html code to copy and paste*/
    var htmlText = doc.getElementById('embedded-body').outerHTML;
    doc.getElementById('embed-text').innerHTML=htmlText;

    var renderedHTML = Mustache.render(
      doc.getElementsByTagName('html')[0].outerHTML,
      {
        name:'AppName'
      }
    )
    res.send(renderedHTML)
  })
});
app.listen(8080);

console.log(chalk.bold.blue('Check out your embedded code at \n'));
console.log(chalk.blue('          http://localhost:8080\n'));
