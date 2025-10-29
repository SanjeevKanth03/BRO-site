import React, { useState } from "react";
import "./RouteInput.css";

const RouteInput = ({ onOptimize, loading }) => {
  const [numBuses, setNumBuses] = useState(2);
  const [busCapacity, setBusCapacity] = useState(50);
  const [stops, setStops] = useState([
    { name: "", lat: "", lon: "", passengers: 0 }
  ]);

  const addStop = () => {
    setStops([...stops, { name: "", lat: "", lon: "", passengers: 0 }]);
  };

  const removeStop = (index) => {
    if (stops.length > 1) {
      setStops(stops.filter((_, i) => i !== index));
    }
  };

  const updateStop = (index, field, value) => {
    const newStops = [...stops];
    newStops[index][field] = value;
    setStops(newStops);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Validate inputs
    const validStops = stops.filter(stop => 
      stop.name.trim() && 
      stop.lat && 
      stop.lon && 
      !isNaN(parseFloat(stop.lat)) && 
      !isNaN(parseFloat(stop.lon)) &&
      !isNaN(parseInt(stop.passengers))
    );

    if (validStops.length === 0) {
      alert("Please add at least one valid stop with name, coordinates, and passenger count.");
      return;
    }

    if (numBuses < 1) {
      alert("Please specify at least 1 bus.");
      return;
    }

    if (busCapacity < 1) {
      alert("Bus capacity must be at least 1.");
      return;
    }

    const totalPassengers = validStops.reduce((sum, stop) => sum + parseInt(stop.passengers), 0);
    if (totalPassengers > numBuses * busCapacity) {
      alert(`Total passengers (${totalPassengers}) exceeds total bus capacity (${numBuses * busCapacity}). Please add more buses or reduce passengers.`);
      return;
    }

    const requestData = {
      num_buses: parseInt(numBuses),
      bus_capacity: parseInt(busCapacity),
      stops: validStops.map(stop => ({
        name: stop.name.trim(),
        lat: parseFloat(stop.lat),
        lon: parseFloat(stop.lon),
        passengers: parseInt(stop.passengers)
      }))
    };

    onOptimize(requestData);
  };

  return (
    <div className="route-input-container">
      <form onSubmit={handleSubmit} className="route-input-form">
        <div className="form-section">
          <h3>🚌 Bus Configuration</h3>
          <div className="input-row">
            <div className="input-group">
              <label htmlFor="numBuses">Number of Buses:</label>
              <input
                type="number"
                id="numBuses"
                value={numBuses}
                onChange={(e) => setNumBuses(e.target.value)}
                min="1"
                max="10"
                disabled={loading}
              />
            </div>
            <div className="input-group">
              <label htmlFor="busCapacity">Bus Capacity (passengers):</label>
              <input
                type="number"
                id="busCapacity"
                value={busCapacity}
                onChange={(e) => setBusCapacity(e.target.value)}
                min="1"
                max="100"
                disabled={loading}
              />
            </div>
          </div>
        </div>

        <div className="form-section">
          <h3>🛑 Bus Stops</h3>
          {stops.map((stop, index) => (
            <div key={index} className="stop-input-row">
              <div className="input-group">
                <label>Stop Name:</label>
                <input
                  type="text"
                  value={stop.name}
                  onChange={(e) => updateStop(index, "name", e.target.value)}
                  placeholder="e.g., Main Street"
                  disabled={loading}
                />
              </div>
              <div className="input-group">
                <label>Latitude:</label>
                <input
                  type="number"
                  step="any"
                  value={stop.lat}
                  onChange={(e) => updateStop(index, "lat", e.target.value)}
                  placeholder="e.g., 40.7128"
                  disabled={loading}
                />
              </div>
              <div className="input-group">
                <label>Longitude:</label>
                <input
                  type="number"
                  step="any"
                  value={stop.lon}
                  onChange={(e) => updateStop(index, "lon", e.target.value)}
                  placeholder="e.g., -74.0060"
                  disabled={loading}
                />
              </div>
              <div className="input-group">
                <label>Passengers:</label>
                <input
                  type="number"
                  value={stop.passengers}
                  onChange={(e) => updateStop(index, "passengers", e.target.value)}
                  min="0"
                  max="100"
                  disabled={loading}
                />
              </div>
              <button
                type="button"
                onClick={() => removeStop(index)}
                disabled={stops.length <= 1 || loading}
                className="remove-btn"
              >
                ❌
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={addStop}
            disabled={loading}
            className="add-stop-btn"
          >
            ➕ Add Stop
          </button>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="optimize-btn"
        >
          {loading ? "🔄 Optimizing..." : "🚀 Optimize Routes"}
        </button>
      </form>
    </div>
  );
};

export default RouteInput;
