
import React, { useState, useEffect, useRef } from 'react';
import mapboxgl from 'mapbox-gl';
import { Button } from "@/components/ui/button";
import { Navigation } from 'lucide-react';
import NavigationView from './NavigationView';
import { useToast } from "@/components/ui/use-toast";
import 'mapbox-gl/dist/mapbox-gl.css';

interface RouteMapProps {
  route: any;
  center: [number, number];
}

const RouteMap: React.FC<RouteMapProps> = ({ route, center }) => {
  const [showNavigation, setShowNavigation] = useState(false);
  const [mapboxToken, setMapboxToken] = useState<string>(
    localStorage.getItem('mapbox_token') || ''
  );
  const [showTokenInput, setShowTokenInput] = useState(!localStorage.getItem('mapbox_token'));
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const { toast } = useToast();

  const coordinates = route?.routes?.[0]?.geometry?.coordinates || [];

  const handleTokenSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (mapboxToken.trim()) {
      localStorage.setItem('mapbox_token', mapboxToken);
      setShowTokenInput(false);
      initializeMap();
      toast({
        title: "Token saved",
        description: "Your Mapbox token has been saved",
      });
    } else {
      toast({
        title: "Token required",
        description: "Please enter a valid Mapbox access token",
        variant: "destructive",
      });
    }
  };

  const initializeMap = () => {
    if (!mapContainer.current || !mapboxToken) return;
    
    if (map.current) return;

    mapboxgl.accessToken = mapboxToken;

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
        description: "There was an error initializing the map. Please check your token.",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    if (mapboxToken && !showTokenInput) {
      initializeMap();
    }

    return () => {
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, [mapboxToken, showTokenInput, center]);

  useEffect(() => {
    if (map.current && coordinates.length > 0 && map.current.isStyleLoaded()) {
      if (map.current.getSource('route')) {
        (map.current.getSource('route') as mapboxgl.GeoJSONSource).setData({
          type: 'Feature',
          properties: {},
          geometry: {
            type: 'LineString',
            coordinates: coordinates
          }
        });
      }
    }
  }, [coordinates]);

  if (showTokenInput) {
    return (
      <div className="space-y-4">
        <div className="p-6 border rounded-lg shadow-lg">
          <h3 className="text-lg font-medium mb-4">Mapbox Access Token Required</h3>
          <p className="mb-4 text-gray-600">
            To use the map feature, you need to provide a Mapbox access token. 
            Visit <a href="https://account.mapbox.com/access-tokens/" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">Mapbox</a> to create an account and get your free public token.
          </p>
          <form onSubmit={handleTokenSubmit} className="space-y-4">
            <input
              type="text"
              value={mapboxToken}
              onChange={(e) => setMapboxToken(e.target.value)}
              placeholder="Enter your Mapbox access token"
              className="w-full p-2 border rounded-md"
            />
            <Button type="submit">Save Token</Button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="h-[400px] w-full rounded-lg overflow-hidden shadow-lg relative">
        <div ref={mapContainer} className="h-full w-full" />
        <div className="absolute bottom-4 right-4 z-[1000]">
          <Button 
            onClick={() => setShowNavigation(true)}
            className="bg-primary hover:bg-primary/90"
          >
            <Navigation className="mr-2 h-4 w-4" />
            Start Navigation
          </Button>
        </div>
      </div>

      {showNavigation && (
        <NavigationView 
          route={route} 
          onClose={() => setShowNavigation(false)} 
        />
      )}
    </div>
  );
};

export default RouteMap;
