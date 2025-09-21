import './App.css'
import { useGeolocated } from "react-geolocated";

import LoadingComponent from './components/LoadingComponent';
import MapComponent from './components/MapComponent';
import Loader from './components/Loader';

const truncateCoordinate = (coordinate: number) => {
  return parseFloat(coordinate.toFixed(6))
}

function App() {

  const { coords, isGeolocationAvailable, isGeolocationEnabled } =
    useGeolocated({
      positionOptions: {
        enableHighAccuracy: false,
      },
      userDecisionTimeout: 5000,
    });

  console.log("geolocationAvailable", isGeolocationAvailable);
  console.log("geolocationEnabled", isGeolocationEnabled);
  console.log("geoLocationData", coords);

  return !isGeolocationAvailable ? (
    <div>Your browser does not support Geolocation</div>
  ) : !isGeolocationEnabled ? (
    <LoadingComponent />
  ) : coords ? (
    <MapComponent
      latitude={truncateCoordinate(coords.latitude)}
      longitude={truncateCoordinate(coords.longitude)}
    />
  ) : (
    <div className="loading-main">
      <div style={{ marginBottom: "30px" }}>Fetching your location...</div>
      <Loader size="50px" />
    </div>
  );
}

export default App
