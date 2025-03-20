import React, { useEffect, useState, useRef } from "react";
import mapboxgl from "mapbox-gl";
import { config } from '@/config/env';
import { ChevronLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';

interface LiveNavigationProps {
  route?: GeoJSON.Feature;
  onBack?: () => void;
}

export function LiveNavigation({ route, onBack }: LiveNavigationProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const userMarker = useRef<mapboxgl.Marker | null>(null);
  const routeLayer = useRef<string | null>(null);
  const [userCoords, setUserCoords] = useState<[number, number] | null>(null);
  const [currentStreet, setCurrentStreet] = useState<string>('');
  const [nextInstruction, setNextInstruction] = useState<string>('');
  const [distanceToNext, setDistanceToNext] = useState<string>('');
  const { toast } = useToast();

  // Initialize map
  useEffect(() => {
    if (!mapContainer.current || map.current) return;

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/navigation-night-v1',
      center: userCoords || [-74.5, 40],
      zoom: 15,
      pitch: 60
    });

    // Add navigation controls
    map.current.addControl(
      new mapboxgl.NavigationControl({ showCompass: false }),
      'bottom-right'
    );

    return () => {
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, [userCoords]);

  // Handle user location tracking
  useEffect(() => {
    if (!map.current) return;

    const handleSuccess = (position: GeolocationPosition) => {
      const { latitude, longitude, heading, speed } = position.coords;
      const newCoords: [number, number] = [longitude, latitude];
      setUserCoords(newCoords);

      // Update or create user marker
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
          .setLngLat(newCoords)
          .addTo(map.current);
      } else {
        userMarker.current.setLngLat(newCoords);
      }

      // Rotate marker if heading is available
      if (heading) {
        userMarker.current.setRotation(heading);
      }

      // Update camera position and bearing
      map.current.easeTo({
        center: newCoords,
        bearing: heading || 0,
        pitch: 60,
        duration: 1000
      });

      // Update street name
      fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${longitude},${latitude}.json?access_token=${config.mapbox.accessToken}`
      )
        .then((res) => res.json())
        .then((data) => {
          const street = data.features.find((f: any) => 
            f.place_type.includes('street') || f.place_type.includes('address')
          );
          if (street) {
            setCurrentStreet(street.text);
          }
        })
        .catch(console.error);

      // If we have a route, check distance to next turn
      if (route) {
        // TODO: Calculate distance to next turn and update instructions
      }
    };

    const handleError = (error: GeolocationPositionError) => {
      console.error("Geolocation error:", error);
      toast({
        title: "Location Error",
        description: "Unable to get your location. Please check your GPS settings.",
        variant: "destructive"
      });
    };

    // Watch user position with high accuracy
    const watchId = navigator.geolocation.watchPosition(
      handleSuccess,
      handleError,
      {
        enableHighAccuracy: true,
        maximumAge: 1000,
        timeout: 5000,
      }
    );

    return () => navigator.geolocation.clearWatch(watchId);
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
            <h2 className="text-lg font-semibold">{currentStreet || 'Finding location...'}</h2>
            {nextInstruction && (
              <p className="text-sm opacity-80">
                {nextInstruction} • {distanceToNext}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Map Container */}
      <div ref={mapContainer} className="w-full h-full" />
    </div>
  );
}
