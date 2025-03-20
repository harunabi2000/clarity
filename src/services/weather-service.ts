interface WeatherData {
  temperature: number;
  condition: string;
  aqi?: number;
  windSpeed: number;
  humidity: number;
  precipitation: number;
}

export async function getWeather(lat: number, lon: number): Promise<WeatherData> {
  // Replace with your preferred weather API
  // Example using OpenWeatherMap API
  const API_KEY = process.env.VITE_OPENWEATHER_API_KEY;
  const response = await fetch(
    `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric`
  );
  
  if (!response.ok) {
    throw new Error('Failed to fetch weather data');
  }

  const data = await response.json();
  
  return {
    temperature: data.main.temp,
    condition: data.weather[0].main,
    windSpeed: data.wind.speed,
    humidity: data.main.humidity,
    precipitation: data.rain?.['1h'] || 0,
  };
}

export function shouldAdjustRoute(weather: WeatherData): boolean {
  // Adjust route if:
  // - Temperature is above 30°C or below 0°C
  // - Heavy rain (precipitation > 5mm/h)
  // - Strong winds (> 30km/h)
  return (
    weather.temperature > 30 ||
    weather.temperature < 0 ||
    weather.precipitation > 5 ||
    weather.windSpeed > 8.33 // 30km/h in m/s
  );
}

export function getRouteAdjustmentFactor(weather: WeatherData): number {
  // Return a factor between 0.5 and 1 to adjust route length
  // based on weather conditions
  let factor = 1;

  if (weather.temperature > 30) {
    factor *= 0.7;
  }
  if (weather.temperature < 0) {
    factor *= 0.8;
  }
  if (weather.precipitation > 5) {
    factor *= 0.6;
  }
  if (weather.windSpeed > 8.33) {
    factor *= 0.8;
  }

  return Math.max(0.5, factor);
}
