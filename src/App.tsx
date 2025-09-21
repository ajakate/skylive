import './App.css'
import { useGeolocated } from "react-geolocated";

import LoadingComponent from './components/LoadingComponent';
import MapComponent from './components/MapComponent';
import Loader from './components/Loader';

const truncateCoordinate = (coordinate: number) => {
  return parseFloat(coordinate.toFixed(6))
}

function App() {

  const { coords, isGeolocationAvailable, isGeolocationEnabled, positionError, ...debug } =
    useGeolocated({
      positionOptions: {
        enableHighAccuracy: false,
      },
      userDecisionTimeout: 5000,
    });

  console.log("geolocationAvailable", isGeolocationAvailable);
  console.log("geolocationEnabled", isGeolocationEnabled);
  console.log("geoLocationData", coords);

  if (isGeolocationAvailable === false) {
    return <div>Geolocation is not supported by your browser</div>;
  }

  if (isGeolocationEnabled === false && positionError) {
    return  <LoadingComponent debug={debug} />;
  }

  if (coords) {
    return (
      <MapComponent
        latitude={truncateCoordinate(coords.latitude)}
        longitude={truncateCoordinate(coords.longitude)}
      />
    );
  }

  return (
    <div className="loading-main">
      <div style={{ marginBottom: "30px" }}>Fetching your location...</div>
      <Loader size="50px" />
    </div>
  )
}

export default App
