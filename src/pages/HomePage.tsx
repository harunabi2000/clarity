import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';

export function HomePage() {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-[#f5f5f5] text-center">
      <h1 className="text-5xl font-bold text-[#2c3e50] mb-3">
        Clarity
      </h1>
      <p className="text-xl text-[#7f8c8d] mb-10">
        Find your peaceful path
      </p>
      
      <div className="flex flex-col gap-4 w-full max-w-md">
        <Button
          onClick={() => navigate('/map')}
          className="w-full py-6 text-lg bg-[#3498db] hover:bg-[#2980b9] transition-colors duration-200"
        >
          Generate Route
        </Button>
        
        <Button
          variant="outline"
          onClick={() => {}} // Settings functionality can be added later
          className="w-full py-6 text-lg border-[#3498db] text-[#3498db] hover:bg-[#3498db] hover:text-white transition-colors duration-200"
        >
          Settings
        </Button>
      </div>
    </div>
  );
}
