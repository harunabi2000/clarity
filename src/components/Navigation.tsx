import React, { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import '@mapbox/mapbox-gl-directions/dist/mapbox-gl-directions.css';
import { useToast } from '@/components/ui/use-toast';
import { config } from '@/config/env';
import { ChevronLeft, Search, Navigation as NavIcon, RefreshCw, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { calculateRoute } from '@/utils/routeUtils';
import { LiveNavigation } from './LiveNavigation';

mapboxgl.accessToken = config.mapbox.accessToken;

interface NavigationProps {
  origin?: [number, number];
  onBack?: () => void;
}

export function Navigation({ origin, onBack }: NavigationProps) {
  const { toast } = useToast();
  const [startLocation, setStartLocation] = useState('');
  const [desiredDistance, setDesiredDistance] = useState(2); // in kilometers
  const [isGeneratingRoute, setIsGeneratingRoute] = useState(false);
  const [isNavigating, setIsNavigating] = useState(false);
  const [currentRoute, setCurrentRoute] = useState<{
    type: 'Feature';
    geometry: {
      type: 'LineString';
      coordinates: [number, number][];
    };
    properties: any;
  } | null>(null);

  const generateRoute = async () => {
    if (!startLocation) {
      toast({
        title: 'Please enter a start location',
        description: 'Start location is required to generate a route',
        variant: 'destructive',
      });
      return;
    }

    setIsGeneratingRoute(true);
    try {
      const startCoords = await geocodeLocation(startLocation);
      if (!startCoords) {
        throw new Error('Could not find start location');
      }

      // Generate a route using Mapbox Directions API
      const route = await calculateRoute(startCoords, startCoords);
      setCurrentRoute({
        type: 'Feature',
        geometry: {
          type: 'LineString',
          coordinates: route.geometry.coordinates
        },
        properties: {
          distance: route.distance,
          duration: route.duration,
          steps: route.legs[0].steps
        }
      });

      // Show waypoints in the toast
      toast({
        title: 'Route generated',
        description: `Route distance: ${(route.distance / 1000).toFixed(1)} km`,
      });

    } catch (error) {
      console.error('Error generating route:', error);
      toast({
        title: 'Error generating route',
        description: 'Please try a different location or distance',
        variant: 'destructive',
      });
    } finally {
      setIsGeneratingRoute(false);
    }
  };

  // Function to geocode an address to coordinates
  const geocodeLocation = async (query: string) => {
    try {
      const response = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(
          query
        )}.json?access_token=${mapboxgl.accessToken}`
      );
      const data = await response.json();
      if (data.features && data.features.length > 0) {
        return data.features[0].center as [number, number];
      }
    } catch (error) {
      console.error('Geocoding error:', error);
    }
    return null;
  };

  const startNavigation = () => {
    if (!currentRoute) {
      toast({
        title: 'No route selected',
        description: 'Please generate a route first',
        variant: 'destructive',
      });
      return;
    }
    setIsNavigating(true);
  };

  if (isNavigating && currentRoute) {
    return (
      <LiveNavigation
        route={currentRoute}
        onBack={() => setIsNavigating(false)}
      />
    );
  }

  return (
    <div className="h-screen relative">
      {/* Navigation Header */}
      <div className="absolute top-0 left-0 right-0 z-10 bg-purple-600 text-white p-4 shadow-lg">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            className="text-white hover:bg-purple-700"
            onClick={onBack}
          >
            <ChevronLeft className="h-6 w-6" />
          </Button>
          <div className="flex-1">
            <h2 className="text-lg font-semibold">Generate a Route</h2>
            <p className="text-sm opacity-80">
              Create a loop route starting from any location
            </p>
          </div>
        </div>
      </div>

      {/* Route Generator */}
      <Card className="absolute top-20 left-4 right-4 z-10 p-4 bg-background/95 backdrop-blur shadow-lg">
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <MapPin className="h-5 w-5 text-purple-500" />
            <Input
              placeholder="Enter start location"
              value={startLocation}
              onChange={(e) => setStartLocation(e.target.value)}
              className="flex-1"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">
              Desired distance: {desiredDistance} km
            </label>
            <Slider
              value={[desiredDistance]}
              onValueChange={([value]) => setDesiredDistance(value)}
              min={1}
              max={10}
              step={0.5}
            />
          </div>
          <div className="flex gap-2">
            <Button
              className="flex-1"
              onClick={generateRoute}
              disabled={isGeneratingRoute}
            >
              {isGeneratingRoute ? (
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Search className="h-4 w-4 mr-2" />
              )}
              Generate Loop Route
            </Button>
            {currentRoute && (
              <Button
                variant="secondary"
                className="flex-1"
                onClick={startNavigation}
              >
                <NavIcon className="h-4 w-4 mr-2" />
                Start Navigation
              </Button>
            )}
          </div>
        </div>
      </Card>

      {/* Map Preview */}
      <div id="map" className="w-full h-full" />
    </div>
  );
}
