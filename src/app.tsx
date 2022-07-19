import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import React, { useEffect, useState } from 'react';
import {Buffer} from 'buffer';
import Flight from './models/flight';
import { EarthLocation } from './models/earth-location';


export default function SkyLive() {

  const [flights, setFlights] = useState([]);

  const chicago = new EarthLocation(41.739, -87.554)
  const box = chicago.box(100)

  const getFlights = async () => {
    try {
      const resp = await fetch(
        `https://opensky-network.org/api/states/all?lamin=${box.minLat}&lomin=${box.minLong}&lamax=${box.maxLat}&lomax=${box.maxLong}`,
        {
          method: 'GET',
          // TODO: FIX SECRETS ;)
          // headers: {'Authorization': 'Basic ' + Buffer.from('uname:password').toString('base64')}
        })

    const json = await resp.json();
    const liveFlights = json['states'].map((state: any) => Flight.fromOpensky(state))
    setFlights(liveFlights)
    } catch (e) {
      console.log(e)
    }
  }

  useEffect(() => {
    getFlights();
  }, []);

  return (
    <MapView
      style={styles.container}
      initialRegion={{
        latitude: chicago.latitude,
        longitude: chicago.longitude,
        latitudeDelta: 0.0922,
        longitudeDelta: 0.0421,
      }}
    >
      {flights.map((e:Flight) => (
        <Marker
        key={e.icao24}
        coordinate={{latitude: e.latitude, longitude: e.longitude}}
        title={e.callSign}
        description={e.icao24}
        />
      ))}
    </MapView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
