import React, { useEffect, useRef } from 'react';
import mapboxgl from 'mapbox-gl';
import '@mapbox/mapbox-gl-directions/dist/mapbox-gl-directions.css';
import MapboxDirections from '@mapbox/mapbox-gl-directions/dist/mapbox-gl-directions';
import { useToast } from '@/components/ui/use-toast';
import { config } from '@/config/env';

// Set the access token globally for mapbox-gl
mapboxgl.accessToken = config.mapbox.accessToken;

interface NavigationProps {
  origin?: [number, number];
  destination?: [number, number];
  onRouteUpdate?: (route: any) => void;
}

export function Navigation({ origin, destination, onRouteUpdate }: NavigationProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const directions = useRef<any>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (!mapContainer.current) return;

    // Initialize map
    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/streets-v12',
      center: origin || [-74.5, 40],
      zoom: 13
    });

    // Add navigation controls
    map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');
    map.current.addControl(new mapboxgl.GeolocateControl({
      positionOptions: {
        enableHighAccuracy: true
      },
      trackUserLocation: true,
      showUserHeading: true
    }));

    // Initialize directions
    directions.current = new MapboxDirections({
      accessToken: config.mapbox.accessToken,
      unit: 'metric',
      profile: 'mapbox/walking',
      alternatives: true,
      congestion: true,
      steps: true,
      voice_instructions: true,
      banner_instructions: true
    });

    map.current.addControl(directions.current, 'top-left');

    // Clean up
    return () => {
      if (map.current) {
        map.current.remove();
      }
    };
  }, []);

  // Update route when origin/destination change
  useEffect(() => {
    if (directions.current && origin && destination) {
      directions.current.setOrigin(origin);
      directions.current.setDestination(destination);
    }
  }, [origin, destination]);

  // Listen for route updates
  useEffect(() => {
    if (!map.current || !directions.current) return;

    const handleRoute = (e: any) => {
      const route = e.route[0];
      if (route) {
        // Calculate duration in minutes
        const duration = Math.round(route.duration / 60);
        // Distance in kilometers
        const distance = (route.distance / 1000).toFixed(2);

        toast({
          title: 'Route Found',
          description: `${distance}km • ${duration} minutes`
        });

        if (onRouteUpdate) {
          onRouteUpdate(route);
        }

        // Start voice navigation if available
        if ('speechSynthesis' in window) {
          const speech = new SpeechSynthesisUtterance(
            `Route found. Distance: ${distance} kilometers. Estimated time: ${duration} minutes.`
          );
          window.speechSynthesis.speak(speech);
        }
      }
    };

    directions.current.on('route', handleRoute);

    return () => {
      directions.current.off('route', handleRoute);
    };
  }, [onRouteUpdate]);

  return (
    <div className="relative w-full h-full min-h-[500px]">
      <div ref={mapContainer} className="absolute inset-0" />
    </div>
  );
}
