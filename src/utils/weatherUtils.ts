import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { config } from '@/config/env';

interface WeatherData {
  temperature: number;
  feelsLike: number;
  description: string;
  windSpeed: number;
  icon: string;
}

interface WeatherState {
  weather: WeatherData | null;
  error: string | null;
  fetchWeather: (coords: [number, number]) => Promise<void>;
}

export const useWeatherStore = create<WeatherState>()(
  devtools(
    (set) => ({
      weather: null,
      error: null,
      fetchWeather: async (coords: [number, number]) => {
        try {
          const [lon, lat] = coords;
          const response = await fetch(
            `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${config.openWeather.apiKey}&units=metric`
          );

          if (!response.ok) {
            throw new Error('Failed to fetch weather data');
          }

          const data = await response.json();

          set({
            weather: {
              temperature: Math.round(data.main.temp),
              feelsLike: Math.round(data.main.feels_like),
              description: data.weather[0].description,
              windSpeed: Math.round(data.wind.speed * 3.6), // Convert m/s to km/h
              icon: data.weather[0].icon,
            },
            error: null,
          });
        } catch (error) {
          set({ error: 'Failed to fetch weather data' });
        }
      },
    }),
    { name: 'weather-store' }
  )
);
