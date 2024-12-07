import React from 'react';
import { MapContainer, TileLayer, Polyline, Marker, Popup } from 'react-leaflet';
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
  const coordinates = route?.routes?.[0]?.geometry?.coordinates || [];
  const positions = coordinates.map((coord: [number, number]) => [coord[1], coord[0]]);
  const steps = route?.routes?.[0]?.legs?.flatMap((leg: any) => leg.steps) || [];

  return (
    <div className="space-y-4">
      <div className="h-[400px] w-full rounded-lg overflow-hidden shadow-lg">
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
          {steps.map((step: any, index: number) => (
            <Marker
              key={index}
              position={[step.maneuver.location[1], step.maneuver.location[0]]}
            >
              <Popup>
                <div className="p-2">
                  <p className="font-medium">{step.maneuver.type}</p>
                  <p>{step.name}</p>
                  <p className="text-sm text-gray-600">
                    {(step.distance / 1000).toFixed(1)} km
                  </p>
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>
      
      <div className="space-y-2 p-4 bg-white rounded-lg shadow">
        <h3 className="text-lg font-semibold mb-2">Navigation Instructions</h3>
        <div className="space-y-2">
          {steps.map((step: any, index: number) => (
            <div key={index} className="flex items-start space-x-3 p-2 hover:bg-gray-50 rounded">
              <div className="flex-shrink-0 w-6 h-6 bg-primary text-white rounded-full flex items-center justify-center text-sm">
                {index + 1}
              </div>
              <div>
                <p>{step.maneuver.type}</p>
                <p className="text-sm text-gray-600">
                  {step.name} ({(step.distance / 1000).toFixed(1)} km)
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default RouteMap;