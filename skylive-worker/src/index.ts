/**
 * Welcome to Cloudflare Workers! This is your first worker.
 *
 * - Run `npm run dev` in your terminal to start a development server
 * - Open a browser tab at http://localhost:8787/ to see your worker in action
 * - Run `npm run deploy` to publish your worker
 *
 * Bind resources to your worker in `wrangler.jsonc`. After adding bindings, a type definition for the
 * `Env` object can be regenerated with `npm run cf-typegen`.
 *
 * Learn more at https://developers.cloudflare.com/workers/
 */

// OpenSky Network blackholes datacenter egress (the connection hangs with no
// response, from Cloudflare Workers and any datacenter IP, even with valid
// OAuth credentials), so we serve the same live picture from the keyless
// community ADS-B mirrors and reshape it into OpenSky's states/all format.
const ADSB_MIRRORS = [
	(lat: string, lon: string, dist: string) => `https://api.adsb.lol/v2/lat/${lat}/lon/${lon}/dist/${dist}`,
	(lat: string, lon: string, dist: string) => `https://opendata.adsb.fi/api/v2/lat/${lat}/lon/${lon}/dist/${dist}`,
];

// Map a readsb aircraft record onto an OpenSky state vector. OpenSky uses
// SI units (metres, m/s); readsb uses feet / knots. Only the indices the
// frontend reads are populated meaningfully, the rest are null as OpenSky
// itself often returns.
function toOpenskyState(ac: any, nowSec: number): (string | number | boolean | null)[] {
	const seen = typeof ac.seen === "number" ? ac.seen : 0;
	const onGround = ac.alt_baro === "ground";
	const baroAltFt = typeof ac.alt_baro === "number" ? ac.alt_baro : null;
	const geoAltFt = typeof ac.alt_geom === "number" ? ac.alt_geom : null;
	const FT_TO_M = 0.3048;
	const KT_TO_MS = 0.514444;
	const FPM_TO_MS = 0.00508;
	return [
		ac.hex ?? null,                                                 // 0  icao24
		typeof ac.flight === "string" ? ac.flight.trim() : null,        // 1  callsign
		null,                                                           // 2  origin_country
		Math.round(nowSec - seen),                                      // 3  time_position
		Math.round(nowSec - seen),                                      // 4  last_contact
		typeof ac.lon === "number" ? ac.lon : null,                     // 5  longitude
		typeof ac.lat === "number" ? ac.lat : null,                     // 6  latitude
		baroAltFt !== null ? baroAltFt * FT_TO_M : null,                // 7  baro_altitude
		onGround,                                                       // 8  on_ground
		typeof ac.gs === "number" ? ac.gs * KT_TO_MS : null,            // 9  velocity
		typeof ac.track === "number" ? ac.track : null,                 // 10 true_track
		typeof ac.baro_rate === "number" ? ac.baro_rate * FPM_TO_MS : null, // 11 vertical_rate
		null,                                                           // 12 sensors
		geoAltFt !== null ? geoAltFt * FT_TO_M : null,                  // 13 geo_altitude
		ac.squawk ?? null,                                              // 14 squawk
		false,                                                          // 15 spi
		0,                                                              // 16 position_source
	];
}

