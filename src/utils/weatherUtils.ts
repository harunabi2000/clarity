import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { config } from '@/config/env';

export interface WeatherData {
  temperature: number;
  description: string;
  icon: string;
  humidity: number;
  windSpeed: number;
  feelsLike: number;
}

interface WeatherState {
  data: WeatherData | null;
  error: string | null;
  isLoading: boolean;
  lastUpdated: number | null;
  updateWeather: (coords: [number, number]) => Promise<void>;
}

// Cache weather data for 10 minutes
const CACHE_DURATION = 10 * 60 * 1000;

export const useWeatherStore = create<WeatherState>()(
  devtools(
    (set, get) => ({
      data: null,
      error: null,
      isLoading: false,
      lastUpdated: null,

      updateWeather: async (coords: [number, number]) => {
        const state = get();
        
        // Check if we have recent data
        if (
          state.data &&
          state.lastUpdated &&
          Date.now() - state.lastUpdated < CACHE_DURATION
        ) {
          return;
        }

        set({ isLoading: true });

        try {
          const response = await fetch(
            `https://api.openweathermap.org/data/2.5/weather?lat=${coords[1]}&lon=${coords[0]}&appid=${config.openWeather.apiKey}&units=metric`
          );

          if (!response.ok) {
            throw new Error('Failed to fetch weather data');
          }

          const data = await response.json();

          set({
            data: {
              temperature: Math.round(data.main.temp),
              description: data.weather[0].description,
              icon: data.weather[0].icon,
              humidity: data.main.humidity,
              windSpeed: Math.round(data.wind.speed * 3.6), // Convert m/s to km/h
              feelsLike: Math.round(data.main.feels_like),
            },
            error: null,
            isLoading: false,
            lastUpdated: Date.now(),
          });
        } catch (error) {
          console.error('Weather fetch error:', error);
          set({
            error: 'Failed to update weather data',
            isLoading: false,
          });
        }
      },
    }),
    { name: 'weather-store' }
  )
);
