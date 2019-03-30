# react-embedded

A tool to build standalone React component that embeds in publishing
platforms like Wordpress.

> This project is in its early phase. Please use this to test, improve,...,
>   but be aware that there might be bugs or it might not work as you'd
>   expect it to.

## Install

`npm i -D react-embedded` or `yarn add --dev react-embedded`

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

\## Initialise a React-Embedded app

```bash
yarn init first-app
```

## Run

`yarn start`

This will run a server at localhost:8080, where you will be able to
view your app

## Why ?

React is a language that allows quick building of user interfaces.
The only problem is that it takes a lot of configuration, making it difficult
to just copy/paste React apps onto publishing platforms like Wordpress.

This very simple tool does just that.

* * *

## todo

-   take into account a directory: means that it has to take decisions on s
    specific file structure ✌️

-   Bundling Error handling ✌️

-   Include other ways to build component, like d3 ? --> perhaps à 'recipe'
    system, where you would install that and specify, much like @now builders

## Resources for data visualisation libraries & other stuff

_Top to bottom : order of up-to-dateness_

-   [**victory** - up to date](https://github.com/FormidableLabs/victory)
-   [**nivo** - package for each chart, which is nice](https://github.com/plouc/nivo)
-   [**bizcharts** - up to date, chinese language but alright for coding](https://github.com/alibaba/BizCharts)
-   [**recharts** - D3, pretty up to date](https://github.com/recharts/recharts)
-   [**chartjs** - not updated since last year](https://github.com/reactjs/react-chartjs)
