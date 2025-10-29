# import math
# from ortools.constraint_solver import pywrapcp, routing_enums_pb2

# def haversine_m(a, b):
#     R = 6371000.0  # meters
#     lat1, lon1 = math.radians(a[0]), math.radians(a[1])
#     lat2, lon2 = math.radians(b[0]), math.radians(b[1])
#     dlat = lat2 - lat1
#     dlon = lon2 - lon1
#     aa = math.sin(dlat/2)**2 + math.cos(lat1)*math.cos(lat2)*math.sin(dlon/2)**2
#     return int(R * 2 * math.atan2(math.sqrt(aa), math.sqrt(1-aa)))

# def build_distance_matrix(coords):
#     n = len(coords)
#     d = [[0]*n for _ in range(n)]
#     for i in range(n):
#         for j in range(n):
#             if i != j:
#                 d[i][j] = haversine_m(coords[i], coords[j])
#     return d

# def solve_tsp(coords, depot=0):
#     n = len(coords)
#     dm = build_distance_matrix(coords)
#     manager = pywrapcp.RoutingIndexManager(n, 1, depot)
#     routing = pywrapcp.RoutingModel(manager)

#     def dist_fn(i, j):
#         return dm[manager.IndexToNode(i)][manager.IndexToNode(j)]

#     transit_idx = routing.RegisterTransitCallback(dist_fn)
#     routing.SetArcCostEvaluatorOfAllVehicles(transit_idx)

#     search_params = pywrapcp.DefaultRoutingSearchParameters()
#     search_params.first_solution_strategy = (
#         routing_enums_pb2.FirstSolutionStrategy.PATH_CHEAPEST_ARC
#     )

#     solution = routing.SolveWithParameters(search_params)
#     if not solution:
#         return []

#     index = routing.Start(0)
#     route = []
#     while not routing.IsEnd(index):
#         route.append(manager.IndexToNode(index))
#         index = solution.Value(routing.NextVar(index))
#     route.append(manager.IndexToNode(index))
#     return route

import math
from ortools.constraint_solver import pywrapcp, routing_enums_pb2

def haversine_m(a, b):
    R = 6371000.0  # meters
    lat1, lon1 = math.radians(a[0]), math.radians(a[1])
    lat2, lon2 = math.radians(b[0]), math.radians(b[1])
    dlat = lat2 - lat1
    dlon = lon2 - lon1
    aa = math.sin(dlat/2)**2 + math.cos(lat1)*math.cos(lat2)*math.sin(dlon/2)**2
    return int(R * 2 * math.atan2(math.sqrt(aa), math.sqrt(1-aa)))

def build_distance_matrix(coords):
    n = len(coords)
    d = [[0]*n for _ in range(n)]
    for i in range(n):
        for j in range(n):
            if i != j:
                d[i][j] = haversine_m(coords[i], coords[j])
    return d

