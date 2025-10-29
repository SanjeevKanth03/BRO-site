from fastapi import FastAPI
from pydantic import BaseModel
from typing import List, Dict, Any
import pandas as pd
from optimizer import solve_vrp_with_capacity, solve_tsp
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

# Updated CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],  # Explicitly include OPTIONS
    allow_headers=["*"],  # Or be more specific: ["Content-Type", "Authorization"]
)

class StopData(BaseModel):
    name: str
    lat: float
    lon: float
    passengers: int

class VRPRequest(BaseModel):
    num_buses: int
    bus_capacity: int
    stops: List[StopData]

class LegacyOptimizeRequest(BaseModel):
    route_no: int

@app.post("/optimize")
def optimize(req: VRPRequest):
    try:
        # Validate input
        if req.num_buses < 1:
            return {"error": "Number of buses must be at least 1"}
        
        if req.bus_capacity < 1:
            return {"error": "Bus capacity must be at least 1"}
        
        if len(req.stops) < 2:
            return {"error": "At least 2 stops are required"}
        
        # Extract coordinates and demands
        coords = [(stop.lat, stop.lon) for stop in req.stops]
        demands = [stop.passengers for stop in req.stops]
        
        # Add depot (first stop) with 0 demand
        coords.insert(0, coords[0])  # Duplicate first stop as depot
        demands.insert(0, 0)  # Depot has 0 demand
        
        # Solve VRP
        result = solve_vrp_with_capacity(
            coords=coords,
            demands=demands,
            num_vehicles=req.num_buses,
            vehicle_capacity=req.bus_capacity,
            depot=0
        )
        
        if not result.get("routes"):
            return {"error": "Could not compute routes - no feasible solution found"}
        
        # Format routes for frontend
        formatted_routes = []
        colors = ["#FF6B6B", "#4ECDC4", "#45B7D1", "#96CEB4", "#FFEAA7", "#DDA0DD", "#98D8C8", "#F7DC6F"]
        
        for i, route in enumerate(result["routes"]):
            if len(route) <= 1:  # Skip empty routes
                continue
                
            route_stops = []
            for j, stop_idx in enumerate(route):
                if stop_idx == 0:  # Depot
                    if j == 0:  # Start depot
                        route_stops.append({
                            "name": "Depot (Start)",
                            "lat": coords[0][0],
                            "lon": coords[0][1],
                            "passengers": 0,
                            "is_depot": True,
                            "sequence": j
                        })
                    elif j == len(route) - 1:  # End depot
                        route_stops.append({
                            "name": "Depot (End)",
                            "lat": coords[0][0],
                            "lon": coords[0][1],
                            "passengers": 0,
                            "is_depot": True,
                            "sequence": j
                        })
                else:
                    # Regular stop (adjust index for original stops array)
                    stop_data = req.stops[stop_idx - 1]
                    route_stops.append({
                        "name": stop_data.name,
                        "lat": stop_data.lat,
                        "lon": stop_data.lon,
                        "passengers": stop_data.passengers,
                        "is_depot": False,
                        "sequence": j
                    })
            
            # Calculate route statistics
            route_distance = 0
            total_passengers = sum(stop["passengers"] for stop in route_stops if not stop["is_depot"])
            
            formatted_routes.append({
                "bus_id": i + 1,
                "color": colors[i % len(colors)],
                "stops": route_stops,
                "distance_km": round(route_distance / 1000.0, 2),
                "total_passengers": total_passengers,
                "utilization": round((total_passengers / req.bus_capacity) * 100, 1)
            })
        
        return {
            "num_buses": req.num_buses,
            "bus_capacity": req.bus_capacity,
            "routes": formatted_routes,
            "total_distance_km": result.get("total_distance_km", 0.0),
            "estimated_time_min": result.get("estimated_time_min", 0.0),
            "total_stops": result.get("total_stops", 0)
        }
        
    except Exception as e:
        return {"error": f"Optimization failed: {str(e)}"}

@app.post("/optimize-legacy")
def optimize_legacy(req: LegacyOptimizeRequest):
    # Legacy endpoint for backward compatibility
    df = pd.read_csv("data/routes_clean.csv")
    stops_for_route = df[df["R.No"].astype(str).str.strip() == str(req.route_no)]

    if stops_for_route.empty:
        return {"error": f"No stops found for Route {req.route_no}"}

    pts = [(row["lat"], row["lon"]) for _, row in stops_for_route.iterrows()]
    res = solve_tsp(pts, depot=0)

    if not res.get("order"):
        return {"error": "Could not compute route"}

    order = res["order"]
    ordered_points = []
    for i in order:
        if 0 <= i < len(stops_for_route):
            stop_info = stops_for_route.iloc[i]
            ordered_points.append({
                "Boarding Point": stop_info["Boarding Point"],
                "lat": float(stop_info["lat"]),
                "lon": float(stop_info["lon"]),
                "Time": str(stop_info["Time"])
            })

    return {
        "route_no": req.route_no,
        "optimized_order": ordered_points,
        "total_distance_km": res.get("total_distance_km", 0.0),
        "estimated_time_min": res.get("estimated_time_min", 0.0)
    }

# Add this to handle OPTIONS requests explicitly
@app.options("/optimize")
async def options_optimize():
    return {"message": "OK"}

@app.get("/")
def home():
    return {"message": "Bus Route Optimizer is running!"}