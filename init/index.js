/*
  Copyright © 2019 <maintainer>
  This file has been initialised by React-Embedded
  Feel free to remove the comments, every line of code helps.
*/

/* Classic React component */
class Index extends React.Component {
  render() {
    return (
      <div>
        <h1>Title</h1>
        <p>10%;</p>
      </div>
    )
  }
};

/* Push the component to HTML */
ReactDOM.render(
  <Index />,
  document.querySelector("#embedded-component")
);
