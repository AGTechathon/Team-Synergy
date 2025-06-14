'use client';
import L from 'leaflet';
import { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Circle, Popup, useMap, Marker, Tooltip } from 'react-leaflet';

// Haversine formula to calculate distance between two points (in kilometers)
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth's radius in kilometers
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c; // Distance in kilometers
  return distance;
}

// Component to handle map centering and zooming
function MapController({ center, zoom }) {
  const map = useMap();
  useEffect(() => {
    if (map && center && zoom && Array.isArray(center) && center.length === 2) {
      const [lat, lon] = center;
      if (
        typeof lat === 'number' &&
        typeof lon === 'number' &&
        isFinite(lat) &&
        isFinite(lon) &&
        lat >= -90 &&
        lat <= 90 &&
        lon >= -180 &&
        lon <= 180
      ) {
        try {
          map.setView([lat, lon], zoom);
          map.invalidateSize(); // Ensure map renders correctly after view change
        } catch (error) {
          console.error('Error setting map view:', error);
        }
      }
    }
  }, [center, zoom, map]);
  return null;
}

export default function DisasterMap({ disasters, requests, showDisasters, userLocation, mapRef }) {
  const [selectedDisaster, setSelectedDisaster] = useState(null);
  const radiusKm = 100; // Radius in kilometers to filter disasters and requests

  // Filter disasters within the specified radius of the user's location
  const nearbyDisasters = userLocation
    ? disasters.filter((disaster) => {
      if (
        typeof disaster.latitude !== 'number' ||
        typeof disaster.longitude !== 'number' ||
        !isFinite(disaster.latitude) ||
        !isFinite(disaster.longitude)
      ) {
        return false;
      }
      const distance = calculateDistance(
        userLocation.latitude,
        userLocation.longitude,
        disaster.latitude,
        disaster.longitude
      );
      return distance <= radiusKm;
    })
    : disasters;

  // Filter requests within the specified radius of the user's location
  const nearbyRequests = userLocation
    ? requests.filter((request) => {
      if (
        typeof request.latitude !== 'number' ||
        typeof request.longitude !== 'number' ||
        !isFinite(request.latitude) ||
        !isFinite(request.longitude)
      ) {
        return false;
      }
      const distance = calculateDistance(
        userLocation.latitude,
        userLocation.longitude,
        request.latitude,
        request.longitude
      );
      return distance <= radiusKm;
    })
    : requests;

  // Set initial map center based on user's location
  const initialCenter = userLocation
    ? [userLocation.latitude, userLocation.longitude]
    : [0, 0];
  const initialZoom = 10; // For ~100km view

  const handleDisasterClick = (disaster) => {
    if (
      typeof disaster.latitude === 'number' &&
      typeof disaster.longitude === 'number' &&
      isFinite(disaster.latitude) &&
      isFinite(disaster.longitude) &&
      disaster.latitude >= -90 &&
      disaster.latitude <= 90 &&
      disaster.longitude >= -180 &&
      disaster.longitude <= 180
    ) {
      setSelectedDisaster({ center: [disaster.latitude, disaster.longitude], zoom: 12 });
    } else {
      console.warn('Invalid coordinates for disaster:', disaster);
    }
  };

  const handleRequestClick = (request) => {
    if (
      typeof request.latitude === 'number' &&
      typeof request.longitude === 'number' &&
      isFinite(request.latitude) &&
      isFinite(request.longitude) &&
      request.latitude >= -90 &&
      request.latitude <= 90 &&
      request.longitude >= -180 &&
      request.longitude <= 180
    ) {
      setSelectedDisaster({ center: [request.latitude, request.longitude], zoom: 12 });
    } else {
      console.warn('Invalid coordinates for request:', request);
    }
  };

  return (
    <MapContainer
      center={initialCenter}
      zoom={initialZoom}
      minZoom={3} // Allow zooming out to see larger areas
      maxZoom={18} // Keep max zoom for detailed view
      maxBounds={null} // Remove maxBounds to allow free panning
      style={{ height: '100%', width: '100%' }}
      className="rounded-xl shadow-md"
      whenCreated={(map) => {
        mapRef.current = map; // Assign map instance to mapRef
        map.invalidateSize();
      }}
    >
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      />

      {/* Map Controller for Centering and Zooming */}
      {selectedDisaster ? (
        <MapController center={selectedDisaster.center} zoom={selectedDisaster.zoom} />
      ) : (
        <MapController center={initialCenter} zoom={initialZoom} />
      )}

      {/* User's Location Marker */}
      {userLocation && (
        <Marker position={[userLocation.latitude, userLocation.longitude]}>
          <Tooltip permanent>
            Your Location
          </Tooltip>
        </Marker>
      )}

      {/* Disaster Areas */}
      {showDisasters &&
        nearbyDisasters.map((disaster, index) => {
          if (
            typeof disaster.latitude !== 'number' ||
            typeof disaster.longitude !== 'number' ||
            !isFinite(disaster.latitude) ||
            !isFinite(disaster.longitude) ||
            disaster.latitude < -90 ||
            disaster.latitude > 90 ||
            disaster.longitude < -180 ||
            disaster.longitude > 180
          ) {
            console.warn('Skipping disaster with invalid coordinates:', disaster);
            return null;
          }

          const color =
            disaster.severity === 'High'
              ? 'red'
              : disaster.severity === 'Medium'
                ? 'yellow'
                : 'green';
          const radius =
            disaster.severity === 'High'
              ? 50000 // 50 km
              : disaster.severity === 'Medium'
                ? 30000 // 30 km
                : 10000; // 10 km

          return (
            <Circle
              key={`disaster-${index}`}
              center={[disaster.latitude, disaster.longitude]}
              radius={radius}
              pathOptions={{
                color: color,
                fillColor: color,
                fillOpacity: 0.5,
                opacity: 0.8,
              }}
              eventHandlers={{
                click: () => handleDisasterClick(disaster),
              }}
            >
              <Popup>
                <div className="text-center">
                  <h3 className="font-semibold">{disaster.title || 'Untitled Event'}</h3>
                  <p>Category: {disaster.category || 'N/A'}</p>
                  <p>Severity: {disaster.severity || 'N/A'}</p>
                  <p>
                    Location:{' '}
                    {typeof disaster.latitude === 'number' && isFinite(disaster.latitude)
                      ? disaster.latitude.toFixed(2) + '°N'
                      : 'N/A'}
                    ,{' '}
                    {typeof disaster.longitude === 'number' && isFinite(disaster.longitude)
                      ? disaster.longitude.toFixed(2) + '°E'
                      : 'N/A'}
                  </p>
                  <p>Date: {disaster.date || 'N/A'}</p>
                </div>
              </Popup>
            </Circle>
          );
        })}

      {/* Request Markers */}
      {showDisasters &&
        nearbyRequests.map((request, index) => {
          if (
            typeof request.latitude !== 'number' ||
            typeof request.longitude !== 'number' ||
            !isFinite(request.latitude) ||
            !isFinite(request.longitude) ||
            request.latitude < -90 ||
            request.latitude > 90 ||
            request.longitude < -180 ||
            request.longitude > 180
          ) {
            console.warn('Skipping request with invalid coordinates:', request);
            return null;
          }

          return (
            <Marker
              key={`request-${index}`}
              position={[request.latitude, request.longitude]}
              eventHandlers={{
                click: () => handleRequestClick(request),
              }}
            >
              <Popup>
                <div className="text-center">
                  <h3 className="font-semibold">{request.name || 'Unnamed Request'}</h3>
                  <p>Type: {request.type || 'N/A'}</p>
                  <p>Urgency: {request.urgency || 'N/A'}</p>
                  <p>Status: {request.status || 'N/A'}</p>
                  <p>Contact: {request.contact || 'N/A'}</p>
                  <p>Description: {request.description || 'N/A'}</p>
                  <p>
                    Location:{' '}
                    {typeof request.latitude === 'number' && isFinite(request.latitude)
                      ? request.latitude.toFixed(2) + '°N'
                      : 'N/A'}
                    ,{' '}
                    {typeof request.longitude === 'number' && isFinite(request.longitude)
                      ? request.longitude.toFixed(2) + '°E'
                      : 'N/A'}
                  </p>
                  <p>Date: {new Date(request.created_at).toLocaleDateString('en-US') || 'N/A'}</p>
                </div>
              </Popup>
            </Marker>
          );
        })}
    </MapContainer>
  );
}