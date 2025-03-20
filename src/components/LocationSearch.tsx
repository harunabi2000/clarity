import React, { useState, useEffect, useRef } from 'react';
import { Check, MapPin, Plus, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { useDebouncedCallback } from 'use-debounce';
import { useLocationStore } from '@/stores/locationStore';
import { cn } from '@/lib/utils';
import { useLocationSearch } from '@/hooks/useLocationSearch';

export interface Location {
  id: string;
  name: string;
  place_name: string;
  coordinates: [number, number];
}

interface LocationSearchProps {
  onLocationSelect: (location: Location) => void;
  placeholder?: string;
  initialValue?: string;
  className?: string;
}

export function LocationSearch({
  onLocationSelect,
  placeholder = 'Search for a location',
  initialValue = '',
  className,
}: LocationSearchProps) {
  const [query, setQuery] = useState(initialValue);
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const { coords: currentLocation } = useLocationStore();
  const {
    suggestions,
    isLoading,
    error,
    search,
    savedLocations,
    saveLocation,
    removeLocation,
  } = useLocationSearch();

  const debouncedSearch = useDebouncedCallback((value: string) => {
    if (value.length >= 2) {
      search(value, currentLocation);
      setIsOpen(true);
    } else {
      setIsOpen(false);
    }
  }, 300);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);
    debouncedSearch(value);
  };

  const handleLocationSelect = (location: Location) => {
    setQuery(location.place_name);
    setIsOpen(false);
    onLocationSelect(location);
  };

  return (
    <div ref={containerRef} className={cn('relative w-full', className)}>
      <div className="flex items-center gap-2">
        <MapPin className="h-5 w-5 text-purple-500 shrink-0" />
        <Input
          ref={inputRef}
          type="text"
          value={query}
          onChange={handleInputChange}
          onFocus={() => query.length >= 2 && setIsOpen(true)}
          placeholder={placeholder}
          className="flex-1"
        />
      </div>

      {isOpen && (
        <Card className="absolute left-0 right-0 top-full mt-1 z-50 max-h-[300px] overflow-y-auto shadow-lg">
          <div className="p-2 space-y-2">
            {/* Saved Locations */}
            {savedLocations.length > 0 && (
              <div className="space-y-1">
                <h3 className="text-sm font-medium text-muted-foreground px-2">
                  Saved Places
                </h3>
                {savedLocations.map((location) => (
                  <Button
                    key={location.id}
                    variant="ghost"
                    className="w-full justify-start gap-2 h-auto py-2"
                    onClick={() => handleLocationSelect(location)}
                  >
                    <Star className="h-4 w-4 text-yellow-500 shrink-0" />
                    <div className="text-left">
                      <div className="font-medium">{location.name}</div>
                      <div className="text-sm text-muted-foreground truncate">
                        {location.place_name}
                      </div>
                    </div>
                  </Button>
                ))}
                <div className="border-t my-2" />
              </div>
            )}

            {/* Search Results */}
            {isLoading ? (
              <div className="px-2 py-3 text-sm text-muted-foreground">
                Searching...
              </div>
            ) : error ? (
              <div className="px-2 py-3 text-sm text-red-500">{error}</div>
            ) : suggestions.length === 0 ? (
              <div className="px-2 py-3 text-sm text-muted-foreground">
                No results found
              </div>
            ) : (
              suggestions.map((suggestion) => (
                <div
                  key={suggestion.id}
                  className="flex items-center gap-2 px-2"
                >
                  <Button
                    variant="ghost"
                    className="flex-1 justify-start gap-2 h-auto py-2"
                    onClick={() => handleLocationSelect(suggestion)}
                  >
                    <MapPin className="h-4 w-4 text-purple-500 shrink-0" />
                    <span className="text-left truncate">
                      {suggestion.place_name}
                    </span>
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="shrink-0"
                    onClick={() => {
                      const name = prompt(
                        'Enter a name for this location (e.g., Home, Work, Gym)'
                      );
                      if (name) {
                        saveLocation({
                          ...suggestion,
                          name,
                        });
                      }
                    }}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              ))
            )}
          </div>
        </Card>
      )}
    </div>
  );
}
