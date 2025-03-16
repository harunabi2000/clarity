
import React, { useEffect, useState, useRef } from 'react';
import mapboxgl from 'mapbox-gl';
import { Sheet, SheetContent } from "@/components/ui/sheet";
import NavigationHeader from './NavigationHeader';
import { useLocationTracking } from '@/hooks/useLocationTracking';
import { speak, cancelSpeech } from '@/utils/speechUtils';

interface NavigationViewProps {
  route: any;
  onClose: () => void;
}

const NavigationView: React.FC<NavigationViewProps> = ({ route, onClose }) => {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [isSpeechEnabled, setIsSpeechEnabled] = useState(true);
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const userMarker = useRef<mapboxgl.Marker | null>(null);
  
  const coordinates = route?.routes?.[0]?.geometry?.coordinates || [];
  const steps = route?.routes?.[0]?.legs?.[0]?.steps || [];
  const currentStep = steps[currentStepIndex];
  const mapboxToken = localStorage.getItem('mapbox_token') || '';

  const handleStepComplete = () => {
    setCurrentStepIndex(prev => prev + 1);
  };

  const userLocation = useLocationTracking({
    steps,
    currentStepIndex,
    onStepComplete: handleStepComplete,
  });

  useEffect(() => {
    if (!mapContainer.current || !mapboxToken) return;
    
    mapboxgl.accessToken = mapboxToken;

    if (map.current) return;

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/streets-v12',
      center: coordinates[0] ? [coordinates[0][0], coordinates[0][1]] : [0, 0],
      zoom: 16
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

      // Add navigation controls
      map.current.addControl(
        new mapboxgl.NavigationControl(),
        'top-right'
      );
    });

    return () => {
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, [mapboxToken, coordinates]);

  useEffect(() => {
    if (currentStep) {
      speak(currentStep.maneuver.instruction, isSpeechEnabled);
    }
    return () => cancelSpeech();
  }, [currentStep, isSpeechEnabled]);

  useEffect(() => {
    if (map.current && userLocation) {
      // Update map center to follow user
      map.current.setCenter([userLocation[1], userLocation[0]]);
      
      // Create or update user marker
      if (!userMarker.current) {
        // Create a DOM element for the marker
        const el = document.createElement('div');
        el.className = 'user-location-marker';
        el.style.backgroundColor = '#4285F4';
        el.style.width = '15px';
        el.style.height = '15px';
        el.style.borderRadius = '50%';
        el.style.border = '2px solid white';
        el.style.boxShadow = '0 0 0 2px rgba(66, 133, 244, 0.3)';
        
        userMarker.current = new mapboxgl.Marker(el)
          .setLngLat([userLocation[1], userLocation[0]])
          .addTo(map.current);
      } else {
        userMarker.current.setLngLat([userLocation[1], userLocation[0]]);
      }
    }
  }, [userLocation]);

  return (
    <Sheet open={true} onOpenChange={onClose}>
      <SheetContent side="bottom" className="h-[90vh] p-0">
        <NavigationHeader
          onClose={onClose}
          isSpeechEnabled={isSpeechEnabled}
          toggleSpeech={() => setIsSpeechEnabled(!isSpeechEnabled)}
          currentStep={currentStep}
        />

        <div className="h-full">
          <div ref={mapContainer} className="h-full w-full" />
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default NavigationView;
