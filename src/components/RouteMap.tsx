import React, { useState } from 'react';
import { GoogleMap, LoadScript, Polyline } from '@react-google-maps/api';
import { Button } from "@/components/ui/button";
import { Navigation } from 'lucide-react';
import NavigationView from './NavigationView';

interface RouteMapProps {
  route: any;
  center: [number, number];
}

const GOOGLE_MAPS_API_KEY = 'AIzaSyB0BfWCd1Sh1uy6taK4-5uaalH6DBxk6nY';

const RouteMap: React.FC<RouteMapProps> = ({ route, center }) => {
  const [showNavigation, setShowNavigation] = useState(false);
  const coordinates = route?.routes?.[0]?.geometry?.coordinates || [];
  const positions = coordinates.map((coord: [number, number]) => ({
    lat: coord[1],
    lng: coord[0]
  }));

  const containerStyle = {
    width: '100%',
    height: '400px'
  };

  return (
    <div className="space-y-4">
      <div className="h-[400px] w-full rounded-lg overflow-hidden shadow-lg relative">
        <LoadScript googleMapsApiKey={GOOGLE_MAPS_API_KEY}>
          <GoogleMap
            mapContainerStyle={containerStyle}
            center={{ lat: center[0], lng: center[1] }}
            zoom={13}
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
        </LoadScript>
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