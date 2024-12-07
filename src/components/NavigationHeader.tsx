import React from 'react';
import { SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { X, Volume2, VolumeX, Navigation2 } from 'lucide-react';

interface NavigationHeaderProps {
  onClose: () => void;
  isSpeechEnabled: boolean;
  toggleSpeech: () => void;
  currentStep: any;
}

const NavigationHeader: React.FC<NavigationHeaderProps> = ({
  onClose,
  isSpeechEnabled,
  toggleSpeech,
  currentStep,
}) => {
  return (
    <SheetHeader className="p-4 bg-primary text-white">
      <div className="flex justify-between items-center">
        <SheetTitle className="text-white text-xl">
          Navigation
        </SheetTitle>
        <div className="flex items-center gap-2">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={toggleSpeech}
            className="text-white"
          >
            {isSpeechEnabled ? <Volume2 className="h-6 w-6" /> : <VolumeX className="h-6 w-6" />}
          </Button>
          <Button variant="ghost" size="icon" onClick={onClose} className="text-white">
            <X className="h-6 w-6" />
          </Button>
        </div>
      </div>
      
      {currentStep && (
        <div className="mt-4 space-y-2 bg-white/10 p-4 rounded-lg">
          <div className="flex items-center space-x-2">
            <Navigation2 className="h-5 w-5" />
            <span className="text-lg font-medium">{currentStep.maneuver.instruction}</span>
          </div>
          <div className="text-sm opacity-90">
            <span>{(currentStep.distance / 1000).toFixed(1)} km • </span>
            <span>{Math.round(currentStep.duration / 60)} min</span>
          </div>
        </div>
      )}
    </SheetHeader>
  );
};

export default NavigationHeader;