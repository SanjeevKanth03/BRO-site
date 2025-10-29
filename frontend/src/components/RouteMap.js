import React from "react";
import {
  MapContainer,
  TileLayer,
  Polyline,
  Marker,
  Popup,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Fix for default markers in react-leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

const RouteMap = ({ routes }) => {
  if (!routes || routes.length === 0) {
    return <div className="map-placeholder">No route data to display</div>;
  }

  // Calculate center point for map
  const allStops = routes.flatMap(route => route.stops);
  const centerLat = allStops.reduce((sum, stop) => sum + stop.lat, 0) / allStops.length;
  const centerLon = allStops.reduce((sum, stop) => sum + stop.lon, 0) / allStops.length;

  // Create custom icons
  const createBusIcon = (color) => new L.Icon({
    iconUrl:
      "data:image/svg+xml;base64," +
      btoa(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="${color}" width="24" height="24">
        <path d="M4 16c0 .88.39 1.67 1 2.22V20c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h8v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1.78c.61-.55 1-1.34 1-2.22V6c0-3.5-3.58-4-8-4s-8 .5-8 4v10zm3.5 1c-.83 0-1.5-.67-1.5-1.5S6.67 14 7.5 14s1.5.67 1.5 1.5S8.33 17 7.5 17zm9 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zm1.5-6H6V6h12v5z"/>
      </svg>
    `),
    iconSize: [24, 24],
    iconAnchor: [12, 12],
    popupAnchor: [0, -12],
  });

  const depotIcon = new L.Icon({
    iconUrl:
      "data:image/svg+xml;base64," +
      btoa(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#FF6B35" width="20" height="20">
        <circle cx="12" cy="12" r="10" stroke="#fff" stroke-width="2"/>
        <text x="12" y="16" text-anchor="middle" fill="#fff" font-size="12" font-weight="bold">D</text>
      </svg>
    `),
    iconSize: [20, 20],
    iconAnchor: [10, 10],
    popupAnchor: [0, -10],
  });

  return (
    <MapContainer
      center={[centerLat, centerLon]}
      zoom={13}
      style={{ height: "100%", width: "100%" }}
    >
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      />

      {/* Render each bus route */}
      {routes.map((route, routeIndex) => {
        const positions = route.stops.map(stop => [stop.lat, stop.lon]);
        const busIcon = createBusIcon(route.color);

        return (
          <React.Fragment key={routeIndex}>
            {/* Route polyline */}
            <Polyline
              positions={positions}
              color={route.color}
              weight={4}
              opacity={0.7}
            />

            {/* Markers for each stop in this route */}
            {route.stops.map((stop, stopIndex) => (
              <Marker
                key={`${routeIndex}-${stopIndex}`}
                position={[stop.lat, stop.lon]}
                icon={stop.is_depot ? depotIcon : busIcon}
              >
                <Popup>
                  <div className="popup-content">
                    <h4>
                      {stop.is_depot 
                        ? `🏢 ${stop.name}` 
                        : `🛑 Bus ${route.bus_id} - Stop ${stop.sequence + 1}`}
                    </h4>
                    <p><strong>Location:</strong> {stop.name}</p>
                    {!stop.is_depot && (
                      <>
                        <p><strong>Passengers:</strong> {stop.passengers}</p>
                        <p><strong>Route:</strong> Bus {route.bus_id}</p>
                      </>
                    )}
                    <p><strong>Coordinates:</strong> {stop.lat.toFixed(4)}, {stop.lon.toFixed(4)}</p>
                  </div>
                </Popup>
              </Marker>
            ))}
          </React.Fragment>
        );
      })}
    </MapContainer>
  );
};

export default RouteMap;
