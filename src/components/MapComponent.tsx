import { useEffect, useState } from 'react'
import '../App.css'

import { MapContainer, Marker, Popup, TileLayer, useMap } from 'react-leaflet'
import 'leaflet-rotatedmarker';
import { EarthLocation } from '../models/earthLocation'
import Flight from '../models/flight'
import FlightMarker from './FlightMarker'
import L from 'leaflet';

const getPlanesForBox = async (minLat: number, minLong: number, maxLat: number, maxLong: number) => {
    const backendUrl = import.meta.env.VITE_API_URL
    const response = await fetch(
      `${backendUrl}?route=openskyGetPlanes&lamin=${minLat}&lomin=${minLong}&lamax=${maxLat}&lomax=${maxLong}`
    );
    return await response.json();
}

const ReloadControl = () => {
  const map = useMap();

  useEffect(() => {
    const reloadControl = L.control({ position: "bottomleft" });

    reloadControl.onAdd = () => {
      const div = L.DomUtil.create("div", "leaflet-bar leaflet-control");
      const button = L.DomUtil.create("a", "", div);

      button.innerHTML = "⟳"; // reload icon
      button.href = "#";
      button.title = "Reload page";
      button.style.cursor = "pointer";
      button.style.padding = "6px 10px";
      button.style.fontSize = "18px";

      L.DomEvent.on(button, "click", (e) => {
        L.DomEvent.stopPropagation(e);
        L.DomEvent.preventDefault(e);
        window.location.reload();
      });

      return div;
    };

    reloadControl.addTo(map);

    return () => {
      reloadControl.remove();
    };
  }, [map]);

  return null;
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
        <ReloadControl/>
        {flights.map((flight) => <FlightMarker key={flight.icao24} flight={flight} />)}
      </MapContainer>
    </>
  ) : (
    <div className="loading">
      <p>Loading...</p>
    </div>
  )
}
