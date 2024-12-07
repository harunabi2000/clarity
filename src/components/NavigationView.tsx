import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Polyline, Marker, useMap } from 'react-leaflet';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Navigation2, X, Volume2, VolumeX } from 'lucide-react';
import L from 'leaflet';

interface NavigationViewProps {
  route: any;
  onClose: () => void;
}

function LocationUpdater({ userLocation, currentStep }: { userLocation: [number, number], currentStep: any }) {
  const map = useMap();
  
  useEffect(() => {
    map.setView(userLocation, map.getZoom());
  }, [userLocation, map]);
  
  return null;
}

const NavigationView: React.FC<NavigationViewProps> = ({ route, onClose }) => {
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  const [watchId, setWatchId] = useState<number | null>(null);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [isSpeechEnabled, setIsSpeechEnabled] = useState(true);
  const coordinates = route?.routes?.[0]?.geometry?.coordinates || [];
  const positions = coordinates.map((coord: [number, number]) => [coord[1], coord[0]]);
  const steps = route?.routes?.[0]?.legs?.[0]?.steps || [];
  const currentStep = steps[currentStepIndex];

  const speak = (text: string) => {
    if (isSpeechEnabled && 'speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      window.speechSynthesis.speak(utterance);
    }
  };

  useEffect(() => {
    if (currentStep) {
      speak(currentStep.maneuver.instruction);
    }
  }, [currentStep, isSpeechEnabled]);

  useEffect(() => {
    const id = navigator.geolocation.watchPosition(
      (position) => {
        const newLocation: [number, number] = [position.coords.latitude, position.coords.longitude];
        setUserLocation(newLocation);

        // Check if user has reached the next step
        if (currentStep) {
          const stepCoords = currentStep.maneuver.location;
          const distance = L.latLng(newLocation[0], newLocation[1])
            .distanceTo(L.latLng(stepCoords[1], stepCoords[0]));
          
          if (distance < 20 && currentStepIndex < steps.length - 1) { // Within 20 meters
            setCurrentStepIndex(prev => prev + 1);
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
      window.speechSynthesis.cancel();
    };
  }, []);

  return (
    <Sheet open={true} onOpenChange={onClose}>
      <SheetContent side="bottom" className="h-[90vh] p-0">
        <SheetHeader className="p-4 bg-primary text-white">
          <div className="flex justify-between items-center">
            <SheetTitle className="text-white text-xl">
              Navigation
            </SheetTitle>
            <div className="flex items-center gap-2">
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => setIsSpeechEnabled(!isSpeechEnabled)}
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
                <LocationUpdater userLocation={userLocation} currentStep={currentStep} />
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