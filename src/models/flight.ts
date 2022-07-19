export default class Flight {
    icao24: string;
    callSign: string;
    time: number;
    lastContact: number;
    longitude: number;
    latitude: number;

    constructor(
        icao24: string,
        callSign: string,
        time: number,
        lastContact: number,
        longitude: number,
        latitude: number,
    ) {
        this.icao24 = icao24
        this.callSign = callSign
        this.time = time
        this.lastContact = lastContact
        this.longitude = longitude
        this.latitude = latitude
    }

    static fromOpensky(stateVector: any[]) {
        return new Flight(
            stateVector[0],
            stateVector[1],
            stateVector[2],
            stateVector[3],
            stateVector[5],
            stateVector[6],
        )
    }
}