/* Boring Imports */
const fs = require('fs');
const path = require('path');

/* JS Bundler imports */
const browserify = require('browserify');
const watchify = require('watchify');

/* CSS Bundler imports */
const sass = require('node-sass');

/* HTML Bundler imports */
const Mustache = require('mustache');
const minify = require('html-minifier').minify;


var Files = require('./files.js')

/* Initialise browserify bundler */
function getBundler(jsFileName) {
  let bundler = watchify(browserify(Object.assign({}, watchify.args, {
    entries:jsFileName,
    cache : {},
    packageCache : {},
    /* the following is supposed to speed up bundling, testing for now,
      not everything may be useful
    */
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
  return bundler
}

/* Bundle Component (browserify) */
function BundleComponent(bundler, jsFileName, production=false){
  return new Promise(function(resolve, reject) {
      /* production bundle or not ? - add hmr or not */
      var tempSourceFileName = "dev.component.js"
      if (production===true) {
        var tempSourceFileName = "build.component.js"
      }
      var tempSourceFilePath = path.join(Files.assets, tempSourceFileName);
      var tempFilePath = path.join(jsFileName, '../temp.js');
      if (!fs.existsSync(tempFilePath)) {
        fs.copyFile(tempSourceFilePath, tempFilePath, (err) => {
          if (err) throw err;
        });
      }
      bundler.add(tempFilePath);
      /* babel transform for React component */
      bundler.transform("babelify", {
        presets: [
          "@babel/preset-env",
          "@babel/preset-react"
        ],
        plugins:[
          'recharts',
          'react-hot-loader/babel'
        ]
      })
      /* make the bundle smaller */
      if (production===true && Files.options.uglify!==false) {
        // --> uglify slows down hot reload by 10 seconds
        bundler.transform("uglifyify", {global:true})
      }
      /* bundle to text (not file) */
      bundler.bundle( (e, buffer) => {
        if (e) {
          reject(e);
        } else {
          var code = buffer.toString();
          resolve(code)
        }
      }).on('error', e => {
        console.error(e);
        reject(e)
      })
  });
}
/* Bundle Style (sass) */
function BundleStyle(cssFileName) {
  return new Promise(function(resolve, reject) {
    if (fs.existsSync(cssFileName)) {
      const css = fs.readFileSync(cssFileName).toString();
      try {
        var result = sass.renderSync({data:css});
        resolve(result.css.toString());
      } catch (e) {
        reject(e)
      }
    } else {
      console.error('No css file named %s', Files.cssPattern)
    }
  });
}

/* Bundle Development HTML */
function BundleDevelopmentHTML(appname) {
  return new Promise(function(resolve, reject) {
    var html = fs.readFileSync(path.join(Files.assets, 'dev.index.html')).toString();

    /* development css from sass*/
    var devCSS='';
    try {
      devCSS = sass.renderSync({data:fs.readFileSync(path.join(Files.assets, "dev.scss")).toString()}).css;
    } catch(e) {console.log(e);}

    var includeFileName=path.join(Files.source,appname, Files.includePattern);
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
/* Bundle Error Message HTML */
function BundleErrorMessageHTML(e) {
  return new Promise(function(resolve, reject) {
    try {
      var sourceHTML = fs.readFileSync(path.join(Files.assets, 'error.index.html')).toString();
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
      var completeHTML = Mustache.render(
        sourceHTML,
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
        html:completeHTML
      })
    } catch (e) {
      reject(e)
    }
  });
}
/* Bundle Build HTML */
function BundleProductionHTML(appname, code, css) {
  return new Promise(function(resolve, reject) {
    var sourceHTML = fs.readFileSync(path.join(Files.assets, 'build.index.html')).toString();

    /* Get optional include tags */
    var includeFileName=path.join(Files.source,appname, Files.includePattern);
    var include='';
    if (fs.existsSync(includeFileName)) {
      var include=fs.readFileSync(includeFileName).toString();
    }

    /* Get React scripts */
    var reactScript = fs.readFileSync(path.join(Files.assets, 'lib/react.production.min.js'));
    var reactDomScript = fs.readFileSync(path.join(Files.assets, 'lib/react-dom.production.min.js'));

    /* Render HTML with variables */
    var completeHTML = Mustache.render(
      sourceHTML,
      {
        app:appname,
        include:include,
        code:code,
        css:css,
        reactScript:reactScript,
        reactDomScript:reactDomScript
      }
    )
    resolve(`<iframe class="embedded-react" src="data:text/html;charset:utf-8,${escape(completeHTML)}"></iframe>`)
  });
}

module.exports = {
  getBundler,
  BundleComponent,
  BundleStyle,
  BundleDevelopmentHTML,
  BundleErrorMessageHTML,
  BundleProductionHTML
}
