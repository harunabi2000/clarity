import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { RouteStep, calculateRoute, isOffRoute } from '@/utils/routeUtils';
import { toast } from '@/components/ui/use-toast';
import { speak } from '@/utils/speechUtils';

interface NavigationState {
  route: {
    type: 'Feature';
    geometry: {
      type: 'LineString';
      coordinates: [number, number][];
    };
    properties: {
      distance: number;
      duration: number;
      steps: RouteStep[];
    };
  } | null;
  currentStep: RouteStep | null;
  nextStep: RouteStep | null;
  distanceToNextStep: number | null;
  isRerouting: boolean;
  voiceGuidance: boolean;
  error: string | null;
  startNavigation: (route: NavigationState['route']) => void;
  stopNavigation: () => void;
  updateNavigation: (userLocation: [number, number], userBearing: number) => void;
  toggleVoiceGuidance: () => void;
  setError: (error: string) => void;
}

export const useNavigationStore = create<NavigationState>()(
  devtools(
    (set, get) => ({
      route: null,
      currentStep: null,
      nextStep: null,
      distanceToNextStep: null,
      isRerouting: false,
      voiceGuidance: true,
      error: null,

      startNavigation: (route) => {
        if (!route) {
          set({ error: 'No route provided' });
          return;
        }

        set({
          route,
          currentStep: route.properties.steps[0],
          nextStep: route.properties.steps[1] || null,
          distanceToNextStep: route.properties.steps[0]?.distance || null,
          isRerouting: false,
          error: null,
        });

        // Initial voice guidance
        if (get().voiceGuidance && route.properties.steps[0]) {
          speak(route.properties.steps[0].maneuver.instruction);
        }
      },

      stopNavigation: () => {
        set({
          route: null,
          currentStep: null,
          nextStep: null,
          distanceToNextStep: null,
          isRerouting: false,
          error: null,
        });
      },

      updateNavigation: async (userLocation, userBearing) => {
        const { route, currentStep, voiceGuidance } = get();
        if (!route || !currentStep) return;

        try {
          // Check if user is off route
          if (isOffRoute(userLocation, route.geometry.coordinates)) {
            set({ isRerouting: true });

            // Get current destination
            const destination = route.geometry.coordinates[route.geometry.coordinates.length - 1];
            
            // Calculate new route from current location
            const newRoute = await calculateRoute(userLocation, destination);
            
            set({
              route: {
                type: 'Feature',
                geometry: {
                  type: 'LineString',
                  coordinates: newRoute.geometry.coordinates
                },
                properties: {
                  distance: newRoute.distance,
                  duration: newRoute.duration,
                  steps: newRoute.legs[0].steps
                }
              },
              currentStep: newRoute.legs[0].steps[0],
              nextStep: newRoute.legs[0].steps[1] || null,
              distanceToNextStep: newRoute.legs[0].steps[0]?.distance || null,
              isRerouting: false,
            });

            if (voiceGuidance) {
              speak('Route recalculated. ' + newRoute.legs[0].steps[0].maneuver.instruction);
            }

            return;
          }

          // Find current and next steps based on user location
          const steps = route.properties.steps;
          let currentStepIndex = -1;
          let minDistance = Infinity;

          steps.forEach((step, index) => {
            const distance = Math.sqrt(
              Math.pow(step.maneuver.location[0] - userLocation[0], 2) +
              Math.pow(step.maneuver.location[1] - userLocation[1], 2)
            ) * 111000; // Convert to meters

            if (distance < minDistance) {
              minDistance = distance;
              currentStepIndex = index;
            }
          });

          if (currentStepIndex !== -1) {
            const newCurrentStep = steps[currentStepIndex];
            const newNextStep = steps[currentStepIndex + 1] || null;

            // Update state if steps have changed
            if (newCurrentStep !== get().currentStep) {
              set({
                currentStep: newCurrentStep,
                nextStep: newNextStep,
                distanceToNextStep: minDistance,
              });

              // Announce new instruction if voice guidance is enabled
              if (voiceGuidance && newCurrentStep) {
                speak(newCurrentStep.maneuver.instruction);
              }
            } else {
              // Just update the distance
              set({ distanceToNextStep: minDistance });
            }
          }
        } catch (error) {
          console.error('Navigation update error:', error);
          set({ error: 'Failed to update navigation' });
        }
      },

      toggleVoiceGuidance: () => {
        set((state) => ({ voiceGuidance: !state.voiceGuidance }));
      },

      setError: (error: string) => {
        set({ error });
        toast({
          title: 'Navigation Error',
          description: error,
          variant: 'destructive',
        });
      },
    }),
    { name: 'navigation-store' }
  )
);
