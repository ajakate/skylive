export default function LoadingComponent({ debug}) {
    return (
        <div className="loading">
            <p>Loading... No geolocation data available</p>
            <p>Please make sure location services are enabled and allowed</p>
            <p>Debug: {JSON.stringify(debug)}</p>
            <button onClick={() => window.location.reload()}>Reload</button>
        </div>
    );
}
