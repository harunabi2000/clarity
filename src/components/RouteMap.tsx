import React, { useState, useEffect, useRef } from 'react';
import mapboxgl from 'mapbox-gl';
import { Button } from "@/components/ui/button";
import { Navigation } from 'lucide-react';
import NavigationView from './NavigationView';
import { useToast } from "@/components/ui/use-toast";
import 'mapbox-gl/dist/mapbox-gl.css';

const MAPBOX_TOKEN = 'pk.eyJ1IjoiaGFydW5hYmkyMDAwIiwiYSI6ImNtOGJ2cGl1NDBzem0yaXM1eDdhamlyeGoifQ.LYuUqmB0ImZKd8Um-uCM1g';

interface RouteMapProps {
  route: any;
  center: [number, number];
}

const RouteMap: React.FC<RouteMapProps> = ({ route, center }) => {
  const [showNavigation, setShowNavigation] = useState(false);
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const { toast } = useToast();

  const coordinates = route?.routes?.[0]?.geometry?.coordinates || [];

  const initializeMap = () => {
    if (!mapContainer.current) return;
    
    if (map.current) return;

    mapboxgl.accessToken = MAPBOX_TOKEN;

    try {
      map.current = new mapboxgl.Map({
        container: mapContainer.current,
        style: 'mapbox://styles/mapbox/streets-v12',
        center: [center[1], center[0]],
        zoom: 13
      });

      map.current.on('load', () => {
        if (!map.current || coordinates.length === 0) return;

        map.current.addSource('route', {
          type: 'geojson',
          data: {
            type: 'Feature',
            properties: {},
            geometry: {
              type: 'LineString',
              coordinates: coordinates
            }
          }
        });
        
        map.current.addLayer({
          id: 'route',
          type: 'line',
          source: 'route',
          layout: {
            'line-join': 'round',
            'line-cap': 'round'
          },
          paint: {
            'line-color': '#3B82F6',
            'line-width': 4,
            'line-opacity': 0.7
          }
        });
      });
    } catch (error) {
      console.error('Error initializing Mapbox map:', error);
      toast({
        title: "Map error",
        description: "There was an error initializing the map",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    initializeMap();
    return () => {
      if (map.current) {
        map.current.remove();
      }
    };
  }, [center, coordinates]);

  return (
    <div className="relative w-full h-full rounded-lg overflow-hidden">
      <div ref={mapContainer} className="w-full h-full" />
      {showNavigation && <NavigationView route={route} onClose={() => setShowNavigation(false)} />}
      <Button
        className="absolute bottom-4 right-4 bg-primary text-white"
        onClick={() => setShowNavigation(!showNavigation)}
      >
        <Navigation className="mr-2 h-4 w-4" />
        {showNavigation ? 'Hide Navigation' : 'Show Navigation'}
      </Button>
    </div>
  );
};

export default RouteMap;
