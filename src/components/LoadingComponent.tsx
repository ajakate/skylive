export default function LoadingComponent({ isGeolocationAvailable, isGeolocationEnabled, coords }) {
    return (
        <div className="loading">
            <p>Loading... No geoloaction data available yet</p>
            <p>isGeolocationAvailable: {isGeolocationAvailable}</p>
            <p>isGeolocationEnabled: {isGeolocationEnabled}</p>
            <p>coords: {JSON.stringify(coords)}</p>
            <p>Please make sure location services are enabled and allowed</p>
            <button onClick={() => window.location.reload()}>Reload</button>
        </div>
    );
}
