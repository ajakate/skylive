import L from 'leaflet';
import airplaneSvg from "../assets/airplane.svg";

export const airplaneIcon = new L.Icon({
    iconUrl: airplaneSvg,
    iconRetinaUrl: airplaneSvg,
    iconAnchor: [0,0],
    popupAnchor: [0,0],
    shadowUrl: airplaneSvg,
    shadowSize: [0,0],
    shadowAnchor: null,
    iconSize: new L.Point(40, 40),
    className: ''
});
