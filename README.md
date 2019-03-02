react-embedded
=======

A tool to build standalone React component that embeds in publishing platforms like Wordpress.


## Install


`npm i -D react-embedded`

## Edit your `package.json`

```json

{
  "name":"AppName",
  "scripts": {
    "start":"react-embedded"
  },
  "reactEmbedded": {
    "index":"src/index.js",
    "css":"src/style.css"
  }
}
```

## Run


`npm start `

This will run a server which will generate your code each time you go to http://localhost:8080

## Code - `index.js`

```javascript

import TextInput from './TextInput'

class Index extends React.Component {
  render() {
    return (
      <div>
        <h1>Chart</h1>
        <p>10% increase</p>
        <TextInput />
      </div>
    )
  }
};

ReactDOM.render(
  <Index />,
  document.getElementById("embedded")
);

```

> Don't import 'react' or 'react-dom', as this will needlessly slow down the process.

## Why ?

React is a language that allows quick building of user interfaces. The only problem is that it takes a lot of configuration, making it difficult to just copy/paste React apps onto publishing platforms like Wordpress.

This very simple tool does just that.

## todo:

* take into account a directory: means that it has to take decisions on a specific file structure ✌️
* Choose minified/non-minified version, as Wordpress messes up the charset with JS, it's best to access main js libs from outside. ✍️

## Resources for data visualisation libraries & other stuff

*Top to bottom : order of up-to-dateness*

* [__victory__ - up to date](https://github.com/FormidableLabs/victory)
* [__nivo__ - package for each chart, which is nice](https://github.com/plouc/nivo)
* [__bizcharts__ - up to date, chinese language but alright for coding](https://github.com/alibaba/BizCharts)
* [__recharts__ - D3, pretty up to date](https://github.com/recharts/recharts)
* [__chartjs__ - not updated since last year](https://github.com/reactjs/react-chartjs)
