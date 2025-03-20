export interface LocationUpdate {
  latitude: number;
  longitude: number;
  accuracy: number;
  speed: number;
  bearing: number;
  timestamp: number;
}

export interface LocationError {
  error: string;
}

type LocationListener = (location: LocationUpdate) => void;
type ErrorListener = (error: LocationError) => void;

class LocationService {
  private locationListeners: LocationListener[] = [];
  private errorListeners: ErrorListener[] = [];
  private watchId: number | null = null;
  private isTracking = false;

  async startTracking(): Promise<void> {
    if (this.isTracking) return;

    if (!navigator.geolocation) {
      this.handleError('Geolocation is not supported by this browser');
      return;
    }

    try {
      const options = {
        enableHighAccuracy: true,
        timeout: 5000,
        maximumAge: 0
      };

      this.watchId = navigator.geolocation.watchPosition(
        (position) => {
          const locationUpdate: LocationUpdate = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
            speed: position.coords.speed || 0,
            bearing: position.coords.heading || 0,
            timestamp: position.timestamp
          };
          this.notifyLocationListeners(locationUpdate);
        },
        (error) => {
          this.handleError(this.getGeolocationErrorMessage(error));
        },
        options
      );

      this.isTracking = true;
    } catch (error) {
      this.handleError(`Failed to start tracking: ${error}`);
    }
  }

  async stopTracking(): Promise<void> {
    if (!this.isTracking) return;

    try {
      if (this.watchId !== null) {
        navigator.geolocation.clearWatch(this.watchId);
        this.watchId = null;
      }
      this.isTracking = false;
    } catch (error) {
      this.handleError(`Failed to stop tracking: ${error}`);
    }
  }

  addLocationListener(listener: LocationListener): () => void {
    this.locationListeners.push(listener);
    return () => {
      this.locationListeners = this.locationListeners.filter(l => l !== listener);
    };
  }

  addErrorListener(listener: ErrorListener): () => void {
    this.errorListeners.push(listener);
    return () => {
      this.errorListeners = this.errorListeners.filter(l => l !== listener);
    };
  }

  isLocationTrackingActive(): boolean {
    return this.isTracking;
  }

  private notifyLocationListeners(location: LocationUpdate) {
    this.locationListeners.forEach(listener => listener(location));
  }

  private handleError(message: string) {
    const error: LocationError = { error: message };
    this.errorListeners.forEach(listener => listener(error));
  }

  private getGeolocationErrorMessage(error: GeolocationPositionError): string {
    switch (error.code) {
      case error.PERMISSION_DENIED:
        return 'Location permission denied';
      case error.POSITION_UNAVAILABLE:
        return 'Location information unavailable';
      case error.TIMEOUT:
        return 'Location request timed out';
      default:
        return `Location error: ${error.message}`;
    }
  }
}

export const locationService = new LocationService();
