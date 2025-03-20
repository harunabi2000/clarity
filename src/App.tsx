import React from 'react';
import { MapPage } from './pages/MapPage';
import { ThemeProvider } from '@/components/ThemeProvider';
import { Toaster } from '@/components/ui/toaster';
import './App.css';

function App() {
  return (
    <ThemeProvider>
      <MapPage />
      <Toaster />
    </ThemeProvider>
  );
}

export default App;