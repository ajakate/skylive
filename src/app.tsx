import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import React, { useEffect, useState } from 'react';
import { Buffer } from 'buffer';
import Flight from './models/flight';
import { EarthLocation } from './models/earth-location';
import * as Location from 'expo-location';
import { OPENSKY_CREDS } from '@env'
import FlightMarker from './components/flight-marker';

// TODO: extract utils for http
// TODO: reloading refactor
// TODO: fix styling button
// TODO: fix loading screen
export default function SkyLive() {

	const [flights, setFlights] = useState([]);
	const [location, setLocation] = useState(EarthLocation.null());
	const [loading, setLoading] = useState(true);
	const [reloading, setReloading] = useState(false)

	const getLocation = async () => {
		let { status } = await Location.requestForegroundPermissionsAsync();
		if (status !== 'granted') {
			return;
		}

		let fetched = await Location.getCurrentPositionAsync({});
		let loc = new EarthLocation(fetched.coords.latitude, fetched.coords.longitude)
		setLocation(loc);
	}

	const getFlights = async () => {
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
		getFlights();
	}

	useEffect(() => {
		getLocation();
	}, []);

	useEffect(() => {
		getFlights();
	}, [location]);

	return !loading ? (
		<View style={{ flex: 1 }}>
			<MapView
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
				style={{
					position: 'absolute',
					bottom: '15%',
					left: '5%',
					alignSelf: 'flex-end'
				}}
			>
				<TouchableOpacity
					disabled={reloading}
					activeOpacity={reloading ? 0.5 : 1}
					onPress={reloadFlights}
					style={{
						height: 60,
						width: 125,
						alignItems: "center",
						backgroundColor: "#79ffb0",
						padding: 10,
						borderRadius: 10,
						borderWidth: 5,
						borderColor: "blue",
					}}>
					<Text style={{ fontSize: 20 }}>{reloading ? "Loading..." : "Reload"}</Text>
				</TouchableOpacity>
			</View>
		</View>
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
