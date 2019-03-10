var fs = require('fs');
var path = require('path')

var package = JSON.parse(fs.readFileSync('package.json', 'utf8')) // get local package

var sourcePath = package.reactEmbedded.path || 'src';
var jsFilePattern = package.reactEmbedded.js || 'index.js';
var cssFilePattern = package.reactEmbedded.style || 'style.scss';
var includeFilePattern = package.reactEmbedded.include || 'include.html';

var assetsPath = path.join(__dirname, "../assets/");

module.exports = {
  /* user source file paths */
  source:sourcePath,
  jsPattern:jsFilePattern,
  cssPattern:cssFilePattern,
  includePattern:includeFilePattern,
  /* lib source file paths */
  assets:assetsPath,
  package:package,
  options:package.reactEmbedded
}
