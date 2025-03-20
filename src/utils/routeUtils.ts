import { config } from '@/config/env';

// Types for route data
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
  geometry: {
    coordinates: [number, number][];
    type: string;
  };
  legs: {
    steps: RouteStep[];
    distance: number;
    duration: number;
  }[];
  distance: number;
  duration: number;
}

export interface NavigationInstruction {
  instruction: string;
  distance: number;
  isApproaching: boolean;
  stepIndex: number;
}

// Cache for storing recently calculated routes
const routeCache = new Map<string, { route: RouteData; timestamp: number }>();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

/**
 * Calculate route using Mapbox Directions API
 */
export async function calculateRoute(
  origin: [number, number],
  destination: [number, number],
  waypoints: [number, number][] = []
): Promise<RouteData> {
  // Create cache key
  const cacheKey = JSON.stringify({ origin, destination, waypoints });
  const cached = routeCache.get(cacheKey);

  // Return cached route if valid
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return cached.route;
  }

  // Construct waypoints string
  const waypointsStr = waypoints
    .map(wp => `${wp[0]},${wp[1]}`)
    .join(';');

  // Build URL for Mapbox Directions API
  const url = `https://api.mapbox.com/directions/v5/mapbox/walking/${origin[0]},${origin[1]};${waypointsStr ? waypointsStr + ';' : ''}${destination[0]},${destination[1]}?alternatives=true&geometries=geojson&overview=full&steps=true&access_token=${config.mapbox.accessToken}`;

  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error('Failed to fetch route');
    }

    const data = await response.json();
    if (!data.routes || !data.routes[0]) {
      throw new Error('No route found');
    }

    const route = data.routes[0];

    // Cache the route
    routeCache.set(cacheKey, {
      route,
      timestamp: Date.now()
    });

    return route;
  } catch (error) {
    console.error('Error calculating route:', error);
    throw error;
  }
}

/**
 * Check if user is off route and needs rerouting
 */
export function isOffRoute(
  userLocation: [number, number],
  routeGeometry: [number, number][],
  threshold: number = 50 // meters
): boolean {
  // Find the closest point on the route
  let minDistance = Infinity;

  for (let i = 0; i < routeGeometry.length - 1; i++) {
    const start = routeGeometry[i];
    const end = routeGeometry[i + 1];
    const distance = getDistanceFromLine(userLocation, start, end);
    minDistance = Math.min(minDistance, distance);
  }

  // Convert to meters (rough approximation)
  return minDistance * 111000 > threshold;
}

/**
 * Get distance from point to line segment
 */
function getDistanceFromLine(
  point: [number, number],
  lineStart: [number, number],
  lineEnd: [number, number]
): number {
  const A = point[0] - lineStart[0];
  const B = point[1] - lineStart[1];
  const C = lineEnd[0] - lineStart[0];
  const D = lineEnd[1] - lineStart[1];

  const dot = A * C + B * D;
  const lenSq = C * C + D * D;
  let param = -1;

  if (lenSq !== 0) {
    param = dot / lenSq;
  }

  let xx, yy;

  if (param < 0) {
    xx = lineStart[0];
    yy = lineStart[1];
  } else if (param > 1) {
    xx = lineEnd[0];
    yy = lineEnd[1];
  } else {
    xx = lineStart[0] + param * C;
    yy = lineStart[1] + param * D;
  }

  const dx = point[0] - xx;
  const dy = point[1] - yy;

  return Math.sqrt(dx * dx + dy * dy);
}

/**
 * Get the next navigation instruction based on current position
 */
export function getNextInstruction(
  userLocation: [number, number],
  userBearing: number,
  steps: RouteStep[]
): NavigationInstruction | null {
  if (!steps.length) return null;

  // Find the closest upcoming step
  let closestStep = null;
  let minDistance = Infinity;
  let stepIndex = -1;

  for (let i = 0; i < steps.length; i++) {
    const step = steps[i];
    const distance = getDistance(
      userLocation,
      step.maneuver.location
    );

    if (distance < minDistance) {
      minDistance = distance;
      closestStep = step;
      stepIndex = i;
    }
  }

  if (!closestStep) return null;

  // Convert distance to meters
  const distanceInMeters = minDistance * 111000;
  
  // Determine if we're approaching the maneuver
  const isApproaching = distanceInMeters < 100 && // Within 100 meters
    Math.abs(userBearing - closestStep.maneuver.bearing_before) < 30; // Heading in the right direction

  return {
    instruction: closestStep.maneuver.instruction,
    distance: distanceInMeters,
    isApproaching,
    stepIndex
  };
}

/**
 * Calculate distance between two points
 */
function getDistance(
  point1: [number, number],
  point2: [number, number]
): number {
  const dx = point2[0] - point1[0];
  const dy = point2[1] - point1[1];
  return Math.sqrt(dx * dx + dy * dy);
}

/**
 * Get bearing between two points
 */
export function getBearing(
  start: [number, number],
  end: [number, number]
): number {
  const startLat = toRad(start[1]);
  const startLng = toRad(start[0]);
  const endLat = toRad(end[1]);
  const endLng = toRad(end[0]);

  const dLng = endLng - startLng;

  const y = Math.sin(dLng) * Math.cos(endLat);
  const x = Math.cos(startLat) * Math.sin(endLat) -
    Math.sin(startLat) * Math.cos(endLat) * Math.cos(dLng);

  let bearing = toDeg(Math.atan2(y, x));
  if (bearing < 0) bearing += 360;
  return bearing;
}

function toRad(deg: number): number {
  return deg * Math.PI / 180;
}

function toDeg(rad: number): number {
  return rad * 180 / Math.PI;
}
