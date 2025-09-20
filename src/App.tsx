import './App.css'
import { useGeolocated } from "react-geolocated";

import LoadingComponent from './components/LoadingComponent';
import MapComponent from './components/MapComponent';

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

  if (isGeolocationAvailable && isGeolocationEnabled && coords?.latitude && coords?.longitude) {

    return (
      <MapComponent
        latitude={truncateCoordinate(coords.latitude)}
        longitude={truncateCoordinate(coords.longitude)}
      />
    )
  
  } else {
    console.log('Error getting geolocation');
    return (
      <LoadingComponent isGeolocationAvailable={isGeolocationAvailable} isGeolocationEnabled={isGeolocationEnabled} coords={coords}/>
    )
  }
}

export default App
