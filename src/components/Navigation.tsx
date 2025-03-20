import React, { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import '@mapbox/mapbox-gl-directions/dist/mapbox-gl-directions.css';
import MapboxDirections from '@mapbox/mapbox-gl-directions/dist/mapbox-gl-directions';
import { useToast } from '@/components/ui/use-toast';
import { config } from '@/config/env';
import { ChevronLeft } from 'lucide-react';

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
  const [currentStreet, setCurrentStreet] = useState<string>('');
  const [nextStreet, setNextStreet] = useState<string>('');
  const [eta, setEta] = useState<string>('');
  const [distance, setDistance] = useState<string>('');

  useEffect(() => {
    if (!mapContainer.current) return;

    // Initialize map with a dark style that matches the iOS aesthetic
    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/navigation-night-v1',
      center: origin || [-74.5, 40],
      zoom: 13
    });

    // Add minimal navigation controls
    map.current.addControl(new mapboxgl.GeolocateControl({
      positionOptions: {
        enableHighAccuracy: true
      },
      trackUserLocation: true,
      showUserHeading: true
    }));

    // Initialize directions with custom styling
    directions.current = new MapboxDirections({
      accessToken: config.mapbox.accessToken,
      unit: 'metric',
      profile: 'mapbox/walking',
      alternatives: false,
      congestion: true,
      steps: true,
      voice_instructions: true,
      banner_instructions: true,
      interactive: false,
      controls: {
        inputs: false,
        instructions: false,
        profileSwitcher: false
      },
      styles: [
        {
          id: 'directions-route-line',
          type: 'line',
          paint: {
            'line-color': '#6B46C1',
            'line-width': 4
          }
        },
        {
          id: 'directions-route-arrow',
          type: 'symbol',
          layout: {
            'symbol-placement': 'line',
            'icon-image': 'arrow',
            'icon-size': 0.75,
            'symbol-spacing': 70
          }
        }
      ]
    });

    map.current.addControl(directions.current);

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
        const duration = Math.round(route.duration / 60);
        const distance = (route.distance / 1000).toFixed(1);
        const arrival = new Date(Date.now() + route.duration * 1000);
        const arrivalTime = arrival.toLocaleTimeString([], { 
          hour: 'numeric', 
          minute: '2-digit'
        });

        setDistance(`${distance} km`);
        setEta(`${duration} min • ${arrivalTime}`);

        if (route.legs[0]?.steps[0]) {
          setCurrentStreet(route.legs[0].steps[0].name);
          if (route.legs[0].steps[1]) {
            setNextStreet(route.legs[0].steps[1].name);
          }
        }

        if (onRouteUpdate) {
          onRouteUpdate(route);
        }

        // Voice guidance
        if ('speechSynthesis' in window) {
          const speech = new SpeechSynthesisUtterance(
            `Route found. ${distance} kilometers. Estimated arrival at ${arrivalTime}.`
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
      <div className="absolute inset-0">
        <div ref={mapContainer} className="w-full h-full" />
      </div>
      
      {/* Navigation Header */}
      <div className="absolute top-0 left-0 right-0 bg-purple-600 text-white p-4 rounded-b-lg shadow-lg z-10">
        <div className="flex items-center gap-3">
          <button className="p-1 hover:bg-purple-700 rounded-full transition-colors">
            <ChevronLeft className="w-6 h-6" />
          </button>
          <div className="flex-1">
            <div className="text-2xl font-semibold">{currentStreet}</div>
            {nextStreet && (
              <div className="text-sm opacity-80">Then {nextStreet}</div>
            )}
          </div>
          <div className="text-right">
            <div className="text-xl font-semibold">{distance}</div>
            <div className="text-sm opacity-80">{eta}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
