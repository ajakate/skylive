export default class Flight {
	constructor(
		public icao24: string,
		public callSign: string,
		public time: number,
		public lastContact: number,
		public longitude: number,
		public latitude: number,
		public heading: number,
	) { }

	static fromOpensky(stateVector: any[]) {
		return new Flight(
			stateVector[0],
			stateVector[1],
			stateVector[2],
			stateVector[3],
			stateVector[5],
			stateVector[6],
			stateVector[10]
		)
	}
}
