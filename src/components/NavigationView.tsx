import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Polyline, Marker, useMap } from 'react-leaflet';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Navigation2, X } from 'lucide-react';
import L from 'leaflet';

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
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  const [watchId, setWatchId] = useState<number | null>(null);
  const coordinates = route?.routes?.[0]?.geometry?.coordinates || [];
  const positions = coordinates.map((coord: [number, number]) => [coord[1], coord[0]]);

  useEffect(() => {
    // Start watching user's location
    const id = navigator.geolocation.watchPosition(
      (position) => {
        setUserLocation([position.coords.latitude, position.coords.longitude]);
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
    };
  }, []);

  const currentStep = route?.routes?.[0]?.legs?.[0]?.steps?.[0];

  return (
    <Sheet open={true} onOpenChange={onClose}>
      <SheetContent side="bottom" className="h-[90vh] p-0">
        <SheetHeader className="p-4 bg-primary text-white">
          <div className="flex justify-between items-center">
            <SheetTitle className="text-white text-xl">
              {currentStep?.name || 'Follow Route'}
            </SheetTitle>
            <Button variant="ghost" size="icon" onClick={onClose} className="text-white">
              <X className="h-6 w-6" />
            </Button>
          </div>
          {currentStep && (
            <div className="flex items-center space-x-2 mt-2">
              <Navigation2 className="h-5 w-5" />
              <span>{(currentStep.distance / 1000).toFixed(1)} km</span>
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
                <LocationUpdater userLocation={userLocation} />
                <Marker position={userLocation}>
                </Marker>
              </>
            )}
          </MapContainer>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default NavigationView;