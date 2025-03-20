import React from 'react';
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import { MapPage } from './pages/MapPage';
import { ThemeProvider } from '@/components/ThemeProvider';
import { ThemeToggle } from '@/components/ThemeToggle';
import { InstallPWA } from '@/components/InstallPWA';
import './App.css';

function App() {
  return (
    <ThemeProvider>
      <TooltipProvider>
        <div className="min-h-screen bg-background text-foreground transition-colors duration-300">
          <ThemeToggle />
          <Toaster />
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/map" element={<MapPage />} />
            </Routes>
          </BrowserRouter>
          <InstallPWA />
        </div>
      </TooltipProvider>
    </ThemeProvider>
  );
}

export default App;