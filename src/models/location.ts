function toRad(deg: number) {
    return deg * Math.PI / 180;
}

function toDeg(rad: number) {
    return rad * 180 / Math.PI;
}

// https://stackoverflow.com/questions/2637023/how-to-calculate-the-latlng-of-a-point-a-certain-distance-away-from-another
function destinationPoint(location: Location, brng: number, dist: number) {
    dist = dist / 6371;  
    brng = toRad(brng);  

    var lat1 = toRad(location.latitude), lon1 = toRad(location.longitude);

    var lat2 = Math.asin(Math.sin(lat1) * Math.cos(dist) + 
                            Math.cos(lat1) * Math.sin(dist) * Math.cos(brng));

    var lon2 = lon1 + Math.atan2(Math.sin(brng) * Math.sin(dist) *
                                    Math.cos(lat1), 
                                    Math.cos(dist) - Math.sin(lat1) *
                                    Math.sin(lat2));

    return new Location(toDeg(lat2), toDeg(lon2));
}

// TODO: do we need to export?
export class LocationBox {
    constructor(
        public minLat: number,
        public maxLat: number,
        public minLong: number,
        public maxLong: number,
    ) {}
}

export class Location {
    constructor(
        public latitude: number,
        public longitude: number,
    ) {}

    // TODO: optimize
    box(dist: number): LocationBox {
        const north = destinationPoint(this, 0, dist);
        const east = destinationPoint(this, 90, dist);
        const south = destinationPoint(this, 180, dist);
        const west = destinationPoint(this, 270, dist);

        return new LocationBox(
            south.latitude,
            north.latitude,
            west.longitude,
            east.longitude
        )
    }
}
