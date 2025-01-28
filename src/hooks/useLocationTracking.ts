import { useState, useEffect } from 'react';
import L from 'leaflet';

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
          const userLatLng = L.latLng(newLocation[0], newLocation[1]);
          const stepLatLng = L.latLng(stepCoords[1], stepCoords[0]);
          
          const distance = userLatLng.distanceTo(stepLatLng);
          console.log('Distance to next step:', distance, 'meters');
          
          // If within 20 meters of the next step
          if (distance < 20 && currentStepIndex < steps.length - 1) {
            console.log('Step completed, moving to next step');
            onStepComplete();
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