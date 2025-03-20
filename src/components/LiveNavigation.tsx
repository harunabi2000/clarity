import React, { useEffect, useRef, useCallback } from "react";
import mapboxgl from "mapbox-gl";
import { config } from '@/config/env';
import { ChevronLeft, Volume2, VolumeX, Compass, Cloud } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLocationStore } from '@/stores/locationStore';
import { useNavigationStore } from '@/stores/navigationStore';
import { useWeatherStore } from '@/utils/weatherUtils';
import { initSpeech } from '@/utils/speechUtils';
import { getNextInstruction, isOffRoute } from '@/utils/routeUtils';

mapboxgl.accessToken = config.mapbox.accessToken;

interface LiveNavigationProps {
  route: {
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
  };
  onBack?: () => void;
}

export function LiveNavigation({ route, onBack }: LiveNavigationProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const userMarker = useRef<mapboxgl.Marker | null>(null);
  const routeLayer = useRef<string | null>(null);

  // Get location state
  const { 
    coords, 
    heading, 
    speed, 
    accuracy, 
    startTracking, 
    stopTracking,
    error: locationError
  } = useLocationStore();

  // Get navigation state
  const {
    isVoiceEnabled,
    toggleVoice,
    setCurrentStep,
    currentStep,
  } = useNavigationStore();

  // Get weather state
  const { weather, fetchWeather } = useWeatherStore();

  // Initialize map when component mounts
  useEffect(() => {
    if (!mapContainer.current) return;

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/streets-v12',
      zoom: 15,
      pitch: 45,
      bearing: 0,
      antialias: true,
    });

    // Add navigation controls
    map.current.addControl(
      new mapboxgl.NavigationControl(),
      'top-right'
    );

    // Initialize speech synthesis
    initSpeech();

    // Clean up on unmount
    return () => {
      if (map.current) {
        map.current.remove();
      }
    };
  }, []);

  // Initialize user marker
  useEffect(() => {
    if (!map.current) return;

    // Create user marker if it doesn't exist
    if (!userMarker.current) {
      const el = document.createElement('div');
      el.className = 'user-marker';
      el.style.width = '20px';
      el.style.height = '20px';
      el.style.borderRadius = '50%';
      el.style.backgroundColor = '#4338ca';
      el.style.border = '3px solid white';
      el.style.boxShadow = '0 0 10px rgba(0,0,0,0.3)';

      userMarker.current = new mapboxgl.Marker({
        element: el,
        pitchAlignment: 'map',
        rotationAlignment: 'map',
      });
    }

    // Update marker position if we have coordinates
    if (coords) {
      userMarker.current.setLngLat(coords).addTo(map.current);
      
      // Update camera with smooth transition
      map.current.easeTo({
        center: coords,
        bearing: heading || 0,
        pitch: 45,
        duration: 1000
      });

      // Update marker rotation if we have heading
      if (heading !== null) {
        userMarker.current.setRotation(heading);
      }
    }
  }, [coords, heading]);

  // Add route to map
  useEffect(() => {
    if (!map.current || !route) return;

    // Wait for map to be loaded
    map.current.on('load', () => {
      // Remove existing route layer if it exists
      if (routeLayer.current && map.current?.getLayer(routeLayer.current)) {
        map.current.removeLayer(routeLayer.current);
        map.current.removeSource(routeLayer.current);
      }

      // Add new route layer
      const layerId = 'route-' + Date.now();
      map.current.addSource(layerId, {
        type: 'geojson',
        data: {
          type: 'Feature',
          properties: {},
          geometry: route.geometry
        }
      });

      map.current.addLayer({
        id: layerId,
        type: 'line',
        source: layerId,
        layout: {
          'line-join': 'round',
          'line-cap': 'round'
        },
        paint: {
          'line-color': '#4338ca',
          'line-width': 6,
          'line-opacity': 0.8
        }
      });

      routeLayer.current = layerId;

      // Fit map to route bounds with padding
      const coordinates = route.geometry.coordinates;
      const bounds = coordinates.reduce((bounds, coord) => {
        return bounds.extend(coord as mapboxgl.LngLatLike);
      }, new mapboxgl.LngLatBounds(coordinates[0], coordinates[0]));

      map.current.fitBounds(bounds, {
        padding: 100
      });
    });
  }, [route]);

  // Start location tracking
  useEffect(() => {
    startTracking();
    return () => stopTracking();
  }, [startTracking, stopTracking]);

  // Update navigation instructions
  useEffect(() => {
    if (!coords || !route.properties.steps) return;

    const instruction = getNextInstruction(
      coords,
      heading || 0,
      route.properties.steps
    );

    if (instruction) {
      setCurrentStep(instruction);

      // Check if we need to fetch weather
      if (instruction.isApproaching && coords) {
        fetchWeather(coords);
      }
    }
  }, [coords, heading, route.properties.steps, setCurrentStep, fetchWeather]);

  // Check if user is off route
  useEffect(() => {
    if (!coords || !route.geometry.coordinates) return;

    if (isOffRoute(coords, route.geometry.coordinates)) {
      // TODO: Implement route recalculation
      console.log('User is off route');
    }
  }, [coords, route.geometry.coordinates]);

  // Format duration for display
  const formatDuration = (minutes: number): string => {
    if (minutes < 60) {
      return `${Math.round(minutes)} min`;
    }
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = Math.round(minutes % 60);
    return `${hours}h ${remainingMinutes}m`;
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
            <h2 className="text-lg font-semibold">Navigation</h2>
            {currentStep && (
              <p className="text-sm opacity-80">
                {currentStep.instruction}
                {currentStep.distance > 0 && ` (${Math.round(currentStep.distance)}m)`}
              </p>
            )}
            {route && (
              <p className="text-xs opacity-60">
                Total: {(route.properties.distance / 1000).toFixed(1)} km • {formatDuration(route.properties.duration / 60)}
              </p>
            )}
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="text-white hover:bg-purple-700"
            onClick={toggleVoice}
          >
            {isVoiceEnabled ? (
              <Volume2 className="h-6 w-6" />
            ) : (
              <VolumeX className="h-6 w-6" />
            )}
          </Button>
        </div>
      </div>

      {/* Map Container */}
      <div ref={mapContainer} className="w-full h-full" />

      {/* Info Panel */}
      <div className="absolute bottom-4 right-4 z-10 bg-background/95 backdrop-blur-sm p-4 rounded-lg shadow-lg space-y-4">
        {/* Navigation Info */}
        <div className="flex items-center gap-3">
          <Compass className="h-6 w-6 text-purple-500" />
          <div>
            <div className="font-medium">
              {heading !== null ? `${Math.round(heading)}°` : 'N/A'}
            </div>
            <div className="text-sm text-muted-foreground">
              Speed: {speed !== null ? `${(speed * 3.6).toFixed(1)} km/h` : 'N/A'}
            </div>
            <div className="text-sm text-muted-foreground">
              Accuracy: {accuracy !== null ? `±${accuracy.toFixed(0)}m` : 'N/A'}
            </div>
          </div>
        </div>

        {/* Weather Info */}
        {weather && (
          <div className="flex items-center gap-3">
            <Cloud className="h-6 w-6 text-purple-500" />
            <div>
              <div className="font-medium">{weather.temperature}°C</div>
              <div className="text-sm text-muted-foreground">
                {weather.description}
              </div>
              <div className="text-sm text-muted-foreground">
                Feels like: {weather.feelsLike}°C
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Error Messages */}
      {locationError && (
        <div className="absolute bottom-4 left-4 right-4 z-10">
          <div className="bg-destructive text-destructive-foreground p-4 rounded-lg max-w-md mx-auto">
            <p className="font-medium">Location Error</p>
            <p className="text-sm mt-1 opacity-90">{locationError}</p>
          </div>
        </div>
      )}
    </div>
  );
}
