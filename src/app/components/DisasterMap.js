'use client';
import React from 'react';
import L from 'leaflet';
import { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Circle, Popup, useMap, Marker, Tooltip } from 'react-leaflet';

// Fix for default markers in Leaflet with Next.js
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

// Create custom icons for different types of markers
const createCustomIcon = (color = 'green', size = 'medium') => {
  const sizeConfig = {
    small: [20, 32],
    medium: [25, 41],
    large: [30, 49]
  };
  
  return L.divIcon({
    className: 'custom-div-icon',
    html: `
      <div style="
        background-color: ${color};
        width: ${sizeConfig[size][0]}px;
        height: ${sizeConfig[size][1]}px;
        border-radius: 50% 50% 50% 0;
        border: 3px solid white;
        box-shadow: 0 2px 8px rgba(0,0,0,0.3);
        transform: rotate(-45deg);
        display: flex;
        align-items: center;
        justify-content: center;
      ">
        <div style="
          color: white;
          font-weight: bold;
          font-size: 12px;
          transform: rotate(45deg);
        ">!</div>
      </div>
    `,
    iconSize: sizeConfig[size],
    iconAnchor: [sizeConfig[size][0] / 2, sizeConfig[size][1]],
    popupAnchor: [0, -sizeConfig[size][1]]
  });
};

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

// Legend component for the map
function MapLegend() {
  return (
    <div className="absolute bottom-4 left-4 bg-white/90 backdrop-blur-sm rounded-lg shadow-lg p-4 z-1000 max-w-xs">
      <h4 className="font-semibold text-sm mb-3 text-gray-800">Map Legend</h4>
      <div className="space-y-2 text-xs">
        <div className="flex items-center">
          <div className="w-4 h-4 bg-green-500 rounded-full mr-2 border border-white shadow-sm"></div>
          <span>Your Location</span>
        </div>
        <div className="flex items-center">
          <div className="w-4 h-4 bg-red-500 rounded-full mr-2 border border-white shadow-sm"></div>
          <span>High/Critical Urgency Request</span>
        </div>
        <div className="flex items-center">
          <div className="w-4 h-4 bg-yellow-500 rounded-full mr-2 border border-white shadow-sm"></div>
          <span>Medium Urgency Request</span>
        </div>
        <div className="flex items-center">
          <div className="w-4 h-4 bg-green-500 rounded-full mr-2 border border-white shadow-sm"></div>
          <span>Low Urgency Request</span>
        </div>
        <div className="flex items-center">
          <div className="w-4 h-4 bg-red-500 rounded-full opacity-50 mr-2 border border-white shadow-sm"></div>
          <span>High Severity Disaster Zone</span>
        </div>
        <div className="flex items-center">
          <div className="w-4 h-4 bg-yellow-500 rounded-full opacity-50 mr-2 border border-white shadow-sm"></div>
          <span>Medium Severity Disaster Zone</span>
        </div>
        <div className="flex items-center">
          <div className="w-4 h-4 bg-green-500 rounded-full opacity-50 mr-2 border border-white shadow-sm"></div>
          <span>Low Severity Disaster Zone</span>
        </div>
      </div>
    </div>
  );
}

export default function DisasterMap({ disasters, requests, showDisasters, userLocation, mapRef }) {
  const [selectedDisaster, setSelectedDisaster] = useState(null);
  const [mapError, setMapError] = useState(null);
  const radiusKm = 100; // Radius in kilometers to filter disasters and requests

  // Ensure disasters and requests are arrays
  const safeDisasters = Array.isArray(disasters) ? disasters : [];
  const safeRequests = Array.isArray(requests) ? requests : [];

  // Memoize filtered data to avoid unnecessary recalculations
  const nearbyDisasters = React.useMemo(() => {
    if (!userLocation) return safeDisasters;
    
    return safeDisasters.filter((disaster) => {
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
    });
  }, [userLocation, safeDisasters, radiusKm]);

  // Memoize filtered requests
  const nearbyRequests = React.useMemo(() => {
    if (!userLocation) return safeRequests;
    
    return safeRequests.filter((request) => {
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
    });
  }, [userLocation, safeRequests, radiusKm]);

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
  };  return (
    <div className="relative w-full h-full">
      {mapError && (
        <div className="absolute top-4 left-4 bg-red-100 border border-red-400 text-red-700 px-4 py-2 rounded z-1000">
          Map Error: {mapError}
        </div>
      )}
      
      <MapContainer
        center={initialCenter}
        zoom={initialZoom}
        minZoom={3} // Allow zooming out to see larger areas
        maxZoom={18} // Keep max zoom for detailed view
        maxBounds={null} // Remove maxBounds to allow free panning
        style={{ height: '100%', width: '100%' }}
        className="rounded-xl shadow-md"
        whenCreated={(map) => {
          try {
            mapRef.current = map; // Assign map instance to mapRef
            map.invalidateSize();
            setMapError(null);
          } catch (error) {
            console.error('Map creation error:', error);
            setMapError(error.message);
          }
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
      )}      {/* User's Location Marker */}
      {userLocation && (
        <Marker 
          position={[userLocation.latitude, userLocation.longitude]}
          icon={createCustomIcon('#10B981', 'medium')}
        >
          <Tooltip permanent>
            📍 Your Location
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
          }          const iconColor = 
            request.urgency === 'High' || request.urgency === 'Critical'
              ? '#EF4444' // Red for high/critical urgency
              : request.urgency === 'Medium'
                ? '#F59E0B' // Orange for medium urgency
                : '#10B981'; // Green for low urgency

          return (
            <Marker
              key={`request-${index}`}
              position={[request.latitude, request.longitude]}
              icon={createCustomIcon(iconColor, 'medium')}
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
                  <p>Date: {
                    request.created_at 
                      ? new Date(request.created_at).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })
                      : 'N/A'
                  }</p>
                </div>
              </Popup>            </Marker>
          );
        })}
    </MapContainer>
    
    {/* Map Legend */}
    <MapLegend />
    </div>
  );
}