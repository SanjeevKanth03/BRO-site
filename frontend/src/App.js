import React, { useState } from "react";
import RouteInput from "./components/RouteInput";
import RouteMap from "./components/RouteMap";
import RouteList from "./components/RouteList";
import "./App.css";

function App() {
  const [optimizedRoute, setOptimizedRoute] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Prefer env-based API URL for containerized deployments
  const BACKEND_URL = process.env.REACT_APP_API_URL || "http://127.0.0.1:8000";

  const handleOptimize = async (requestData) => {
    setLoading(true);
    setError("");
    setOptimizedRoute(null);

    try {
      const response = await fetch(`${BACKEND_URL}/optimize`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.error || `HTTP error! status: ${response.status}`
        );
      }

      const data = await response.json();
      setOptimizedRoute(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    const testBackend = async () => {
      try {
        const response = await fetch(`${BACKEND_URL}/`);
        if (!response.ok) throw new Error("Backend not reachable");
      } catch (err) {
        // no-op, message shown when error occurs on submit
      }
    };
    testBackend();
  }, [BACKEND_URL]);

  return (
    <div className="App">
      <header className="app-header">
        <h1>🚌 Bus Route Optimizer</h1>
        <p>Plan efficient routes from stop data</p>
        <p style={{ fontSize: "0.9rem", opacity: 0.8 }}>
          API: {BACKEND_URL}
        </p>
      </header>

      <main className="app-main">
        <RouteInput onOptimize={handleOptimize} loading={loading} />

        {error && (
          <div className="error-message">
            ❌ {error}
          </div>
        )}

        {optimizedRoute && (
          <div className="results-container">
            <div className="route-summary">
              <h2>Optimized Bus Routes</h2>
              <div className="stats">
                <span className="stat">
                  🚌 Number of Buses: <strong>{optimizedRoute.num_buses}</strong>
                </span>
                <span className="stat">
                  📏 Total Distance: <strong>{optimizedRoute.total_distance_km} km</strong>
                </span>
                <span className="stat">
                  ⏱️ Estimated Time: <strong>{optimizedRoute.estimated_time_min} min</strong>
                </span>
                <span className="stat">
                  🛑 Total Stops: <strong>{optimizedRoute.total_stops}</strong>
                </span>
              </div>
            </div>

            <div className="results-layout">
              <div className="map-container">
                <RouteMap routes={optimizedRoute.routes} />
              </div>
              <div className="list-container">
                <RouteList routes={optimizedRoute.routes} />
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
