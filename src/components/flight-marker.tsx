import { Text, ScrollView, Linking } from 'react-native';
import { Marker, Callout } from 'react-native-maps';
import React, { useEffect, useState, useRef } from 'react';

const planeImage = require('../assets/airplane.png')
const re = /<script>var trackpollBootstrap = (.*);<\/script>/

// TODO: add unknowns; fix formatting; error handling
export default function FlightMarker(props: any) {
    let flight = props.flight
    let markerRef = useRef(null)

    const [loading, setLoading] = useState(true)
    const [meta, SetMeta] = useState({})

    const flightAwareLink = `https://flightaware.com/live/flight/${flight.callSign}`

    const getFlightInfo = async () => {
        const resp = await fetch(flightAwareLink)
        const text = await resp.text()

        let body = JSON.parse(re.exec(text)[1])
        let fullInfo = body['flights'][Object.keys(body['flights'])[0]]
        let airline = fullInfo['codeShare']['airline']['fullName']
        let current = fullInfo['activityLog']['flights'][0]
        let origin = { name: current['origin']['friendlyName'], iata: current['origin']['iata'] }
        let destination = { name: current['destination']['friendlyName'], iata: current['destination']['iata'] }

        SetMeta({ airline: airline, origin: origin, destination: destination })
        setLoading(false)
    }

    useEffect(() => {
        if (markerRef.current) {
            markerRef.current.hideCallout();
            markerRef.current.showCallout();
        }
    }, [loading])

    return (
        <Marker
            ref={markerRef}
            tracksViewChanges={false}
            image={planeImage}
            coordinate={{ latitude: flight.latitude, longitude: flight.longitude }}
            title={flight.callSign}
            description={flight.icao24}
            rotation={flight.heading}
            onPress={() => getFlightInfo()}
        >
            <Callout
                style={{ width: 200, height: 100 }}
                onPress={() => Linking.openURL(flightAwareLink)}>
                {loading ?
                    <Text>Loading...</Text> :
                    <ScrollView>
                        <Text>{meta.airline} - {flight.callSign}</Text>
                        <Text>{meta.origin.iata} - {meta.origin.name}</Text>
                        <Text>{meta.destination.iata} - {meta.destination.name}</Text>
                    </ScrollView>
                }
            </Callout>
        </Marker>
    )
}
