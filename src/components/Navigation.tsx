import React, { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import '@mapbox/mapbox-gl-directions/dist/mapbox-gl-directions.css';
import { useToast } from '@/components/ui/use-toast';
import { config } from '@/config/env';
import { ChevronLeft, Search, Navigation as NavIcon, RefreshCw, MapPin, Crosshair } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { calculateRoute } from '@/utils/routeUtils';
import { LiveNavigation } from './LiveNavigation';
import { useLocationStore } from '@/stores/locationStore';
import { LocationSearch, Location } from './LocationSearch';

mapboxgl.accessToken = config.mapbox.accessToken;

interface NavigationProps {
  onBack?: () => void;
}

export function Navigation({ onBack }: NavigationProps) {
  const { toast } = useToast();
  const { coords: currentLocation, startTracking } = useLocationStore();
  const [startLocation, setStartLocation] = useState<Location | null>(null);
  const [endLocation, setEndLocation] = useState<Location | null>(null);
  const [isGeneratingRoute, setIsGeneratingRoute] = useState(false);
  const [isNavigating, setIsNavigating] = useState(false);
  const [currentRoute, setCurrentRoute] = useState<{
    type: 'Feature';
    geometry: {
      type: 'LineString';
      coordinates: [number, number][];
    };
    properties: {
      distance: number;
      duration: number;
      steps: {
        maneuver: {
          instruction: string;
          location: [number, number];
          bearing_before: number;
          bearing_after: number;
          type: string;
        };
        distance: number;
        duration: number;
        name: string;
      }[];
    };
  } | null>(null);

  // Start location tracking when component mounts
  useEffect(() => {
    startTracking();
  }, [startTracking]);

  const generateRoute = async () => {
    if (!startLocation && !currentLocation) {
      toast({
        title: 'No start location',
        description: 'Please enter a start location or allow location access',
        variant: 'destructive',
      });
      return;
    }

    if (!endLocation) {
      toast({
        title: 'No destination',
        description: 'Please enter a destination',
        variant: 'destructive',
      });
      return;
    }

    setIsGeneratingRoute(true);
    try {
      // Use coordinates from selected locations
      const startCoords = startLocation 
        ? startLocation.coordinates
        : currentLocation;

      if (!startCoords) {
        throw new Error('Could not determine start location');
      }

      const route = await calculateRoute(startCoords, endLocation.coordinates);
      
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

      toast({
        title: 'Route generated',
        description: `Distance: ${(route.distance / 1000).toFixed(1)} km • Duration: ${Math.round(route.duration / 60)} min`,
      });

    } catch (error) {
      console.error('Error generating route:', error);
      toast({
        title: 'Error generating route',
        description: error instanceof Error ? error.message : 'Please try different locations',
        variant: 'destructive',
      });
    } finally {
      setIsGeneratingRoute(false);
    }
  };

  const useCurrentLocation = () => {
    if (!currentLocation) {
      toast({
        title: 'Location not available',
        description: 'Please enable location services or enter an address',
        variant: 'destructive',
      });
      return;
    }
    setStartLocation(null);
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
            <h2 className="text-lg font-semibold">Navigation</h2>
            <p className="text-sm opacity-80">
              Enter your destination to start
            </p>
          </div>
        </div>
      </div>

      {/* Route Generator */}
      <Card className="absolute top-20 left-4 right-4 z-10 p-4 bg-background/95 backdrop-blur shadow-lg">
        <div className="space-y-4">
          {/* Start Location */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Start Location</label>
            <div className="flex items-center gap-2">
              <LocationSearch
                placeholder={currentLocation ? "Using current location" : "Enter start location"}
                onLocationSelect={setStartLocation}
                initialValue={startLocation?.place_name || ''}
                className="flex-1"
              />
              <Button
                variant="outline"
                size="icon"
                onClick={useCurrentLocation}
                disabled={!currentLocation || isGeneratingRoute}
                title="Use current location"
              >
                <Crosshair className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* End Location */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Destination</label>
            <LocationSearch
              placeholder="Enter destination"
              onLocationSelect={setEndLocation}
              initialValue={endLocation?.place_name || ''}
              className="flex-1"
            />
          </div>

          {/* Action Buttons */}
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
              Get Directions
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
