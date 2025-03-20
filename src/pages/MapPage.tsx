import React, { useState } from 'react';
import { Navigation } from '@/components/Navigation';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { Locate } from 'lucide-react';

export function MapPage() {
  const [origin, setOrigin] = useState<[number, number] | undefined>();
  const [destination, setDestination] = useState<[number, number] | undefined>();
  const { toast } = useToast();

  const handleLocationClick = () => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const coords: [number, number] = [
            position.coords.longitude,
            position.coords.latitude
          ];
          setOrigin(coords);
          toast({
            title: 'Location Found',
            description: `${coords[1].toFixed(4)}, ${coords[0].toFixed(4)}`
          });
        },
        (error) => {
          toast({
            title: 'Error',
            description: error.message,
            variant: 'destructive'
          });
        }
      );
    }
  };

  const handleRouteUpdate = (route: any) => {
    console.log('Route updated:', route);
  };

  return (
    <div className="relative w-full h-screen">
      <div className="absolute top-4 right-4 z-10 flex gap-2">
        <Button
          variant="secondary"
          size="icon"
          onClick={handleLocationClick}
          className="bg-background/80 backdrop-blur-sm"
        >
          <Locate className="h-4 w-4" />
          <span className="sr-only">Get Location</span>
        </Button>
      </div>
      
      <Navigation
        origin={origin}
        destination={destination}
        onRouteUpdate={handleRouteUpdate}
      />

      <div className="absolute bottom-4 left-4 right-4 z-10">
        <div className="bg-background/80 backdrop-blur-sm p-4 rounded-lg max-w-md mx-auto">
          <h2 className="text-xl font-semibold mb-3">
            How to Use
          </h2>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li>1. Click the location icon to set your current position</li>
            <li>2. Click on the map to set your destination</li>
            <li>3. Follow the route guidance and voice instructions</li>
            <li>4. Use the controls to toggle between walking and driving modes</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