async function openSkyGetPlanes(request, env, ctx) {
	const newHeaders = new Headers();
	newHeaders.set("Access-Control-Allow-Origin", "*");
	newHeaders.set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
	newHeaders.set("Access-Control-Allow-Headers", "*");

	const url = new URL(request.url);
	const searchParams = url.searchParams;

	// Preferred contract: center point + radius (nautical miles). Fall back to
	// the legacy bounding-box params so an older deployed frontend keeps working.
	let lat = searchParams.get('lat');
	let lon = searchParams.get('lon');
	let dist = searchParams.get('dist');

	if (!lat || !lon) {
		const lamin = parseFloat(searchParams.get('lamin') ?? '');
		const lomin = parseFloat(searchParams.get('lomin') ?? '');
		const lamax = parseFloat(searchParams.get('lamax') ?? '');
		const lomax = parseFloat(searchParams.get('lomax') ?? '');
		if ([lamin, lomin, lamax, lomax].every((n) => !Number.isNaN(n))) {
			lat = String((lamin + lamax) / 2);
			lon = String((lomin + lomax) / 2);
			const spanKm = ((lamax - lamin) / 2) * 111;
			dist = dist ?? String(Math.max(1, Math.round(spanKm / 1.852)));
		}
	}

	if (!lat || !lon) {
		return new Response("Missing lat/lon", { status: 400, headers: newHeaders });
	}
	dist = dist ?? "30";

	let lastError = "no mirror tried";
	for (const buildUrl of ADSB_MIRRORS) {
		const target = buildUrl(lat, lon, dist);
		try {
			const resp = await fetch(target, {
				headers: {
					"User-Agent": "skylive (github.com/ajakate/skylive)",
					"Accept": "application/json",
				},
			});
			if (!resp.ok) {
				lastError = `${target} -> ${resp.status}`;
				console.log("mirror not ok", lastError);
				continue;
			}
			const data = await resp.json();
			const aircraft = Array.isArray(data?.ac) ? data.ac : (Array.isArray(data?.aircraft) ? data.aircraft : []);
			const nowSec = Math.floor(Date.now() / 1000);
			const states = aircraft
				.filter((ac: any) => typeof ac.lat === "number" && typeof ac.lon === "number")
				.map((ac: any) => toOpenskyState(ac, nowSec));

			return new Response(JSON.stringify({ time: nowSec, states }), { headers: newHeaders });
		} catch (e: any) {
			lastError = `${target} threw: ${e?.message}`;
			console.log("mirror threw", lastError);
		}
	}

	console.log("all mirrors failed", lastError);
	return new Response(`Failed to fetch flights: ${lastError}`, { status: 502, headers: newHeaders });
}

async function flightawareGetFlightInfo(request, env, ctx) {
	const url = new URL(request.url);
	const searchParams = url.searchParams;
	const callSign = searchParams.get('callSign');
	const flightAwareLink = `https://flightaware.com/live/flight/${callSign}`;
	const re = /<script>var trackpollBootstrap = (.*);<\/script>/

	const response = await fetch(flightAwareLink, {
		headers: {
			"User-Agent": "Mozilla/5.0"
		}
	});

	let responseBody;

	try {
		const text = await response.text()
		let body = JSON.parse(re.exec(text)[1])
		let fullInfo = body['flights'][Object.keys(body['flights'])[0]]
		let airline = fullInfo['codeShare']['airline']['fullName']
		let current = fullInfo['activityLog']['flights'][0]
		let origin = { name: current['origin']['friendlyName'], iata: current['origin']['iata'] }
		let destination = { name: current['destination']['friendlyName'], iata: current['destination']['iata'] }

		responseBody = {
			airline: airline,
			origin: origin,
			destination: destination
		}
	} catch (e) {
		console.log(e)
		responseBody = {
			airline: "Private",
			origin: { name: "Unknown", iata: "Unknown" },
			destination: { name: "Unknown", iata: "Unknown" },
		}
	}


	return new Response(JSON.stringify(responseBody), {
		headers: {
			"Access-Control-Allow-Origin": "*",
			"Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
			"Access-Control-Allow-Headers": "*",
		},
	});
}

export default {
	async fetch(request, env, ctx): Promise<Response> {
		const url = new URL(request.url);
		const searchParams = url.searchParams;
		const route = searchParams.get('route');

		switch (route) {
			case "openskyGetPlanes":
				return await openSkyGetPlanes(request, env, ctx);
			case "flightawareGetFlightInfo":
				return await flightawareGetFlightInfo(request, env, ctx);
			default:
				return new Response("Invalid route", { status: 404 });
		}
	},
} satisfies ExportedHandler<Env>;
