import { Route } from '@/store/route-store';

interface POI {
  type: 'park' | 'garden' | 'waterfront' | 'viewpoint' | 'quiet_street';
  coordinates: [number, number];
  rating: number;
}

interface RoutePreferences {
  maxElevationGain?: number;
  preferScenic?: boolean;
  avoidCrowds?: boolean;
  maxDistance?: number;
  activityType: 'walking' | 'running' | 'cycling' | 'driving';
}

export async function optimizeRoute(
  start: [number, number],
  preferences: RoutePreferences
): Promise<Route> {
  const MAPBOX_TOKEN = 'pk.eyJ1IjoiaGFydW5hYmkyMDAwIiwiYSI6ImNtOGJ2cGl1NDBzem0yaXM1eDdhamlyeGoifQ.LYuUqmB0ImZKd8Um-uCM1g';
  
  // Fetch nearby points of interest
  const pois = await fetchNearbyPOIs(start, preferences);
  
  // Get elevation data for potential route segments
  const elevationData = await fetchElevationData(start, pois);
  
  // Calculate optimal route through scenic points while respecting constraints
  const optimizedRoute = calculateOptimalRoute(start, pois, elevationData, preferences);
  
  return optimizedRoute;
}

async function fetchNearbyPOIs(
  [lat, lng]: [number, number],
  preferences: RoutePreferences
): Promise<POI[]> {
  // Use Mapbox Places API to find nearby points of interest
  const radius = preferences.maxDistance || 5000; // 5km default
  const response = await fetch(
    `https://api.mapbox.com/geocoding/v5/mapbox.places/park.json?` +
    `proximity=${lng},${lat}&radius=${radius}&access_token=${MAPBOX_TOKEN}`
  );
  
  const data = await response.json();
  
  return data.features.map((feature: any) => ({
    type: determinePoiType(feature),
    coordinates: feature.center,
    rating: calculatePoiRating(feature, preferences)
  }));
}

async function fetchElevationData(
  start: [number, number],
  pois: POI[]
): Promise<number[]> {
  // Use Mapbox Tilequery API to get elevation data
  const coordinates = [start, ...pois.map(poi => poi.coordinates)]
    .map(([lng, lat]) => `${lng},${lat}`)
    .join(';');
    
  const response = await fetch(
    `https://api.mapbox.com/v4/mapbox.terrain-rgb/tilequery/` +
    `${coordinates}?access_token=${MAPBOX_TOKEN}`
  );
  
  const data = await response.json();
  return data.features.map((f: any) => decodeElevation(f.properties.red, f.properties.green, f.properties.blue));
}

function decodeElevation(red: number, green: number, blue: number): number {
  return -10000 + ((red * 256 * 256 + green * 256 + blue) * 0.1);
}

function calculateOptimalRoute(
  start: [number, number],
  pois: POI[],
  elevationData: number[],
  preferences: RoutePreferences
): Route {
  // Implement A* pathfinding with custom heuristics for scenic value
  const route = aStarPathfinding(start, pois, elevationData, preferences);
  
  return {
    id: generateRouteId(),
    activity: preferences.activityType,
    coordinates: route,
    duration: estimateRouteDuration(route, preferences.activityType),
    distance: calculateRouteDistance(route),
    elevation: calculateTotalElevation(route, elevationData),
    created: new Date()
  };
}

function generateRouteId(): string {
  return `route_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

function estimateRouteDuration(route: [number, number][], activity: string): number {
  const distance = calculateRouteDistance(route);
  const speeds = {
    walking: 5, // km/h
    running: 10,
    cycling: 20,
    driving: 40
  };
  return (distance / speeds[activity as keyof typeof speeds]) * 3600; // duration in seconds
}

function calculateRouteDistance(route: [number, number][]): number {
  let distance = 0;
  for (let i = 1; i < route.length; i++) {
    distance += getDistance(route[i-1], route[i]);
  }
  return distance;
}

function getDistance(
  [lat1, lon1]: [number, number],
  [lat2, lon2]: [number, number]
): number {
  const R = 6371; // Earth's radius in km
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRad(degrees: number): number {
  return degrees * (Math.PI / 180);
}

function calculateTotalElevation(
  route: [number, number][],
  elevationData: number[]
): number {
  let totalGain = 0;
  for (let i = 1; i < elevationData.length; i++) {
    const gain = elevationData[i] - elevationData[i-1];
    if (gain > 0) totalGain += gain;
  }
  return totalGain;
}

function aStarPathfinding(
  start: [number, number],
  pois: POI[],
  elevationData: number[],
  preferences: RoutePreferences
): [number, number][] {
  // Implement A* pathfinding algorithm
  // This is a simplified version - you'd want to implement the full A* algorithm
  const path: [number, number][] = [start];
  const remainingPois = [...pois];
  
  while (remainingPois.length > 0) {
    const current = path[path.length - 1];
    const next = findNextBestPoint(current, remainingPois, preferences);
    path.push(next.coordinates);
    remainingPois.splice(remainingPois.indexOf(next), 1);
  }
  
  // Add return to start for loops
  path.push(start);
  
  return path;
}

function findNextBestPoint(
  current: [number, number],
  pois: POI[],
  preferences: RoutePreferences
): POI {
  return pois.reduce((best, poi) => {
    const score = calculatePointScore(current, poi, preferences);
    return score > calculatePointScore(current, best, preferences) ? poi : best;
  });
}

function calculatePointScore(
  current: [number, number],
  poi: POI,
  preferences: RoutePreferences
): number {
  const distance = getDistance(current, poi.coordinates);
  const scenicValue = preferences.preferScenic ? poi.rating : 1;
  
  return scenicValue / distance;
}

function determinePoiType(feature: any): POI['type'] {
  const categories = feature.properties.category || [];
  if (categories.includes('park')) return 'park';
  if (categories.includes('garden')) return 'garden';
  if (categories.includes('water')) return 'waterfront';
  if (categories.includes('viewpoint')) return 'viewpoint';
  return 'quiet_street';
}

function calculatePoiRating(feature: any, preferences: RoutePreferences): number {
  let rating = 1;
  
  // Increase rating for scenic locations
  if (preferences.preferScenic) {
    if (feature.properties.rating) rating *= feature.properties.rating;
    if (feature.properties.popularity) rating *= (1 - feature.properties.popularity);
  }
  
  // Decrease rating for crowded areas if avoiding crowds
  if (preferences.avoidCrowds && feature.properties.popularity) {
    rating *= (1 - feature.properties.popularity);
  }
  
  return rating;
}
