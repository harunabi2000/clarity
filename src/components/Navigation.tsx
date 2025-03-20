import React, { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import '@mapbox/mapbox-gl-directions/dist/mapbox-gl-directions.css';
import MapboxDirections from '@mapbox/mapbox-gl-directions/dist/mapbox-gl-directions';
import { useToast } from '@/components/ui/use-toast';
import { config } from '@/config/env';
import { ChevronLeft, Search, Navigation as NavIcon, Clock, MapPin, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { generateLoopRoute, generateMindfulRoute } from '@/utils/routeUtils';

mapboxgl.accessToken = config.mapbox.accessToken;

interface NavigationProps {
  origin?: [number, number];
  destination?: [number, number];
  onRouteUpdate?: (route: any) => void;
  onBack?: () => void;
}

export function Navigation({ origin, destination, onRouteUpdate, onBack }: NavigationProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const directions = useRef<any>(null);
  const routeLayer = useRef<string | null>(null);
  const { toast } = useToast();
  const [currentStreet, setCurrentStreet] = useState<string>('');
  const [nextStreet, setNextStreet] = useState<string>('');
  const [eta, setEta] = useState<string>('');
  const [distance, setDistance] = useState<string>('');
  const [isNavigating, setIsNavigating] = useState(false);
  const [startLocation, setStartLocation] = useState('');
  const [desiredDistance, setDesiredDistance] = useState(2); // in kilometers
  const [isGeneratingRoute, setIsGeneratingRoute] = useState(false);

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
        return data.features[0].center;
      }
    } catch (error) {
      console.error('Geocoding error:', error);
    }
    return null;
  };

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

      // Generate a mindful loop route
      const route = await generateMindfulRoute(startCoords as [number, number], desiredDistance);

      // Remove existing route layer if it exists
      if (routeLayer.current && map.current?.getLayer(routeLayer.current)) {
        map.current.removeLayer(routeLayer.current);
        map.current.removeSource(routeLayer.current);
      }

      // Add the new route to the map
      const layerId = `route-${Date.now()}`;
      map.current?.addSource(layerId, {
        type: 'geojson',
        data: route
      });

      map.current?.addLayer({
        id: layerId,
        type: 'line',
        source: layerId,
        layout: {
          'line-join': 'round',
          'line-cap': 'round'
        },
        paint: {
          'line-color': '#a855f7',
          'line-width': 4
        }
      });

      routeLayer.current = layerId;

      // Fit the map to show the entire route
      const coordinates = route.geometry.coordinates;
      const bounds = coordinates.reduce((bounds, coord) => {
        return bounds.extend(coord as mapboxgl.LngLatLike);
      }, new mapboxgl.LngLatBounds(coordinates[0], coordinates[0]));

      map.current?.fitBounds(bounds, {
        padding: 50
      });

      // Update route information
      const distanceInKm = route.properties.distance / 1000;
      const durationInMin = Math.round(route.properties.duration / 60);
      setDistance(`${distanceInKm.toFixed(1)} km`);
      setEta(`${durationInMin} min`);

      // Show waypoints in the toast
      if (route.properties.waypoints) {
        toast({
          title: 'Route generated',
          description: `Your route includes: ${route.properties.waypoints.map((wp: any) => wp.name).join(', ')}`,
        });
      }

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

  useEffect(() => {
    if (!mapContainer.current) return;

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/navigation-night-v1',
      center: origin || [-74.5, 40],
      zoom: 13
    });

    map.current.addControl(new mapboxgl.GeolocateControl({
      positionOptions: {
        enableHighAccuracy: true
      },
      trackUserLocation: true,
      showUserHeading: true
    }));

    return () => {
      if (map.current) {
        map.current.remove();
      }
    };
  }, []);

  const startNavigation = () => {
    setIsNavigating(true);
    map.current?.easeTo({
      pitch: 60,
      zoom: 18
    });
  };

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
            <h2 className="text-lg font-semibold">{currentStreet || 'Generate a Route'}</h2>
            {distance && eta && (
              <p className="text-sm opacity-80">
                {distance} • {eta}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Route Generator */}
      {!isNavigating && (
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
              {distance && (
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
      )}

      {/* Map Container */}
      <div ref={mapContainer} className="w-full h-full" />
    </div>
  );
}
