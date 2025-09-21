import { airplaneIcon } from "../models/icons";
import 'leaflet-rotatedmarker';
import { useState } from "react";
import { Marker, Popup } from 'react-leaflet'
import Loader from "./Loader";


export default function FlightMarker({ flight }) {
    const backendUrl = import.meta.env.VITE_API_URL
    const [loaded, setLoaded] = useState(false);
    const [flightData, setFlightData] = useState<any>(null);
    const flightAwareLink = `${backendUrl}?route=flightawareGetFlightInfo&callSign=${flight.callSign}`

    async function loadFlight() {
        const resp = await fetch(flightAwareLink);
        const r = await resp.json();
        setFlightData(r);
        setLoaded(true);
    }

    return (
        <Marker key={flight.icao24} position={[flight.latitude, flight.longitude]} icon={airplaneIcon} rotationAngle={flight.heading}>
            <Popup eventHandlers={{ add: loadFlight }}>
                {loaded ? (
                    <>
                        <div>{flightData.airline} - {flight.callSign}</div>
                        <div>{flightData.origin.iata} - {flightData.origin.name}</div>
                        <div>{flightData.destination.iata} - {flightData.destination.name}</div>
                        <div>{flight.secondsStale()} sec</div>
                    </>

                ) : (
                    <Loader size = "20px"/>
                )
                }
            </Popup>
        </Marker>
    )
}
