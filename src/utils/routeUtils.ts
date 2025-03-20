import mapboxgl from 'mapbox-gl';
import { config } from '@/config/env';

interface RouteOptions {
  startPoint: [number, number];
  distance: number; // in kilometers
  loops: number; // number of loops in the route
}

interface Waypoint {
  type: string;
  name: string;
  address: string;
}

interface RouteProperties {
  distance: number;
  duration: number;
  waypoints?: Waypoint[];
}

interface RouteFeature {
  type: 'Feature';
  properties: RouteProperties;
  geometry: {
    type: 'LineString';
    coordinates: [number, number][];
  };
}

export async function generateLoopRoute({ startPoint, distance, loops = 1 }: RouteOptions): Promise<RouteFeature> {
  const radiusInKm = distance / (2 * Math.PI); // Convert desired distance to radius
  const points: [number, number][] = [];
  
  // Generate points in a circular pattern
  for (let i = 0; i <= loops * 360; i += 45) {
    const angle = (i * Math.PI) / 180;
    const lat = startPoint[1] + (radiusInKm / 111) * Math.sin(angle);
    const lon = startPoint[0] + (radiusInKm / (111 * Math.cos(startPoint[1] * Math.PI / 180))) * Math.cos(angle);
    points.push([lon, lat]);
  }

  // Add the start point at the end to close the loop
  points.push(startPoint);

  // Get the optimized route through these points
  try {
    const coordinates = points.map(point => point.join(',')).join(';');
    const response = await fetch(
      `https://api.mapbox.com/optimized-trips/v1/mapbox/walking/${coordinates}?roundtrip=true&source=first&destination=last&access_token=${config.mapbox.accessToken}`
    );
    
    const data = await response.json();
    
    if (data.code !== 'Ok') {
      throw new Error(data.message || 'Failed to generate route');
    }

    // Extract the waypoints in the optimized order
    const optimizedPoints = data.waypoints
      .sort((a: any, b: any) => a.waypoint_index - b.waypoint_index)
      .map((wp: any) => wp.location);

    return {
      type: 'Feature',
      properties: {
        distance: data.trips[0].distance,
        duration: data.trips[0].duration
      },
      geometry: {
        type: 'LineString',
        coordinates: optimizedPoints
      }
    };
  } catch (error) {
    console.error('Error generating loop route:', error);
    throw error;
  }
}

interface Park {
  coordinates: [number, number];
  name: string;
  address: string;
}

export async function findNearbyParks(center: [number, number], radiusInKm: number = 1): Promise<Park[]> {
  try {
    const response = await fetch(
      `https://api.mapbox.com/geocoding/v5/mapbox.places/park.json?proximity=${center.join(',')}&radius=${radiusInKm * 1000}&access_token=${config.mapbox.accessToken}`
    );
    
    const data = await response.json();
    return data.features.map((feature: any) => ({
      coordinates: feature.center,
      name: feature.text,
      address: feature.place_name
    }));
  } catch (error) {
    console.error('Error finding nearby parks:', error);
    throw error;
  }
}

export async function generateMindfulRoute(startPoint: [number, number], desiredDistance: number): Promise<RouteFeature> {
  // Find nearby parks and green spaces
  const parks = await findNearbyParks(startPoint);
  
  if (parks.length === 0) {
    // If no parks found, generate a standard loop
    return generateLoopRoute({
      startPoint,
      distance: desiredDistance,
      loops: 1
    });
  }

  // Use the closest park as a waypoint in our route
  const closestPark = parks[0];
  const points = [
    startPoint,
    closestPark.coordinates,
    // Add more points to create a loop
    [
      startPoint[0] + (closestPark.coordinates[0] - startPoint[0]) / 2,
      startPoint[1] + (closestPark.coordinates[1] - startPoint[1]) / 2
    ] as [number, number],
    startPoint
  ];

  // Get the optimized route through these points
  const coordinates = points.map(point => point.join(',')).join(';');
  const response = await fetch(
    `https://api.mapbox.com/optimized-trips/v1/mapbox/walking/${coordinates}?roundtrip=true&source=first&destination=last&access_token=${config.mapbox.accessToken}`
  );
  
  const data = await response.json();
  
  if (data.code !== 'Ok') {
    throw new Error(data.message || 'Failed to generate mindful route');
  }

  return {
    type: 'Feature',
    properties: {
      distance: data.trips[0].distance,
      duration: data.trips[0].duration,
      waypoints: [
        {
          type: 'park',
          name: closestPark.name,
          address: closestPark.address
        }
      ]
    },
    geometry: {
      type: 'LineString',
      coordinates: data.trips[0].geometry.coordinates
    }
  };
}
