Setup a React-Embedded environment
======

This guide explains how to setup a React-Embedded environment, allowing you to easily develop React-powered code for your website.

If you've already set up React-Embedded, you can now build apps, [this guide](code.md) will help you out.

## Install Node and npm

You can download Node through their [website](https://nodejs.org/en/#download). However, on Linux or Mac platforms, you might prefer to install it via the terminal.

On a mac, install [homebrew](https://brew.sh/), then run :
`brew install node`.

NPM is a package manager, just like brew, for node projects. It is usually installed with node. To check if node and npm are installed, run :
```bash  

node -v && npm -v

```
Press enter twice and it should show both versions of node and npm

## Setup a React-Embedded folder

First, create an `node` environment by running `npm init -y`.

Then, install `react-embedded`:

```bash

npm install --save react-embedded

```

To initialize an app, you need to run the 'rembedded' script. To do this, add these scripts to your `package.json`
```json

{
  "scripts" : {
    "start":"rembedded",
    "init":"rembedded:init"
  }
}

```

Finally, create your app:

```bash
npm run init NewApp
```
This will create a 'NewApp' folder in 'src/' containing a `index.js` file that will include the React component and a `style.css` file.

----
## Run your app:
```bash
npm start
```
This will create a server. Access it at http://localhost:8080
