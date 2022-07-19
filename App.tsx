import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import React, { useEffect, useState } from 'react';
import {Buffer} from 'buffer';

export default function App() {

  const [flights, setFlights] = useState([]);

  const chicago = [41.739, -87.554]

  const getFlights = async () => {
    try {
      // TODO: haversine :(
      const resp = await fetch(`https://opensky-network.org/api/states/all?lamin=40.839679636275456&lomin=-88.75914529577126&lamax=42.63832036372454&lomax=-86.34885470422874`,
        {
          method: 'GET',
          // TODO: FIX SECRETS ;)
          // headers: {'Authorization': 'Basic ' + Buffer.from('uname:password').toString('base64')}
        })

    const json = await resp.json();
    const states = json['states']
    
    const filtered = states.map((e: any) => {
      return {
        icao24: e[0],
        callSign: e[1],
        time: e[2],
        lastContact: e[3],
        longitude: e[5],
        latitude: e[6],
      }
    })
    setFlights(filtered)
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
        latitude: chicago[0],
        longitude: chicago[1],
        latitudeDelta: 0.0922,
        longitudeDelta: 0.0421,
      }}
    >
      {/* TODO: typescript object baby */}
      {flights.map(e => (
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
