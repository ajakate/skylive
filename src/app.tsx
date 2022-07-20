import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View, ActivityIndicator, Image } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import React, { useEffect, useState } from 'react';
import {Buffer} from 'buffer';
import Flight from './models/flight';
import { EarthLocation } from './models/earth-location';
import * as Location from 'expo-location';

const planeImage = require('./assets/airplane.png')

export default function SkyLive() {

  const [flights, setFlights] = useState([]);
  const [location, setLocation] = useState(EarthLocation.null());
  const [loading, setLoading] = useState(true);

  const getLocation = async () => {
    let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        return;
      }

      let fetched = await Location.getCurrentPositionAsync({});

      let loc = new EarthLocation(fetched.coords.latitude, fetched.coords.longitude)
      setLocation(loc);
      getFlights(loc);
  }

  const getFlights = async (loc:EarthLocation) => {
    const box = loc.box(100)

        try {
            const resp = await fetch(`https://opensky-network.org/api/states/all?lamin=${box.minLat}&lomin=${box.minLong}&lamax=${box.maxLat}&lomax=${box.maxLong}`)
            const json = await resp.json();
            const liveFlights = json['states'].map((state: any) => Flight.fromOpensky(state))
            setFlights(liveFlights)
            setLoading(false)
        } catch (e) {
            console.log(e)
        }
  }

  useEffect(() => {
      getLocation();
  }, []);

  return !loading ? (
    <MapView
        style={styles.container}
        initialRegion={{
          latitude: location.latitude,
          longitude: location.longitude,
          latitudeDelta: 0.2,
          longitudeDelta: 0.0421,
        }}>
        {flights.map((e:Flight) => (
            <Marker
                key={e.icao24}
                tracksViewChanges={false}
                image={planeImage}
                coordinate={{latitude: e.latitude, longitude: e.longitude}}
                title={e.callSign}
                description={e.icao24}
                style={{transform: [{rotate: `${e.heading}deg`}],}}  
            >
            </Marker>
        ))}
    </MapView>
  ) : (<Text>loading...</Text>)
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  images: {
    flex: 1,
    width: 50,
    height: 50,
  }
});
