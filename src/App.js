import './App.css';
import GoogleMapGrid from './comp/GoogleMapGrid';
import { Route } from 'react-router-dom';
import Home from './comp/Home';
import GoogleMapPlusCodeGrid from './comp/GoogleMapPlusCodeGrid';
import MapboxGrid from './comp/MapboxGrid';
import D3AreaGraph from './comp/D3AreaGraph';
import MapboxGridForGooglePlus from './comp/MapboxGridForGooglePlus';
import MapboxPoi from './comp/MapboxPoi';
import MapMapbox from './map/MapMapbox';


function App() {
  return (
    <div className="App">
      <Route path="/" exact={true} component={Home} />
      <Route path="/googleMapGrid" exact={true} component={GoogleMapGrid} />
      <Route path="/mapboxGrid" exact={true} component={MapboxGrid} />
      <Route path="/googleMapPlusCodeGrid"  exact={true} component={GoogleMapPlusCodeGrid} />
      <Route path="/d3AreaGraph"  exact={true} component={D3AreaGraph} />
      <Route path="/MapboxGridForGooglePlus"  exact={true} component={MapboxGridForGooglePlus} />
      <Route path="/MapboxPoi"  exact={true} component={MapboxPoi} />
      <Route path="/MapMapbox"  exact={true} component={MapMapbox} />

      
    </div>
  );
}

export default App;
