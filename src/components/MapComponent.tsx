import { useEffect, useState } from 'react'
import '../App.css'

import { MapContainer, Marker, Popup, TileLayer } from 'react-leaflet'
import 'leaflet-rotatedmarker';
import { EarthLocation } from '../models/earthLocation'
import Flight from '../models/flight'
import FlightMarker from './FlightMarker'

const getPlanesForBox = async (minLat: number, minLong: number, maxLat: number, maxLong: number) => {
    const backendUrl = import.meta.env.VITE_API_URL
    const response = await fetch(
      `${backendUrl}?route=openskyGetPlanes&lamin=${minLat}&lomin=${minLong}&lamax=${maxLat}&lomax=${maxLong}`
    );
    return await response.json();
}


export default function MapComponent({ latitude, longitude }) {

  const [loading, setLoading] = useState(true)
  const [flights, setFlights] = useState([])

  useEffect(() => {
    const fetchData = async () => {
      let loc = new EarthLocation(latitude, longitude)
      let box = loc.box(50)
      const response = await getPlanesForBox(box.minLat, box.minLong, box.maxLat, box.maxLong)
      const liveFlights = response['states'].map((state: any) => Flight.fromOpensky(state))

      setFlights(liveFlights)
      setLoading(false)
    }
    fetchData()
  }, [])

  return !loading ? (
    <>
      <MapContainer id="map" center={[latitude, longitude]} zoom={11} scrollWheelZoom={true}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <Marker position={[latitude, longitude]}>
          <Popup>
            A pretty CSS3 popup. <br /> Easily customizable.
          </Popup>
        </Marker>
        {flights.map((flight) => <FlightMarker key={flight.icao24} flight={flight} />)}
      </MapContainer>
    </>
  ) : (
    <div className="loading">
      <p>Loading...</p>
    </div>
  )
}
