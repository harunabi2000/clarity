import { config } from '@/config/env';

interface RouteOptions {
  startPoint: [number, number];
  distance: number;
  loops?: number;
}

interface RouteProperties {
  distance: number;
  duration: number;
  steps: RouteStep[];
}

export interface RouteStep {
  maneuver: {
    instruction: string;
    location: [number, number];
    bearing_before: number;
    bearing_after: number;
    type: string;
  };
  distance: number;
  duration: number;
  name: string;
}

export interface RouteData {
  type: 'Feature';
  properties: {
    distance: number;
    duration: number;
    steps: {
      maneuver: {
        instruction: string;
        location: [number, number];
        bearing_before: number;
        bearing_after: number;
        type: string;
      };
      distance: number;
      duration: number;
      name: string;
    }[];
  };
  geometry: {
    type: string;
    coordinates: [number, number][];
  };
}

export interface NavigationInstruction {
  instruction: string;
  distance: number;
  isApproaching: boolean;
  stepIndex: number;
}

interface Location {
  latitude: number;
  longitude: number;
}

interface RoutePoint {
  latitude: number;
  longitude: number;
}

// Cache for storing recently calculated routes
const routeCache = new Map<string, { route: RouteData; timestamp: number }>();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

// Convert degrees to radians
function toRad(deg: number): number {
  return deg * (Math.PI / 180);
}

// Convert radians to degrees
function toDeg(rad: number): number {
  return rad * (180 / Math.PI);
}

// Calculate distance between two points in meters
export function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371e3; // Earth's radius in meters
  const φ1 = toRad(lat1);
  const φ2 = toRad(lat2);
  const Δφ = toRad(lat2 - lat1);
  const Δλ = toRad(lon2 - lon1);

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

// Calculate bearing between two points in degrees
export function calculateBearing(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const φ1 = toRad(lat1);
  const φ2 = toRad(lat2);
  const λ1 = toRad(lon1);
  const λ2 = toRad(lon2);

  const y = Math.sin(λ2 - λ1) * Math.cos(φ2);
  const x =
    Math.cos(φ1) * Math.sin(φ2) -
    Math.sin(φ1) * Math.cos(φ2) * Math.cos(λ2 - λ1);

  const θ = Math.atan2(y, x);
  const bearing = (toDeg(θ) + 360) % 360;

  return bearing;
}

// Check if user is off route
export function isOffRoute(
  userLocation: [number, number],
  routeCoordinates: [number, number][]
): boolean {
  // Find the closest point on the route
  let minDistance = Infinity;
  for (const coord of routeCoordinates) {
    const distance = calculateDistance(
      userLocation[1],
      userLocation[0],
      coord[1],
      coord[0]
    );
    minDistance = Math.min(minDistance, distance);
  }

  // If user is more than 50 meters from route, consider them off route
  return minDistance > 50;
}

// Get next navigation instruction based on user location
export function getNextInstruction(
  userLocation: [number, number],
  userBearing: number,
  steps: {
    maneuver: {
      instruction: string;
      location: [number, number];
      bearing_before: number;
      bearing_after: number;
      type: string;
    };
    distance: number;
    duration: number;
    name: string;
  }[]
): {
  instruction: string;
  distance: number;
  isApproaching: boolean;
  name: string;
} | null {
  // Find the next maneuver
  for (const step of steps) {
    const distance = calculateDistance(
      userLocation[1],
      userLocation[0],
      step.maneuver.location[1],
      step.maneuver.location[0]
    );

    // If we're within 100 meters of the maneuver
    if (distance < 100) {
      return {
        instruction: step.maneuver.instruction,
        distance,
        isApproaching: distance < 50,
        name: step.name || 'Unknown road'
      };
    }
  }

  return null;
}

// Calculate route using Mapbox Directions API
export async function calculateRoute(
  start: [number, number],
  end: [number, number]
): Promise<{
  geometry: {
    coordinates: [number, number][];
    type: string;
  };
  legs: {
    steps: {
      maneuver: {
        instruction: string;
        location: [number, number];
        bearing_before: number;
        bearing_after: number;
        type: string;
      };
      distance: number;
      duration: number;
      name: string;
    }[];
  }[];
  distance: number;
  duration: number;
}> {
  const response = await fetch(
    `https://api.mapbox.com/directions/v5/mapbox/walking/${start[0]},${start[1]};${end[0]},${end[1]}?geometries=geojson&overview=full&steps=true&access_token=${config.mapbox.accessToken}`
  );

  if (!response.ok) {
    throw new Error('Failed to calculate route');
  }

  const data = await response.json();

  if (!data.routes || !data.routes[0]) {
    throw new Error('No route found');
  }

  return data.routes[0];
}

export async function generateLoopRoute(startLocation: Location, durationMinutes: number): Promise<RoutePoint[]> {
  try {
    // Average walking speed is 5 km/h
    const speedKmH = 5;
    
    // Calculate the desired distance based on duration and speed
    const distanceKm = (speedKmH * durationMinutes / 60) / 2; // Divide by 2 since it's a loop
    
    // Generate points in a circular pattern
    const numPoints = 8; // Number of points to generate
    const points: RoutePoint[] = [];
    
    for (let i = 0; i <= numPoints; i++) {
      const angle = (i * 2 * Math.PI) / numPoints;
      
      // Calculate offset from center point
      const lat = startLocation.latitude + (distanceKm / 6371) * (180 / Math.PI) * Math.cos(angle);
      const lon = startLocation.longitude + (distanceKm / 6371) * (180 / Math.PI) * Math.sin(angle) / Math.cos(startLocation.latitude * Math.PI / 180);
      
      points.push({
        latitude: lat,
        longitude: lon
      });
    }
    
    // Add start point at the end to close the loop
    points.push(points[0]);
    
    return points;
  } catch (error) {
    console.error('Error generating route:', error);
    throw error;
  }
}
