import { useState, useCallback, useEffect } from 'react';
import { config } from '@/config/env';
import { Location } from '@/components/LocationSearch';

const STORAGE_KEY = 'saved_locations';

export function useLocationSearch() {
  const [suggestions, setSuggestions] = useState<Location[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedLocations, setSavedLocations] = useState<Location[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Load saved locations from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        setSavedLocations(JSON.parse(saved));
      }
    } catch (err) {
      console.error('Error loading saved locations:', err);
    }
  }, []);

  // Save locations to localStorage whenever they change
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(savedLocations));
    } catch (err) {
      console.error('Error saving locations:', err);
    }
  }, [savedLocations]);

  const search = useCallback(
    async (query: string, proximity?: [number, number]) => {
      if (!query) {
        setSuggestions([]);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        // Build the geocoding API URL with query and optional proximity
        let url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(
          query
        )}.json?access_token=${config.mapbox.accessToken}&types=address,place,poi`;

        if (proximity) {
          url += `&proximity=${proximity[0]},${proximity[1]}`;
        }

        const response = await fetch(url);
        if (!response.ok) {
          throw new Error('Failed to fetch location suggestions');
        }

        const data = await response.json();
        setSuggestions(
          data.features.map((feature: any) => ({
            id: feature.id,
            place_name: feature.place_name,
            coordinates: feature.center,
          }))
        );
      } catch (err) {
        console.error('Error searching locations:', err);
        setError(
          err instanceof Error ? err.message : 'Error searching for locations'
        );
        setSuggestions([]);
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  const saveLocation = useCallback((location: Location) => {
    setSavedLocations((prev) => {
      // Don't add if already exists
      if (prev.some((loc) => loc.id === location.id)) {
        return prev;
      }
      return [...prev, location];
    });
  }, []);

  const removeLocation = useCallback((locationId: string) => {
    setSavedLocations((prev) =>
      prev.filter((location) => location.id !== locationId)
    );
  }, []);

  return {
    suggestions,
    isLoading,
    error,
    search,
    savedLocations,
    saveLocation,
    removeLocation,
  };
}
