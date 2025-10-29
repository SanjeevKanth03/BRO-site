import React from "react";
import "./RouteList.css";

const RouteList = ({ routes }) => {
  if (!routes || routes.length === 0) {
    return <div className="route-list-empty">No routes to display</div>;
  }

  return (
    <div className="route-list">
      <div className="route-list-header">
        <h3>Optimized Bus Routes</h3>
        <div className="route-info">Total Buses: {routes.length}</div>
      </div>

      <div className="routes-container">
        {routes.map((route, routeIndex) => (
          <div key={routeIndex} className="route-card">
            <div className="route-header" style={{ borderLeftColor: route.color }}>
              <h4>🚌 Bus {route.bus_id}</h4>
              <div className="route-stats">
                <span className="stat">👥 {route.total_passengers} passengers</span>
                <span className="stat">📏 {route.distance_km} km</span>
                <span className="stat">📊 {route.utilization}% utilized</span>
              </div>
            </div>

            <div className="stops-container">
              {route.stops.map((stop, stopIndex) => (
                <div key={stopIndex} className="stop-item">
                  <div className="stop-marker">
                    {stop.is_depot ? (
                      <span className="marker depot">🏢</span>
                    ) : stopIndex === 0 ? (
                      <span className="marker start">🚩</span>
                    ) : stopIndex === route.stops.length - 1 ? (
                      <span className="marker end">🏁</span>
                    ) : (
                      <span className="marker number">{stopIndex + 1}</span>
                    )}
                  </div>

                  <div className="stop-details">
                    <div className="stop-name">{stop.name}</div>
                    {!stop.is_depot && (
                      <div className="stop-passengers">👥 {stop.passengers} passengers</div>
                    )}
                    <div className="stop-coords">
                      📍 {stop.lat.toFixed(4)}, {stop.lon.toFixed(4)}
                    </div>
                  </div>

                  <div className="stop-position">#{stopIndex + 1}</div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default RouteList;
