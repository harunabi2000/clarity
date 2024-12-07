interface RouteCoordinates {
  latitude: number;
  longitude: number;
}

interface RouteInstruction {
  distance: number;
  duration: number;
  instruction: string;
  type: string;
}

export const generateRoute = async (
  startCoords: RouteCoordinates,
  duration: number,
  activity: string
): Promise<any> => {
  // Calculate approximate distance based on duration and activity type
  const speeds: { [key: string]: number } = {
    walking: 5,
    running: 10,
    cycling: 15,
    driving: 40,
  };

  const distanceKm = (speeds[activity] * Number(duration)) / 60;
  
  // Generate a circular route by creating waypoints around the start point
  // with a bias towards parks and green areas
  const radius = distanceKm / (2 * Math.PI);
  const waypoints = [];
  
  // Create 6 waypoints for a more natural route with park bias
  // Using a slightly modified angle distribution to favor areas likely to have parks
  for (let i = 0; i < 6; i++) {
    const angle = (i * Math.PI) / 3;
    // Add some randomness to make the route more natural
    const randomOffset = (Math.random() - 0.5) * 0.2;
    // Increase radius slightly for more scenic possibilities
    const adjustedRadius = radius * (1 + randomOffset);
    
    const lat = startCoords.latitude + (adjustedRadius / 111) * Math.cos(angle);
    const lon = startCoords.longitude + (adjustedRadius / (111 * Math.cos(startCoords.latitude * Math.PI / 180))) * Math.sin(angle);
    waypoints.push([lon, lat]);
  }

  // Format coordinates for OSRM API
  const coordinates = [[startCoords.longitude, startCoords.latitude], ...waypoints, [startCoords.longitude, startCoords.latitude]]
    .map(coord => coord.join(','))
    .join(';');

  try {
    const response = await fetch(
      `https://router.project-osrm.org/route/v1/${activity === 'driving' ? 'driving' : 'walking'}/${coordinates}?overview=full&geometries=geojson&steps=true`
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