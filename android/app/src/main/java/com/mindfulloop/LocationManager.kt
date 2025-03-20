package com.mindfulloop

import android.Manifest
import android.content.Context
import android.content.pm.PackageManager
import android.location.Location
import android.os.Looper
import androidx.core.app.ActivityCompat
import com.google.android.gms.location.*
import com.facebook.react.bridge.*
import com.facebook.react.modules.core.DeviceEventManagerModule

class LocationManager(reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {
    private var fusedLocationClient: FusedLocationProviderClient? = null
    private var locationCallback: LocationCallback? = null
    private var isTracking = false

    companion object {
        private const val UPDATE_INTERVAL = 1000L // 1 second
        private const val FASTEST_INTERVAL = 500L // 0.5 seconds
        private const val LOCATION_UPDATE_EVENT = "onLocationUpdate"
        private const val LOCATION_ERROR_EVENT = "onLocationError"
    }

    init {
        fusedLocationClient = LocationServices.getFusedLocationProviderClient(reactContext)
    }

    override fun getName(): String = "LocationManager"

    @ReactMethod
    fun startTracking(promise: Promise) {
        if (isTracking) {
            promise.reject("ALREADY_TRACKING", "Location tracking is already active")
            return
        }

        if (!hasLocationPermission()) {
            promise.reject("PERMISSION_DENIED", "Location permission not granted")
            return
        }

        try {
            val locationRequest = LocationRequest.create().apply {
                priority = LocationRequest.PRIORITY_HIGH_ACCURACY
                interval = UPDATE_INTERVAL
                fastestInterval = FASTEST_INTERVAL
            }

            locationCallback = object : LocationCallback() {
                override fun onLocationResult(locationResult: LocationResult) {
                    locationResult.lastLocation?.let { location ->
                        sendLocationUpdate(location)
                    }
                }

                override fun onLocationAvailability(availability: LocationAvailability) {
                    if (!availability.isLocationAvailable) {
                        sendEvent(LOCATION_ERROR_EVENT, "Location services unavailable")
                    }
                }
            }

            fusedLocationClient?.requestLocationUpdates(
                locationRequest,
                locationCallback!!,
                Looper.getMainLooper()
            )

            isTracking = true
            promise.resolve(null)
        } catch (e: Exception) {
            promise.reject("TRACKING_ERROR", e.message)
        }
    }

    @ReactMethod
    fun stopTracking(promise: Promise) {
        try {
            locationCallback?.let {
                fusedLocationClient?.removeLocationUpdates(it)
                locationCallback = null
                isTracking = false
            }
            promise.resolve(null)
        } catch (e: Exception) {
            promise.reject("STOP_ERROR", e.message)
        }
    }

    private fun sendLocationUpdate(location: Location) {
        val params = Arguments.createMap().apply {
            putDouble("latitude", location.latitude)
            putDouble("longitude", location.longitude)
            putDouble("accuracy", location.accuracy.toDouble())
            putDouble("speed", location.speed.toDouble())
            putDouble("bearing", location.bearing.toDouble())
            putDouble("timestamp", location.time.toDouble())
        }
        sendEvent(LOCATION_UPDATE_EVENT, params)
    }

    private fun sendEvent(eventName: String, params: Any?) {
        reactApplicationContext
            .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
            .emit(eventName, params)
    }

    private fun hasLocationPermission(): Boolean {
        return ActivityCompat.checkSelfPermission(
            reactApplicationContext,
            Manifest.permission.ACCESS_FINE_LOCATION
        ) == PackageManager.PERMISSION_GRANTED
    }
}
