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
    const id = navigator.geolocation.watchPosition(
      (position) => {
        const newLocation: [number, number] = [position.coords.latitude, position.coords.longitude];
        setUserLocation(newLocation);

        // Check if user has reached the next step
        const currentStep = steps[currentStepIndex];
        if (currentStep) {
          const stepCoords = currentStep.maneuver.location;
          const distance = L.latLng(newLocation[0], newLocation[1])
            .distanceTo(L.latLng(stepCoords[1], stepCoords[0]));
          
          if (distance < 20 && currentStepIndex < steps.length - 1) { // Within 20 meters
            onStepComplete();
          }
        }
      },
      (error) => {
        console.error('Error getting location:', error);
      },
      {
        enableHighAccuracy: true,
        maximumAge: 0,
        timeout: 5000
      }
    );
    
    setWatchId(id);

    return () => {
      if (watchId) {
        navigator.geolocation.clearWatch(watchId);
      }
    };
  }, [steps, currentStepIndex, onStepComplete]);

  return userLocation;
};