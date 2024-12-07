import React, { useState } from 'react';
import { MapContainer, TileLayer, Polyline, Marker, Popup } from 'react-leaflet';
import { Button } from "@/components/ui/button";
import { Navigation } from 'lucide-react';
import NavigationView from './NavigationView';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix for default markers
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

interface RouteMapProps {
  route: any;
  center: [number, number];
}

const RouteMap: React.FC<RouteMapProps> = ({ route, center }) => {
  const [showNavigation, setShowNavigation] = useState(false);
  const coordinates = route?.routes?.[0]?.geometry?.coordinates || [];
  const positions = coordinates.map((coord: [number, number]) => [coord[1], coord[0]]);

  return (
    <div className="space-y-4">
      <div className="h-[400px] w-full rounded-lg overflow-hidden shadow-lg relative">
        <MapContainer
          center={center}
          zoom={13}
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
        </MapContainer>
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