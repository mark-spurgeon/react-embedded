
import Comp from './comps.js'

class Index extends React.Component {
  render() {
    return (
      <div>
        <h1>This is a chart</h1>
        <p>10%;</p>
        <Comp />
      </div>
    )
  }
};
export default Index;

  ReactDOM.render(
    <Index />,
    document.querySelector("#embedded-component")
  );
