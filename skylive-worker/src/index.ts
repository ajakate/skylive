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

async function openSkyGetPlanes(request, env, ctx) {
	const expirationTime = 60 * 29;
	const debugCacheTime = 60 * 5;
	const debug = false;
	const openskyClientId = env.OPENSKY_CLIENT_ID;
	const openskyClientSecret = env.OPENSKY_CLIENT_SECRET;

	const newHeaders = new Headers();
	newHeaders.set("Access-Control-Allow-Origin", "*");
	newHeaders.set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
	newHeaders.set("Access-Control-Allow-Headers", "*");

	const url = new URL(request.url);
	const searchParams = url.searchParams;
	const lamin = searchParams.get('lamin');
	const lomin = searchParams.get('lomin');
	const lamax = searchParams.get('lamax');
	const lomax = searchParams.get('lomax');

	let token = await env.OPENSKY_NETWORK.get("AUTH_TOKEN");

	if (debug) {
		const cachedFlights = await env.OPENSKY_NETWORK.get("DEBUG_FLIGHTS");
		if (cachedFlights) {
			console.log("debug mode on. returning cached flights");
			return new Response(cachedFlights, { headers: newHeaders, status: 200 });
		}
	}

	if (typeof (token) !== "string") {
		console.log("no token found, logging in");
		console.log('user', openskyClientId);
		console.log('pass', openskyClientSecret);
		const loginResponse = await fetch(
			`https://auth.opensky-network.org/auth/realms/opensky-network/protocol/openid-connect/token`,
			{
				method: "POST",
				headers: {
					"Content-Type": "application/x-www-form-urlencoded"
				},
				body: `client_id=${openskyClientId}&client_secret=${openskyClientSecret}&grant_type=client_credentials`
			});

		if (!loginResponse.ok) {
			return new Response("Login failed", { status: 500, headers: newHeaders });
		}

		const loginData = await loginResponse.json();
		token = loginData.access_token;

		try {
			const r = await env.OPENSKY_NETWORK.put("AUTH_TOKEN", token, { expirationTtl: expirationTime });
			console.log("sucessful cache for token")
			console.log(r)
		}
		catch (e) {
			console.log("Error caching token");
			console.log(e);
		}
	}

	const flightsResponse = await fetch(
		`https://opensky-network.org/api/states/all?lamin=${lamin}&lomin=${lomin}&lamax=${lamax}&lomax=${lomax}`, {
		headers: { Authorization: `Bearer ${token}` },
	});

	if (!flightsResponse.ok) {
		return new Response("Failed to fetch flights", { status: 500, headers: newHeaders });
	}

	const flightsData = await flightsResponse.json();

	if (debug) {
		try {
			const r = await env.OPENSKY_NETWORK.put("DEBUG_FLIGHTS", JSON.stringify(flightsData), { expirationTtl: debugCacheTime });
			console.log("sucessful cache for debug")
			console.log(r)
		}
		catch (e) {
			console.log("Error caching flights");
			console.log(e);
		}
	}

	return new Response(JSON.stringify(flightsData), {
		headers: newHeaders,
	});
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
	
	const text = await response.text()
	let body = JSON.parse(re.exec(text)[1])
	let fullInfo = body['flights'][Object.keys(body['flights'])[0]]
	let airline = fullInfo['codeShare']['airline']['fullName']
	let current = fullInfo['activityLog']['flights'][0]
	let origin = { name: current['origin']['friendlyName'], iata: current['origin']['iata'] }
	let destination = { name: current['destination']['friendlyName'], iata: current['destination']['iata']}
	
	const responseBody = {
		airline: airline,
		origin: origin,
		destination: destination
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

		console.log('og',  env.OPENSKY_CLIENT_ID)

		if (route === "openskyGetPlanes") {
			return await openSkyGetPlanes(request, env, ctx);
		}
		else if (route === "flightawareGetFlightInfo") {
			return await flightawareGetFlightInfo(request, env, ctx);
		}
		else {
			return new Response("Invalid route", { status: 404 });
		}
	},
} satisfies ExportedHandler<Env>;
