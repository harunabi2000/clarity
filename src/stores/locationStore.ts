import { create } from 'zustand';
import { toast } from '@/components/ui/use-toast';

interface LocationState {
  coords: [number, number] | null;
  heading: number | null;
  speed: number | null;
  accuracy: number | null;
  timestamp: number | null;
  watchId: number | null;
  error: GeolocationPositionError | null;
  isTracking: boolean;
  startTracking: () => void;
  stopTracking: () => void;
  setLocation: (position: GeolocationPosition) => void;
  setError: (error: GeolocationPositionError) => void;
}

export const useLocationStore = create<LocationState>((set, get) => ({
  coords: null,
  heading: null,
  speed: null,
  accuracy: null,
  timestamp: null,
  watchId: null,
  error: null,
  isTracking: false,

  startTracking: () => {
    if (!navigator.geolocation) {
      toast({
        title: 'Location Not Available',
        description: 'Your browser does not support geolocation.',
        variant: 'destructive',
      });
      return;
    }

    if (get().isTracking) {
      return;
    }

    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        get().setLocation(position);
      },
      (error) => {
        get().setError(error);
      },
      {
        enableHighAccuracy: true,
        maximumAge: 1000,
        timeout: 5000,
      }
    );

    set({ watchId, isTracking: true });
  },

  stopTracking: () => {
    const { watchId } = get();
    if (watchId !== null) {
      navigator.geolocation.clearWatch(watchId);
      set({ watchId: null, isTracking: false });
    }
  },

  setLocation: (position: GeolocationPosition) => {
    set({
      coords: [position.coords.longitude, position.coords.latitude],
      heading: position.coords.heading || null,
      speed: position.coords.speed || null,
      accuracy: position.coords.accuracy || null,
      timestamp: position.timestamp,
      error: null,
    });
  },

  setError: (error: GeolocationPositionError) => {
    set({ error });
    toast({
      title: 'Location Error',
      description: error.message,
      variant: 'destructive',
    });
  },
}));
