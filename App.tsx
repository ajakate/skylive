import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View } from 'react-native';
import MapView, { Marker } from 'react-native-maps';

export default function App() {
  return (
    <MapView
      style={styles.container}
      initialRegion={{
        latitude: 41.739,
        longitude: -87.554,
        latitudeDelta: 0.0922,
        longitudeDelta: 0.0421,
      }}
    >
    <Marker
      key="1"
      coordinate={{latitude: 41.739, longitude: -87.554}}
      title="TEST TITLE"
      description="TEST DESCRIPTION"
    />
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
