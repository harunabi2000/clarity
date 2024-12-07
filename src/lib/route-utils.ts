interface RouteCoordinates {
  latitude: number;
  longitude: number;
}

export const generateRoute = async (
  startCoords: RouteCoordinates,
  duration: number,
  activity: string
): Promise<any> => {
  // Calculate approximate distance based on duration and activity type
  // Rough estimation: walking 5km/h, running 10km/h, cycling 15km/h, driving 40km/h
  const speeds: { [key: string]: number } = {
    walking: 5,
    running: 10,
    cycling: 15,
    driving: 40,
  };

  const distanceKm = (speeds[activity] * Number(duration)) / 60;
  
  // Generate a circular route by creating waypoints around the start point
  const radius = distanceKm / (2 * Math.PI);
  const waypoints = [];
  
  // Create 4 waypoints for a rough circular route
  for (let i = 0; i < 4; i++) {
    const angle = (i * Math.PI) / 2;
    const lat = startCoords.latitude + (radius / 111) * Math.cos(angle);
    const lon = startCoords.longitude + (radius / (111 * Math.cos(startCoords.latitude * Math.PI / 180))) * Math.sin(angle);
    waypoints.push([lon, lat]);
  }

  // Format coordinates for OSRM API
  const coordinates = [[startCoords.longitude, startCoords.latitude], ...waypoints, [startCoords.longitude, startCoords.latitude]]
    .map(coord => coord.join(','))
    .join(';');

  try {
    const response = await fetch(
      `https://router.project-osrm.org/route/v1/${activity === 'driving' ? 'driving' : 'walking'}/${coordinates}?overview=full&geometries=geojson`
    );
    
    if (!response.ok) {
      throw new Error('Failed to generate route');
    }

    return await response.json();
  } catch (error) {
    console.error('Error generating route:', error);
    throw error;
  }
};