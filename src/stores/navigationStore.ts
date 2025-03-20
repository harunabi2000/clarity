import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { NavigationInstruction } from '@/utils/routeUtils';

interface NavigationState {
  isVoiceEnabled: boolean;
  currentStep: NavigationInstruction | null;
  toggleVoice: () => void;
  setCurrentStep: (step: NavigationInstruction) => void;
}

export const useNavigationStore = create<NavigationState>()(
  devtools(
    (set) => ({
      isVoiceEnabled: true,
      currentStep: null,
      toggleVoice: () => set((state) => ({ isVoiceEnabled: !state.isVoiceEnabled })),
      setCurrentStep: (step) => set({ currentStep: step }),
    }),
    { name: 'navigation-store' }
  )
);