def solve_vrp_with_capacity(coords, demands, num_vehicles, vehicle_capacity, depot=0):
    """
    Solve Vehicle Routing Problem with capacity constraints using OR-Tools
    
    Args:
        coords: list of (lat, lon) tuples
        demands: list of passenger counts for each stop
        num_vehicles: number of buses
        vehicle_capacity: capacity of each bus
        depot: depot index (usually 0)
    
    Returns:
        dict with routes, distances, and statistics
    """
    n = len(coords)
    if n == 0:
        return {"routes": [], "total_distance_km": 0.0, "estimated_time_min": 0.0, "total_stops": 0}
    
    # Build distance matrix
    dm = build_distance_matrix(coords)
    
    # Create routing index manager
    manager = pywrapcp.RoutingIndexManager(n, num_vehicles, depot)
    routing = pywrapcp.RoutingModel(manager)
    
    # Distance callback
    def distance_callback(from_index, to_index):
        from_node = manager.IndexToNode(from_index)
        to_node = manager.IndexToNode(to_index)
        return dm[from_node][to_node]
    
    transit_callback_index = routing.RegisterTransitCallback(distance_callback)
    routing.SetArcCostEvaluatorOfAllVehicles(transit_callback_index)
    
    # Demand callback for capacity constraints
    def demand_callback(from_index):
        from_node = manager.IndexToNode(from_index)
        return demands[from_node]
    
    demand_callback_index = routing.RegisterUnaryTransitCallback(demand_callback)
    routing.AddDimensionWithVehicleCapacity(
        demand_callback_index,
        0,  # null capacity slack
        [vehicle_capacity] * num_vehicles,  # vehicle capacities
        True,  # start cumul to zero
        'Capacity'
    )
    
    # Search parameters
    search_params = pywrapcp.DefaultRoutingSearchParameters()
    search_params.first_solution_strategy = routing_enums_pb2.FirstSolutionStrategy.PATH_CHEAPEST_ARC
    search_params.local_search_metaheuristic = routing_enums_pb2.LocalSearchMetaheuristic.GUIDED_LOCAL_SEARCH
    search_params.time_limit.seconds = 30
    
    # Solve
    solution = routing.SolveWithParameters(search_params)
    
    if not solution:
        return {"routes": [], "total_distance_km": 0.0, "estimated_time_min": 0.0, "total_stops": 0}
    
    # Extract routes
    routes = []
    total_distance = 0
    
    for vehicle_id in range(num_vehicles):
        route = []
        index = routing.Start(vehicle_id)
        
        while not routing.IsEnd(index):
            node_index = manager.IndexToNode(index)
            route.append(node_index)
            index = solution.Value(routing.NextVar(index))
        
        # Add depot at the end if route has stops
        if route:
            route.append(depot)
            routes.append(route)
            
            # Calculate route distance
            route_distance = 0
            for i in range(len(route) - 1):
                route_distance += dm[route[i]][route[i+1]]
            total_distance += route_distance
    
    # Calculate statistics
    total_km = round(total_distance / 1000.0, 2)
    avg_speed_kmh = 30.0
    estimated_time_min = round((total_km / avg_speed_kmh) * 60.0, 2)
    
    return {
        "routes": routes,
        "total_distance_km": total_km,
        "estimated_time_min": estimated_time_min,
        "total_stops": n - 1  # excluding depot
    }

def solve_tsp(coords, depot=0):
    """
    Legacy TSP solver for backward compatibility
    coords: list of (lat, lon)
    returns dict: { order: [indices], total_distance_km: float, estimated_time_min: float }
    """
    n = len(coords)
    if n == 0:
        return {"order": [], "total_distance_km": 0.0, "estimated_time_min": 0.0}

    dm = build_distance_matrix(coords)  # in meters
    manager = pywrapcp.RoutingIndexManager(n, 1, depot)
    routing = pywrapcp.RoutingModel(manager)

    def dist_fn(from_index, to_index):
        from_node = manager.IndexToNode(from_index)
        to_node = manager.IndexToNode(to_index)
        return dm[from_node][to_node]

    transit_idx = routing.RegisterTransitCallback(dist_fn)
    routing.SetArcCostEvaluatorOfAllVehicles(transit_idx)

    search_params = pywrapcp.DefaultRoutingSearchParameters()
    search_params.first_solution_strategy = routing_enums_pb2.FirstSolutionStrategy.PATH_CHEAPEST_ARC

    solution = routing.SolveWithParameters(search_params)
    if not solution:
        return {"order": [], "total_distance_km": 0.0, "estimated_time_min": 0.0}

    index = routing.Start(0)
    order = []
    while not routing.IsEnd(index):
        order.append(manager.IndexToNode(index))
        index = solution.Value(routing.NextVar(index))
    order.append(manager.IndexToNode(index))  # end (depot or same as start)

    # compute total distance by summing consecutive edges from the distance matrix
    total_m = 0
    for i in range(len(order)-1):
        a = order[i]
        b = order[i+1]
        total_m += dm[a][b]
    total_km = round(total_m / 1000.0, 2)
    avg_speed_kmh = 30.0
    estimated_time_min = round((total_km / avg_speed_kmh) * 60.0, 2)

    return {
        "order": order,
        "total_distance_km": total_km,
        "estimated_time_min": estimated_time_min
    }
