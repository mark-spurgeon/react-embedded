react-embedded
=======

A tool to build standalone React component that embeds in publishing platforms like Wordpress.

> This project is in its early phase. Please use this to test, improve,..., but be aware that there might be bugs or it might not work as you'd expect it to.

## Install (after initialising an npm environment)

`npm i -D react-embedded`

## Edit your `package.json`

```json

{
  "name":"AppName",
  "scripts": {
    "start":"rembedded",
    "init":"rembedded:init"
  }
}
```

## Initialise a React-Embedded app

```bash

npm run init first-app

```

## Run


`npm start `

This will run a server at localhost:8080, where you will be able to chose your appss


## Why ?

React is a language that allows quick building of user interfaces. The only problem is that it takes a lot of configuration, making it difficult to just copy/paste React apps onto publishing platforms like Wordpress.

This very simple tool does just that.

### todo:

* take into account a directory: means that it has to take decisions on a specific file structure ✌️
* Choose minified/non-minified version, as Wordpress messes up the charset with JS, it's best to access main js libs from outside. ✍️

### Resources for data visualisation libraries & other stuff

*Top to bottom : order of up-to-dateness*

* [__victory__ - up to date](https://github.com/FormidableLabs/victory)
* [__nivo__ - package for each chart, which is nice](https://github.com/plouc/nivo)
* [__bizcharts__ - up to date, chinese language but alright for coding](https://github.com/alibaba/BizCharts)
* [__recharts__ - D3, pretty up to date](https://github.com/recharts/recharts)
* [__chartjs__ - not updated since last year](https://github.com/reactjs/react-chartjs)
