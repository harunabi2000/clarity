import { create } from 'zustand';

interface Location {
  latitude: number;
  longitude: number;
}

interface LocationState {
  currentLocation: Location | null;
  startTracking: () => void;
}

export const useLocationStore = create<LocationState>((set) => ({
  currentLocation: null,
  startTracking: () => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          set({
            currentLocation: {
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
            },
          });
        },
        (error) => {
          console.error('Error getting location:', error);
        }
      );

      // Watch for location changes
      navigator.geolocation.watchPosition(
        (position) => {
          set({
            currentLocation: {
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
            },
          });
        },
        (error) => {
          console.error('Error watching location:', error);
        }
      );
    }
  },
}));
