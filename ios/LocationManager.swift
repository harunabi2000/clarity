import Foundation
import CoreLocation
import MapKit

@objc(LocationManager)
class LocationManager: RCTEventEmitter, CLLocationManagerDelegate {
    private var locationManager: CLLocationManager?
    private var isTracking = false
    
    override static func requiresMainQueueSetup() -> Bool {
        return true
    }
    
    override func supportedEvents() -> [String] {
        return ["onLocationUpdate", "onLocationError"]
    }
    
    @objc
    func startTracking(_ resolve: @escaping RCTPromiseResolveBlock, rejecter reject: @escaping RCTPromiseRejectBlock) {
        if isTracking {
            reject("ALREADY_TRACKING", "Location tracking is already active", nil)
            return
        }
        
        DispatchQueue.main.async { [weak self] in
            self?.initializeLocationManager()
            resolve(nil)
        }
    }
    
    @objc
    func stopTracking(_ resolve: @escaping RCTPromiseResolveBlock, rejecter reject: @escaping RCTPromiseRejectBlock) {
        DispatchQueue.main.async { [weak self] in
            self?.locationManager?.stopUpdatingLocation()
            self?.isTracking = false
            resolve(nil)
        }
    }
    
    private func initializeLocationManager() {
        if locationManager == nil {
            locationManager = CLLocationManager()
            locationManager?.delegate = self
            locationManager?.desiredAccuracy = kCLLocationAccuracyBestForNavigation
            locationManager?.distanceFilter = 5 // Update every 5 meters
            locationManager?.allowsBackgroundLocationUpdates = true
            locationManager?.pausesLocationUpdatesAutomatically = false
            locationManager?.activityType = .automotiveNavigation
        }
        
        let authStatus = CLLocationManager.authorizationStatus()
        switch authStatus {
        case .notDetermined:
            locationManager?.requestAlwaysAuthorization()
        case .authorizedWhenInUse, .authorizedAlways:
            startLocationUpdates()
        default:
            sendEvent(withName: "onLocationError", body: ["error": "Location permission denied"])
        }
    }
    
    private func startLocationUpdates() {
        locationManager?.startUpdatingLocation()
        isTracking = true
    }
    
    // MARK: - CLLocationManagerDelegate
    
    func locationManager(_ manager: CLLocationManager, didUpdateLocations locations: [CLLocation]) {
        guard let location = locations.last else { return }
        
        let locationData: [String: Any] = [
            "latitude": location.coordinate.latitude,
            "longitude": location.coordinate.longitude,
            "accuracy": location.horizontalAccuracy,
            "speed": location.speed,
            "bearing": location.course,
            "timestamp": location.timestamp.timeIntervalSince1970 * 1000
        ]
        
        sendEvent(withName: "onLocationUpdate", body: locationData)
    }
    
    func locationManager(_ manager: CLLocationManager, didFailWithError error: Error) {
        sendEvent(withName: "onLocationError", body: ["error": error.localizedDescription])
    }
    
    func locationManager(_ manager: CLLocationManager, didChangeAuthorization status: CLAuthorizationStatus) {
        switch status {
        case .authorizedWhenInUuse, .authorizedAlways:
            startLocationUpdates()
        default:
            sendEvent(withName: "onLocationError", body: ["error": "Location permission changed"])
        }
    }
}
