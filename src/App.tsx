import React from 'react';
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ThemeProvider } from '@/components/ThemeProvider';
import { ThemeToggle } from '@/components/ThemeToggle';
import { InstallPWA } from '@/components/InstallPWA';
import { HomePage } from '@/pages/HomePage';
import { MapPage } from '@/pages/MapPage';
import 'mapbox-gl/dist/mapbox-gl.css';
import './App.css';

function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <TooltipProvider>
          <div className="min-h-screen bg-[#f5f5f5] dark:bg-gray-900">
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/map" element={<MapPage />} />
              <Route path="*" element={<Navigate to="/" />} />
            </Routes>
            <Toaster />
            <div className="fixed bottom-4 right-4 flex gap-2">
              <ThemeToggle />
              <InstallPWA />
            </div>
          </div>
        </TooltipProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}

export default App;