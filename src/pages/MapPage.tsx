import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Navigation } from '@/components/Navigation';
import { Button } from '@/components/ui/button';
import { ChevronLeft } from 'lucide-react';

export function MapPage() {
  const navigate = useNavigate();
  const [isNavigating, setIsNavigating] = useState(false);

  return (
    <div className="relative h-screen bg-[#f5f5f5]">
      <div className="absolute top-4 left-4 z-10">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate('/')}
          className="bg-white/80 backdrop-blur-sm hover:bg-white/90"
        >
          <ChevronLeft className="h-6 w-6" />
        </Button>
      </div>

      <Navigation />
    </div>
  );
}
