import './App.css';
import GoogleMapGrid from './comp/GoogleMapGrid';
import { Route } from 'react-router-dom';
import Home from './comp/Home';
import GoogleMapPlusCodeGrid from './comp/GoogleMapPlusCodeGrid';
import MapboxGrid from './comp/MapboxGrid';
import D3AreaGraph from './comp/D3AreaGraph';

function App() {
  return (
    <div className="App">
      <Route path="/" exact={true} component={Home} />
      <Route path="/googleMapGrid" exact={true} component={GoogleMapGrid} />
      <Route path="/mapboxGrid" exact={true} component={MapboxGrid} />
      <Route path="/googleMapPlusCodeGrid"  exact={true} component={GoogleMapPlusCodeGrid} />
      <Route path="/d3AreaGraph"  exact={true} component={D3AreaGraph} />


    </div>
  );
}

export default App;
