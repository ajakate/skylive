import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import React, { useEffect, useState, useRef } from 'react';
import { Buffer } from 'buffer';
import Flight from './models/flight';
import { EarthLocation } from './models/earth-location';
import * as Location from 'expo-location';
import { OPENSKY_CREDS } from '@env'
import FlightMarker from './components/flight-marker';
import LoadingScreen from './components/loading-screen';

export default function SkyLive() {

	const [flights, setFlights] = useState([]);
	const [location, setLocation] = useState(EarthLocation.null());
	const [loading, setLoading] = useState(true);
	const [reloading, setReloading] = useState(false)
	let mapRef = useRef(null)
	let reloadButtonOpacity = reloading ? 0.2 : 1

	const getLocation = async (loadFlights: boolean) => {
		let { status } = await Location.requestForegroundPermissionsAsync();
		if (status !== 'granted') {
			return;
		}

		let fetched = await Location.getCurrentPositionAsync({});
		let loc = new EarthLocation(fetched.coords.latitude, fetched.coords.longitude)
		setLocation(loc);
		if (loadFlights) {
			getFlights(loc);
		}
	}

	const getFlights = async (location: EarthLocation) => {
		if (location.isNull) {
			return;
		}
		const box = location.box(100)
		try {
			const resp = await fetch(
				`https://opensky-network.org/api/states/all?lamin=${box.minLat}&lomin=${box.minLong}&lamax=${box.maxLat}&lomax=${box.maxLong}`,
				{
					method: 'GET',
					headers: { 'Authorization': 'Basic ' + Buffer.from(OPENSKY_CREDS).toString('base64') }
				}
			)
			const json = await resp.json();
			const liveFlights = json['states'].map((state: any) => Flight.fromOpensky(state))
			setFlights(liveFlights)
			setLoading(false)
			setReloading(false)
		} catch (e) {
			console.log('http error:', e)
		}
	}

	const reloadFlights = () => {
		setReloading(true);
		getFlights(location);
		getLocation(false);
	}

	useEffect(() => {
		getLocation(true);
	}, []);

	useEffect(() => {
		if (mapRef.current) {
			mapRef.current.animateToRegion({
				latitude: location.latitude,
				longitude: location.longitude,
				latitudeDelta: mapRef.current.__lastRegion.latitudeDelta,
				longitudeDelta: mapRef.current.__lastRegion.longitudeDelta
			})
		}
	}, [location]);

	return !loading ? (
		<View style={{ flex: 1 }}>
			<MapView
				ref={mapRef}
				style={styles.container}
				initialRegion={{
					latitude: location.latitude,
					longitude: location.longitude,
					latitudeDelta: 0.2,
					longitudeDelta: 0.0421,
				}}>
				<Marker
					key={"0"}
					tracksViewChanges={false}
					coordinate={{ latitude: location.latitude, longitude: location.longitude }}
				/>
				{flights.map((f: Flight) => <FlightMarker key={f.icao24} flight={f} />)}
			</MapView>
			<View
				style={styles.view}>
				<TouchableOpacity
					disabled={reloading}
					onPress={reloadFlights}
					style={{ ...styles.reload, opacity: reloadButtonOpacity }}>
					<Text style={{ fontSize: 20, color: 'white' }}>{reloading ? "Loading..." : "Reload"}</Text>
				</TouchableOpacity>
			</View>
		</View>
	) : <LoadingScreen />
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: '#fff',
		alignItems: 'center',
		justifyContent: 'center',
	},
	view: {
		position: 'absolute',
		bottom: '5%',
		left: '50%',
		alignSelf: 'flex-end',
	},
	reload: {
		height: 60,
		width: 125,
		right: 63,
		alignItems: "center",
		backgroundColor: "black",
		padding: 10,
		borderRadius: 10,
		borderWidth: 5,
		borderColor: "black",
	}
});
