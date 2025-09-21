export default function LoadingComponent() {
    return (
        <div className="loading">
            <p>Loading... No geolocation data available</p>
            <p>Please make sure location services are enabled and allowed</p>
            <button onClick={() => window.location.reload()}>Reload</button>
        </div>
    );
}
