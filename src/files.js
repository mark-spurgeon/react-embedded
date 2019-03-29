const fs = require('fs');
const path = require('path')

const package = JSON.parse(fs.readFileSync('package.json', 'utf8')) // get local package

const sourcePath = package.reactEmbedded.path || 'src';
const jsFilePattern = package.reactEmbedded.js || 'index.js';
const cssFilePattern = package.reactEmbedded.style || 'style.scss';
const includeFilePattern = package.reactEmbedded.include || 'include.html';

const assetsPath = path.join(__dirname, "../assets/");

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
