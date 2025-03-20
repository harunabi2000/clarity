import React, { useState } from 'react';
import { Navigation } from '@/components/Navigation';
import { Button } from '@/components/ui/button';
import { useLocationStore } from '@/stores/locationStore';

export function MapPage() {
  const [isNavigating, setIsNavigating] = useState(false);
  const { startTracking } = useLocationStore();

  // Start location tracking when component mounts
  React.useEffect(() => {
    startTracking();
  }, [startTracking]);

  if (isNavigating) {
    return (
      <Navigation
        onBack={() => setIsNavigating(false)}
      />
    );
  }

  return (
    <div className="h-screen relative">
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 z-10 bg-purple-600 text-white p-4 shadow-lg">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-semibold">Mindful Loop Generator</h1>
            <p className="text-sm opacity-80">
              Generate mindful walking routes
            </p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="h-full flex items-center justify-center p-4">
        <div className="max-w-md w-full space-y-4">
          <Button
            size="lg"
            className="w-full text-lg py-8"
            onClick={() => setIsNavigating(true)}
          >
            Start Navigation
          </Button>
        </div>
      </div>
    </div>
  );
}
