export const config = {
  mapbox: {
    accessToken: process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN || '',
  },
  openWeather: {
    apiKey: process.env.NEXT_PUBLIC_OPENWEATHER_API_KEY || '',
  }
} as const;
