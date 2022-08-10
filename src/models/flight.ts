export default class Flight {
	constructor(
		public icao24: string,
		public callSign: string,
		public lastContact: number,
		public longitude: number,
		public latitude: number,
		public heading: number,
	) { }

	static fromOpensky(stateVector: any[]) {
		return new Flight(
			stateVector[0],
			stateVector[1],
			stateVector[3],
			stateVector[5],
			stateVector[6],
			stateVector[10]
		)
	}

	secondsStale(): number {
		return Math.round(( Date.now() / 1000 ) - this.lastContact);
	}
}
