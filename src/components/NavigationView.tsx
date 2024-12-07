import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Polyline, Marker, useMap } from 'react-leaflet';
import { Sheet, SheetContent } from "@/components/ui/sheet";
import NavigationHeader from './NavigationHeader';
import { useLocationTracking } from '@/hooks/useLocationTracking';
import { speak, cancelSpeech } from '@/utils/speechUtils';

interface NavigationViewProps {
  route: any;
  onClose: () => void;
}

function LocationUpdater({ userLocation }: { userLocation: [number, number] }) {
  const map = useMap();
  
  useEffect(() => {
    map.setView(userLocation, map.getZoom());
  }, [userLocation, map]);
  
  return null;
}

const NavigationView: React.FC<NavigationViewProps> = ({ route, onClose }) => {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [isSpeechEnabled, setIsSpeechEnabled] = useState(true);
  
  const coordinates = route?.routes?.[0]?.geometry?.coordinates || [];
  const positions = coordinates.map((coord: [number, number]) => [coord[1], coord[0]]);
  const steps = route?.routes?.[0]?.legs?.[0]?.steps || [];
  const currentStep = steps[currentStepIndex];

  const handleStepComplete = () => {
    setCurrentStepIndex(prev => prev + 1);
  };

  const userLocation = useLocationTracking({
    steps,
    currentStepIndex,
    onStepComplete: handleStepComplete,
  });

  useEffect(() => {
    if (currentStep) {
      speak(currentStep.maneuver.instruction, isSpeechEnabled);
    }
    return () => cancelSpeech();
  }, [currentStep, isSpeechEnabled]);

  return (
    <Sheet open={true} onOpenChange={onClose}>
      <SheetContent side="bottom" className="h-[90vh] p-0">
        <NavigationHeader
          onClose={onClose}
          isSpeechEnabled={isSpeechEnabled}
          toggleSpeech={() => setIsSpeechEnabled(!isSpeechEnabled)}
          currentStep={currentStep}
        />

        <div className="h-full">
          <MapContainer
            center={userLocation || positions[0]}
            zoom={16}
            style={{ height: '100%', width: '100%' }}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            {positions.length > 0 && (
              <Polyline
                positions={positions}
                color="#3B82F6"
                weight={3}
                opacity={0.7}
              />
            )}
            {userLocation && (
              <>
                <LocationUpdater userLocation={userLocation} />
                <Marker position={userLocation} />
              </>
            )}
          </MapContainer>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default NavigationView;