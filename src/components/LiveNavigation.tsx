import React, { useEffect, useRef, useCallback } from "react";
import mapboxgl from "mapbox-gl";
import { config } from '@/config/env';
import { ChevronLeft, Volume2, VolumeX, Compass, Cloud } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLocationStore } from '@/stores/locationStore';
import { useNavigationStore } from '@/stores/navigationStore';
import { useWeatherStore } from '@/utils/weatherUtils';
import { initSpeech } from '@/utils/speechUtils';

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
    currentStep,
    nextStep,
    distanceToNextStep,
    isRerouting,
    voiceGuidance,
    toggleVoiceGuidance,
    startNavigation,
    stopNavigation,
    updateNavigation,
    error: navigationError
  } = useNavigationStore();

  // Get weather state
  const { data: weather, updateWeather } = useWeatherStore();

  // Initialize map
  useEffect(() => {
    if (!mapContainer.current || map.current) return;

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/navigation-night-v1',
      center: coords || [-74.5, 40],
      zoom: 15,
      pitch: 60
    });

    // Add navigation controls
    map.current.addControl(
      new mapboxgl.NavigationControl({ showCompass: false }),
      'bottom-right'
    );

    // Initialize speech synthesis
    initSpeech();

    return () => {
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, []);

  // Start navigation and location tracking
  useEffect(() => {
    if (!route) return;

    startNavigation(route);
    startTracking();

    return () => {
      stopNavigation();
      stopTracking();
    };
  }, [route]);

  // Draw route on map
  useEffect(() => {
    if (!map.current || !route) return;

    // Remove existing route layer
    if (routeLayer.current && map.current.getLayer(routeLayer.current)) {
      map.current.removeLayer(routeLayer.current);
      map.current.removeSource(routeLayer.current);
    }

    // Add new route layer
    const layerId = `route-${Date.now()}`;
    map.current.addSource(layerId, {
      type: 'geojson',
      data: route
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
        'line-color': '#a855f7',
        'line-width': 4
      }
    });

    routeLayer.current = layerId;

    // Fit map to show entire route
    const coordinates = route.geometry.coordinates;
    const bounds = coordinates.reduce((bounds, coord) => {
      return bounds.extend(coord as mapboxgl.LngLatLike);
    }, new mapboxgl.LngLatBounds(coordinates[0], coordinates[0]));

    map.current.fitBounds(bounds, {
      padding: 50
    });
  }, [route]);

  // Update user marker and camera position
  const updateUserPosition = useCallback((position: [number, number], heading: number | null) => {
    if (!map.current) return;

    // Create or update user marker
    if (!userMarker.current) {
      const el = document.createElement('div');
      el.className = 'user-marker';
      el.style.width = '24px';
      el.style.height = '24px';
      el.style.borderRadius = '50%';
      el.style.background = '#a855f7';
      el.style.border = '3px solid white';
      el.style.boxShadow = '0 0 10px rgba(0,0,0,0.5)';

      userMarker.current = new mapboxgl.Marker({
        element: el,
        rotationAlignment: 'map',
        pitchAlignment: 'map'
      })
        .setLngLat(position)
        .addTo(map.current);
    } else {
      userMarker.current.setLngLat(position);
    }

    // Update marker rotation if heading is available
    if (heading !== null) {
      userMarker.current.setRotation(heading);
    }

    // Smooth camera transition
    map.current.easeTo({
      center: position,
      bearing: heading || 0,
      pitch: 60,
      duration: 1000,
      essential: true // This animation is considered essential for navigation
    });
  }, []);

  // Update navigation and weather when location changes
  useEffect(() => {
    if (coords && heading !== null) {
      updateUserPosition(coords, heading);
      updateNavigation(coords, heading);
      updateWeather(coords);
    }
  }, [coords, heading, updateNavigation, updateUserPosition, updateWeather]);

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
            <h2 className="text-lg font-semibold">
              {currentStep?.name || 'Finding location...'}
              {isRerouting && ' (Rerouting...)'}
            </h2>
            {nextStep && distanceToNextStep && (
              <p className="text-sm opacity-80">
                {nextStep.maneuver.instruction} • {(distanceToNextStep / 1000).toFixed(1)} km
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
            onClick={toggleVoiceGuidance}
          >
            {voiceGuidance ? (
              <Volume2 className="h-6 w-6" />
            ) : (
              <VolumeX className="h-6 w-6" />
            )}
          </Button>
        </div>
      </div>

      {/* Map Container */}
      <div ref={mapContainer} className="w-full h-full" />

      {/* Speed, Weather, and Accuracy Indicator */}
      <div className="absolute bottom-20 right-4 z-10 bg-background/90 backdrop-blur p-4 rounded-lg text-sm space-y-3">
        {/* Navigation Info */}
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Compass className="h-4 w-4" />
            <span>{heading !== null ? `${Math.round(heading)}°` : 'N/A'}</span>
          </div>
          <div>Speed: {speed !== null ? `${(speed * 3.6).toFixed(1)} km/h` : 'N/A'}</div>
          <div>Accuracy: {accuracy !== null ? `±${accuracy.toFixed(0)}m` : 'N/A'}</div>
        </div>

        {/* Weather Info */}
        {weather && (
          <div className="border-t pt-2 space-y-1">
            <div className="flex items-center gap-2">
              <Cloud className="h-4 w-4" />
              <span>{weather.temperature}°C • {weather.description}</span>
            </div>
            <div>Wind: {weather.windSpeed} km/h</div>
            <div>Feels like: {weather.feelsLike}°C</div>
          </div>
        )}

        {/* Error Messages */}
        {(locationError || navigationError) && (
          <div className="border-t pt-2 text-red-500">
            {locationError && <div>{locationError}</div>}
            {navigationError && <div>{navigationError}</div>}
          </div>
        )}
      </div>
    </div>
  );
}
