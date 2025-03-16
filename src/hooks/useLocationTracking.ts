
import { useState, useEffect } from 'react';
import mapboxgl from 'mapbox-gl';

interface LocationTrackingProps {
  steps: any[];
  currentStepIndex: number;
  onStepComplete: () => void;
}

export const useLocationTracking = ({ steps, currentStepIndex, onStepComplete }: LocationTrackingProps) => {
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  const [watchId, setWatchId] = useState<number | null>(null);

  useEffect(() => {
    if (!navigator.geolocation) {
      console.error('Geolocation is not supported by your browser');
      return;
    }

    // Request high accuracy location updates
    const options = {
      enableHighAccuracy: true,
      timeout: 5000,
      maximumAge: 0
    };

    // Start watching position
    const id = navigator.geolocation.watchPosition(
      (position) => {
        console.log('New position received:', position.coords);
        const newLocation: [number, number] = [
          position.coords.latitude,
          position.coords.longitude
        ];
        setUserLocation(newLocation);

        // Check if user has reached the next step
        if (steps && steps[currentStepIndex]) {
          const currentStep = steps[currentStepIndex];
          const stepCoords = currentStep.maneuver.location;
          
          // Calculate distance using Mapbox's helper
          if (mapboxgl.accessToken) {
            const userCoords = { lon: newLocation[1], lat: newLocation[0] };
            const stepLatLng = { lon: stepCoords[0], lat: stepCoords[1] };
            
            // Calculate distance in meters
            const distance = calculateDistance(
              userCoords.lat, userCoords.lon,
              stepLatLng.lat, stepLatLng.lon
            );
            
            console.log('Distance to next step:', distance, 'meters');
            
            // If within 20 meters of the next step
            if (distance < 20 && currentStepIndex < steps.length - 1) {
              console.log('Step completed, moving to next step');
              onStepComplete();
            }
          }
        }
      },
      (error) => {
        console.error('Error getting location:', error);
        switch(error.code) {
          case error.PERMISSION_DENIED:
            console.error("User denied the request for Geolocation.");
            break;
          case error.POSITION_UNAVAILABLE:
            console.error("Location information is unavailable.");
            break;
          case error.TIMEOUT:
            console.error("The request to get user location timed out.");
            break;
        }
      },
      options
    );

    setWatchId(id);

    // Cleanup function
    return () => {
      if (watchId !== null) {
        console.log('Cleaning up location watch');
        navigator.geolocation.clearWatch(watchId);
      }
    };
  }, [steps, currentStepIndex, onStepComplete]);

  return userLocation;
};

// Helper function to calculate distance between coordinates
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371e3; // Earth radius in meters
  const φ1 = lat1 * Math.PI / 180;
  const φ2 = lat2 * Math.PI / 180;
  const Δφ = (lat2 - lat1) * Math.PI / 180;
  const Δλ = (lon2 - lon1) * Math.PI / 180;

  const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
          Math.cos(φ1) * Math.cos(φ2) *
          Math.sin(Δλ/2) * Math.sin(Δλ/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

  return R * c;
}
