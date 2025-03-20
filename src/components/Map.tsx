import { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import MapboxDirections from '@mapbox/mapbox-gl-directions/dist/mapbox-gl-directions';
import '@mapbox/mapbox-gl-directions/dist/mapbox-gl-directions.css';

const MAPBOX_TOKEN = 'pk.eyJ1IjoiaGFydW5hYmkyMDAwIiwiYSI6ImNtOGJ2cGl1NDBzem0yaXM1eDdhamlyeGoifQ.LYuUqmB0ImZKd8Um-uCM1g';

// Set Mapbox token directly
mapboxgl.accessToken = MAPBOX_TOKEN;

interface MapProps {
  initialCenter?: [number, number];
  initialZoom?: number;
}

export function Map({ 
  initialCenter = [-74.5, 40],
  initialZoom = 9
}: MapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const watchId = useRef<number | null>(null);
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  const [isNavigating, setIsNavigating] = useState(false);

  // Start watching position with high accuracy
  const startLocationTracking = () => {
    if ('geolocation' in navigator) {
      const options = {
        enableHighAccuracy: true,
        timeout: 5000,
        maximumAge: 0
      };

      watchId.current = navigator.geolocation.watchPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          console.log(`Location update received: ${latitude}, ${longitude}`);
          
          setUserLocation([longitude, latitude]);

          // Update map center and user marker if in navigation mode
          if (map.current && isNavigating) {
            map.current.setCenter([longitude, latitude]);
            // Update the directions route if available
            const directions = map.current.getControl('directions') as MapboxDirections;
            if (directions) {
              directions.setOrigin([longitude, latitude]);
            }
          }
        },
        (error) => {
          console.error('Geolocation error:', error);
        },
        options
      );
    } else {
      console.error('Geolocation is not supported by this browser');
    }
  };

  useEffect(() => {
    if (!mapContainer.current) return;

    // Initialize map
    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/streets-v12',
      center: initialCenter,
      zoom: initialZoom,
      accessToken: MAPBOX_TOKEN
    });

    // Add navigation controls
    map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');

    // Add directions control
    const directions = new MapboxDirections({
      accessToken: MAPBOX_TOKEN,
      unit: 'metric',
      profile: 'mapbox/driving',
      alternatives: true,
      geometries: 'geojson',
      controls: {
        inputs: true,
        instructions: true
      }
    });

    map.current.addControl(directions, 'top-left');

    // Add geolocate control
    const geolocate = new mapboxgl.GeolocateControl({
      positionOptions: {
        enableHighAccuracy: true
      },
      trackUserLocation: true,
      showUserHeading: true
    });

    map.current.addControl(geolocate);

    // Get user's location on load
    map.current.on('load', () => {
      geolocate.trigger();
    });

    // Update user location when it changes
    geolocate.on('geolocate', (position) => {
      if (position && position.coords) {
        const { longitude, latitude } = position.coords;
        setUserLocation([longitude, latitude]);
      }
    });

    // Cleanup
    return () => {
      if (watchId.current) {
        navigator.geolocation.clearWatch(watchId.current);
      }
      if (map.current) {
        map.current.remove();
      }
    };
  }, [initialCenter, initialZoom]);

  return (
    <div 
      ref={mapContainer} 
      style={{ 
        width: '100%', 
        height: '100%',
        minHeight: '400px',
        borderRadius: '8px',
        overflow: 'hidden'
      }} 
    />
  );
}
