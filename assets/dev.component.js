import { hot } from 'react-hot-loader/root'

import App from './index'

var HotApp = hot(App);
ReactDOM.render(
  <HotApp />,
  document.querySelector("#embedded-component")
);
