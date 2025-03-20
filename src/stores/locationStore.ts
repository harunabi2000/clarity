import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { toast } from '@/components/ui/use-toast';

interface LocationState {
  coords: [number, number] | null;
  heading: number | null;
  speed: number | null;
  accuracy: number | null;
  timestamp: number | null;
  error: string | null;
  isTracking: boolean;
  watchId: number | null;
  setLocation: (position: GeolocationPosition) => void;
  setError: (error: string) => void;
  startTracking: () => void;
  stopTracking: () => void;
}

export const useLocationStore = create<LocationState>()(
  devtools(
    (set, get) => ({
      coords: null,
      heading: null,
      speed: null,
      accuracy: null,
      timestamp: null,
      error: null,
      isTracking: false,
      watchId: null,

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

      setError: (error: string) => {
        set({ error });
        toast({
          title: 'Location Error',
          description: error,
          variant: 'destructive',
        });
      },

      startTracking: () => {
        const { isTracking, watchId } = get();
        if (isTracking || watchId) return;

        if (!navigator.geolocation) {
          set({ error: "Geolocation is not supported by your browser" });
          return;
        }

        try {
          const id = navigator.geolocation.watchPosition(
            (position) => {
              get().setLocation(position);
            },
            (error) => {
              console.error("Geolocation error:", error);
              get().setError(error.message);
            },
            {
              enableHighAccuracy: true,
              timeout: 5000,
              maximumAge: 0
            }
          );

          set({ watchId: id, isTracking: true, error: null });
        } catch (error) {
          set({ error: "Failed to start location tracking" });
        }
      },

      stopTracking: () => {
        const { watchId } = get();
        if (watchId !== null) {
          navigator.geolocation.clearWatch(watchId);
          set({ watchId: null, isTracking: false });
        }
      },
    }),
    { name: 'location-store' }
  )
);
