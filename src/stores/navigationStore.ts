import { create } from 'zustand';
import { RouteData, RouteStep, calculateRoute, isOffRoute, getNextInstruction } from '@/utils/routeUtils';
import { formatNavigationInstruction, speak } from '@/utils/speechUtils';
import { toast } from '@/components/ui/use-toast';

interface NavigationState {
  route: RouteData | null;
  currentStep: RouteStep | null;
  nextStep: RouteStep | null;
  distanceToNextStep: number | null;
  isNavigating: boolean;
  isRerouting: boolean;
  voiceGuidance: boolean;
  lastSpokenDistance: number | null;
  error: Error | null;

  // Actions
  startNavigation: (route: RouteData) => void;
  stopNavigation: () => void;
  toggleVoiceGuidance: () => void;
  updateNavigation: (userLocation: [number, number], userBearing: number) => Promise<void>;
  recalculateRoute: (origin: [number, number], destination: [number, number]) => Promise<void>;
}

export const useNavigationStore = create<NavigationState>((set, get) => ({
  route: null,
  currentStep: null,
  nextStep: null,
  distanceToNextStep: null,
  isNavigating: false,
  isRerouting: false,
  voiceGuidance: true,
  lastSpokenDistance: null,
  error: null,

  startNavigation: (route: RouteData) => {
    set({
      route,
      isNavigating: true,
      currentStep: route.legs[0]?.steps[0] || null,
      nextStep: route.legs[0]?.steps[1] || null,
      error: null,
    });
  },

  stopNavigation: () => {
    set({
      route: null,
      currentStep: null,
      nextStep: null,
      distanceToNextStep: null,
      isNavigating: false,
      isRerouting: false,
      error: null,
    });
  },

  toggleVoiceGuidance: () => {
    set(state => ({ voiceGuidance: !state.voiceGuidance }));
  },

  updateNavigation: async (userLocation: [number, number], userBearing: number) => {
    const state = get();
    const { route, currentStep, voiceGuidance, lastSpokenDistance } = state;

    if (!route || !currentStep) return;

    try {
      // Check if user is off route
      if (isOffRoute(userLocation, route.geometry.coordinates)) {
        // Only recalculate if not already rerouting
        if (!state.isRerouting) {
          const destination = route.geometry.coordinates[route.geometry.coordinates.length - 1];
          await get().recalculateRoute(userLocation, destination as [number, number]);
        }
        return;
      }

      // Get next instruction
      const instruction = getNextInstruction(userLocation, userBearing, route.legs[0].steps);
      if (!instruction) return;

      const { distance, isApproaching } = instruction;

      // Update state
      set({
        distanceToNextStep: distance,
        currentStep: route.legs[0].steps[instruction.stepIndex],
        nextStep: route.legs[0].steps[instruction.stepIndex + 1] || null,
      });

      // Handle voice guidance
      if (voiceGuidance) {
        const shouldSpeak = 
          // Speak when approaching a turn
          (isApproaching && (!lastSpokenDistance || lastSpokenDistance > 100)) ||
          // Speak at regular intervals
          (!lastSpokenDistance || 
            (distance > 1000 && lastSpokenDistance - distance > 500) || // Every 500m if far
            (distance <= 1000 && lastSpokenDistance - distance > 200)); // Every 200m if close

        if (shouldSpeak) {
          const text = formatNavigationInstruction(instruction.instruction, distance);
          await speak(text, { enabled: true });
          set({ lastSpokenDistance: distance });
        }
      }

    } catch (error) {
      console.error('Navigation update error:', error);
      set({ error: error as Error });
    }
  },

  recalculateRoute: async (origin: [number, number], destination: [number, number]) => {
    set({ isRerouting: true });
    
    try {
      const newRoute = await calculateRoute(origin, destination);
      set({
        route: newRoute,
        currentStep: newRoute.legs[0]?.steps[0] || null,
        nextStep: newRoute.legs[0]?.steps[1] || null,
        isRerouting: false,
        error: null,
      });

      toast({
        title: 'Route Updated',
        description: 'Found a new route to your destination',
      });
    } catch (error) {
      console.error('Route recalculation error:', error);
      set({
        isRerouting: false,
        error: error as Error,
      });

      toast({
        title: 'Rerouting Failed',
        description: 'Unable to find a new route. Please try again.',
        variant: 'destructive',
      });
    }
  },
}));
