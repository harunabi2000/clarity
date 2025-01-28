import React, { useState } from 'react';
import { GoogleMap, LoadScript, Polyline, useLoadScript } from '@react-google-maps/api';
import { Button } from "@/components/ui/button";
import { Navigation } from 'lucide-react';
import NavigationView from './NavigationView';
import { useToast } from "@/components/ui/use-toast";

interface RouteMapProps {
  route: any;
  center: [number, number];
}

const GOOGLE_MAPS_API_KEY = 'AIzaSyB0BfWCd1Sh1uy6taK4-5uaalH6DBxk6nY';

const RouteMap: React.FC<RouteMapProps> = ({ route, center }) => {
  const [showNavigation, setShowNavigation] = useState(false);
  const { toast } = useToast();
  
  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: GOOGLE_MAPS_API_KEY
  });

  const coordinates = route?.routes?.[0]?.geometry?.coordinates || [];
  const positions = coordinates.map((coord: [number, number]) => ({
    lat: coord[1],
    lng: coord[0]
  }));

  const containerStyle = {
    width: '100%',
    height: '400px'
  };

  if (loadError) {
    console.error('Error loading Google Maps:', loadError);
    toast({
      title: "Error loading map",
      description: "There was an issue loading Google Maps. Please try again later.",
      variant: "destructive",
    });
    return (
      <div className="h-[400px] w-full rounded-lg overflow-hidden shadow-lg bg-gray-100 flex items-center justify-center">
        <p className="text-gray-600">Unable to load map</p>
      </div>
    );
  }

  if (!isLoaded) {
    return (
      <div className="h-[400px] w-full rounded-lg overflow-hidden shadow-lg bg-gray-100 flex items-center justify-center">
        <p className="text-gray-600">Loading map...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="h-[400px] w-full rounded-lg overflow-hidden shadow-lg relative">
        <GoogleMap
          mapContainerStyle={containerStyle}
          center={{ lat: center[0], lng: center[1] }}
          zoom={13}
          options={{
            gestureHandling: 'greedy',
            fullscreenControl: false,
          }}
        >
          {positions.length > 0 && (
            <Polyline
              path={positions}
              options={{
                strokeColor: '#3B82F6',
                strokeWeight: 3,
                strokeOpacity: 0.7,
              }}
            />
          )}
        </GoogleMap>
        <div className="absolute bottom-4 right-4 z-[1000]">
          <Button 
            onClick={() => setShowNavigation(true)}
            className="bg-primary hover:bg-primary/90"
          >
            <Navigation className="mr-2 h-4 w-4" />
            Start Navigation
          </Button>
        </div>
      </div>

      {showNavigation && (
        <NavigationView 
          route={route} 
          onClose={() => setShowNavigation(false)} 
        />
      )}
    </div>
  );
};

export default RouteMap;