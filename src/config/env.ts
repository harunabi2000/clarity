export const config = {
  mapbox: {
    accessToken: import.meta.env.VITE_MAPBOX_ACCESS_TOKEN || '',
  },
  openWeather: {
    apiKey: import.meta.env.VITE_OPENWEATHER_API_KEY || '',
  }
} as const;
