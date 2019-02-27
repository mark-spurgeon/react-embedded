
import Comp from './comps.js'

class Index extends React.Component {
  render() {
    return (
      <div>
        <h1>Chart</h1>
        <p>10% increase</p>
        <Comp />
      </div>
    )
  }
};

ReactDOM.render(
  <Index />,
  document.getElementById("embedded")
);
