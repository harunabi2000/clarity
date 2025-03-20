import React, { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { config } from '@/config/env';
import { Search, Navigation as NavIcon, MapPin } from 'lucide-react';
import { generateLoopRoute } from '@/utils/routeUtils';
import { useLocationStore } from '@/stores/locationStore';

mapboxgl.accessToken = config.mapbox.accessToken;

export function Navigation() {
  const { toast } = useToast();
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const [duration, setDuration] = useState('');
  const [loading, setLoading] = useState(false);
  const [route, setRoute] = useState<any>(null);
  const { currentLocation } = useLocationStore();

  useEffect(() => {
    if (!mapContainer.current) return;

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/streets-v12',
      center: [currentLocation?.longitude || -0.1278, currentLocation?.latitude || 51.5074],
      zoom: 13,
    });

    // Add user location marker
    if (currentLocation) {
      new mapboxgl.Marker()
        .setLngLat([currentLocation.longitude, currentLocation.latitude])
        .addTo(map.current);
    }

    return () => {
      map.current?.remove();
    };
  }, [currentLocation]);

  const handleGenerateRoute = async () => {
    if (!currentLocation) {
      toast({
        title: "Error",
        description: "Please enable location services",
        variant: "destructive",
      });
      return;
    }

    if (!duration || isNaN(Number(duration)) || Number(duration) <= 0) {
      toast({
        title: "Error",
        description: "Please enter a valid duration in minutes",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const waypoints = await generateLoopRoute(currentLocation, Number(duration));
      setRoute(waypoints);

      // Add route to map
      if (map.current) {
        if (map.current.getSource('route')) {
          (map.current.getSource('route') as mapboxgl.GeoJSONSource).setData({
            type: 'Feature',
            properties: {},
            geometry: {
              type: 'LineString',
              coordinates: waypoints.map((point: any) => [point.longitude, point.latitude])
            }
          });
        } else {
          map.current.addSource('route', {
            type: 'geojson',
            data: {
              type: 'Feature',
              properties: {},
              geometry: {
                type: 'LineString',
                coordinates: waypoints.map((point: any) => [point.longitude, point.latitude])
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
              'line-color': '#3498db',
              'line-width': 4
            }
          });
        }

        // Fit map to route bounds
        const coordinates = waypoints.map((point: any) => [point.longitude, point.latitude]);
        const bounds = coordinates.reduce((bounds: mapboxgl.LngLatBounds, coord: number[]) => {
          return bounds.extend(coord as mapboxgl.LngLatLike);
        }, new mapboxgl.LngLatBounds(coordinates[0], coordinates[0]));

        map.current.fitBounds(bounds, {
          padding: 50
        });
      }

      toast({
        title: "Success",
        description: "Route generated successfully",
      });
    } catch (error) {
      console.error('Error generating route:', error);
      toast({
        title: "Error",
        description: "Failed to generate route. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-screen relative">
      <div ref={mapContainer} className="w-full h-full" />

      <Card className="absolute bottom-0 left-0 right-0 p-6 rounded-t-3xl bg-white/95 backdrop-blur-sm shadow-lg">
        <div className="space-y-4">
          <div className="flex items-center gap-3 bg-gray-100 rounded-xl p-4">
            <MapPin className="text-[#3498db]" />
            <Input
              type="number"
              placeholder="Duration (minutes)"
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
              className="border-none bg-transparent text-lg placeholder:text-gray-500"
            />
          </div>

          <Button
            onClick={handleGenerateRoute}
            disabled={loading}
            className="w-full py-6 text-lg bg-[#3498db] hover:bg-[#2980b9] transition-colors duration-200"
          >
            {loading ? (
              <div className="flex items-center gap-2">
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                Generating...
              </div>
            ) : (
              <>
                <NavIcon className="mr-2" />
                Generate Route
              </>
            )}
          </Button>
        </div>
      </Card>
    </div>
  );
}
