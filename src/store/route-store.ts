import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface Route {
  id: string;
  activity: 'walking' | 'running' | 'cycling' | 'driving';
  coordinates: [number, number][];
  duration: number;
  distance: number;
  elevation: number;
  created: Date;
}

interface RouteState {
  currentRoute: Route | null;
  recentRoutes: Route[];
  savedRoutes: Route[];
  setCurrentRoute: (route: Route | null) => void;
  saveRoute: (route: Route) => void;
  addRecentRoute: (route: Route) => void;
  clearRecentRoutes: () => void;
}

export const useRouteStore = create<RouteState>()(
  persist(
    (set) => ({
      currentRoute: null,
      recentRoutes: [],
      savedRoutes: [],
      setCurrentRoute: (route) => set({ currentRoute: route }),
      saveRoute: (route) =>
        set((state) => ({
          savedRoutes: [route, ...state.savedRoutes].slice(0, 50), // Keep last 50 saved routes
        })),
      addRecentRoute: (route) =>
        set((state) => ({
          recentRoutes: [route, ...state.recentRoutes].slice(0, 10), // Keep last 10 recent routes
        })),
      clearRecentRoutes: () => set({ recentRoutes: [] }),
    }),
    {
      name: 'route-storage',
    }
  )
);
