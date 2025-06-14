'use client';

import { motion } from 'framer-motion';
import { FiActivity, FiZoomIn, FiZoomOut } from 'react-icons/fi';
import { useState, useEffect, useRef } from 'react';
import dynamic from 'next/dynamic';

// Dynamically import DisasterMap to prevent SSR issues
const DisasterMap = dynamic(() => import('../components/DisasterMap'), {
  ssr: false, // Disable server-side rendering
  loading: () => <p className="text-gray-600 text-center">Loading map...</p>,
});

export default function MapsPage() {
  const [disasters, setDisasters] = useState([]);
  const [requests, setRequests] = useState([]);
  const [showDisasters, setShowDisasters] = useState(false);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isMapLoaded, setIsMapLoaded] = useState(false);
  const [userLocation, setUserLocation] = useState(null);
  const [locationError, setLocationError] = useState(null);
  const mapRef = useRef(null); // Reference to the Leaflet map

  // Fetch user's location
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          if (
            isFinite(latitude) &&
            isFinite(longitude) &&
            latitude >= -90 &&
            latitude <= 90 &&
            longitude >= -180 &&
            longitude <= 180
          ) {
            setUserLocation({ latitude, longitude });
          } else {
            setLocationError('Invalid location coordinates obtained.');
          }
        },
        (err) => {
          console.error('Geolocation error:', err);
          setLocationError(
            'Unable to detect your location. Please enable location services or check your browser settings.'
          );
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
    } else {
      setLocationError('Geolocation is not supported by your browser.');
    }
  }, []);

  // Fetch disaster data from NASA EONET API
  useEffect(() => {
    const fetchDisasterData = async () => {
      setIsLoading(true);
      try {
        const response = await fetch('https://eonet.gsfc.nasa.gov/api/v3/events?status=open');
        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }
        const data = await response.json();
        const disasterEvents = (data.events || []).reduce((acc, event) => {
          if (
            !event.geometry ||
            !Array.isArray(event.geometry) ||
            event.geometry.length === 0 ||
            !event.geometry[0].coordinates ||
            !Array.isArray(event.geometry[0].coordinates) ||
            event.geometry[0].coordinates.length !== 2
          ) {
            console.warn('Skipping event with invalid geometry:', event);
            return acc;
          }

          const [longitude, latitude] = event.geometry[0].coordinates;
          const lat = Number(latitude);
          const lon = Number(longitude);

          if (
            !isFinite(lat) ||
            !isFinite(lon) ||
            lat < -90 ||
            lat > 90 ||
            lon < -180 ||
            lon > 180
          ) {
            console.warn('Invalid coordinates in event:', { latitude, longitude, event });
            return acc;
          }

          let severity = 'Low';
          let category = event.categories?.[0]?.title || 'UNKNOWN';
          if (['Severe Storms', 'Floods'].includes(category)) {
            severity = 'High';
          } else if (['Wildfires', 'Volcanoes'].includes(category)) {
            severity = 'Medium';
          }

          let eventDate = 'Unknown';
          if (event.geometry[0].date) {
            try {
              eventDate = new Date(event.geometry[0].date).toLocaleDateString('en-US');
            } catch (dateError) {
              console.warn('Invalid date format in event:', event.geometry[0].date);
              eventDate = 'Unknown';
            }
          }

          acc.push({
            title: event.title || 'Untitled Event',
            latitude: lat,
            longitude: lon,
            severity,
            category,
            date: eventDate,
          });
          return acc;
        }, []);
        setDisasters(disasterEvents);
      } catch (error) {
        console.error('Error fetching disaster data:', error);
        setError(`Failed to fetch disaster data: ${error.message}. Please try again later.`);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDisasterData();
  }, []);

  // Fetch requests from Neon DB API
  useEffect(() => {
    const fetchRequests = async () => {
      try {
        const response = await fetch('/api/requests');
        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }
        const data = await response.json();
        setRequests(data);
      } catch (error) {
        console.error('Error fetching requests:', error);
        setError(`Failed to fetch requests: ${error.message}. Please try again later.`);
      }
    };

    fetchRequests();
  }, []);

  // Zoom in and out handlers
  const handleZoomIn = () => {
    if (mapRef.current) {
      mapRef.current.zoomIn();
    }
  };

  const handleZoomOut = () => {
    if (mapRef.current) {
      mapRef.current.zoomOut();
    }
  };

  return (
    <div className="flex flex-col items-center min-h-screen p-4">
      <motion.div
        className="bg-gradient-to-r from-blue-600 to-teal-600 p-5 rounded-full mb-6"
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.8, type: 'spring' }}
      >
        <FiActivity size={40} className="text-white" />
      </motion.div>
      <h2 className="text-3xl font-bold text-gray-800 mb-4">Local Disaster and Request Map</h2>
      <p className="text-gray-600 max-w-md text-center mb-8">
        Real-time visualization of ongoing disaster events and pending/emergency requests near your location as of 08:17 PM IST on Tuesday, June 03, 2025. Explore the map to see affected areas and requests within 100 km. Use the zoom buttons to adjust the view.
      </p>

      {/* Location Error Message */}
      {locationError && (
        <motion.div
          className="text-yellow-600 mb-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          {locationError} Showing global map instead.
        </motion.div>
      )}

      {/* API Error Message */}
      {error && (
        <motion.div
          className="text-red-500 mb-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          {error}
        </motion.div>
      )}

      {/* Loading State */}
      {(isLoading || !isMapLoaded) && (
        <motion.div
          className="text-gray-600 mb-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          {isLoading ? 'Loading disaster and request data...' : 'Loading map...'}
        </motion.div>
      )}


      {/* Leaflet Map */}
      <motion.div
        className="w-full max-w-4xl h-[500px] mb-8"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        onAnimationComplete={() => setIsMapLoaded(true)}
      >
        <DisasterMap
          disasters={disasters}
          requests={requests}
          showDisasters={showDisasters}
          userLocation={userLocation}
          mapRef={mapRef} // Pass mapRef to DisasterMap
        />
      </motion.div>

      {/* Legend for Severity and Requests */}
      <motion.div
        className="flex justify-center gap-4 mb-8"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7 }}
      >
        <div className="flex items-center">
          <div className="w-4 h-4 bg-red-500 rounded-full mr-2"></div>
          <span className="text-gray-600">High Severity Disaster</span>
        </div>
        <div className="flex items-center">
          <div className="w-4 h-4 bg-yellow-500 rounded-full mr-2"></div>
          <span className="text-gray-600">Medium Severity Disaster</span>
        </div>
        <div className="flex items-center">
          <div className="w-4 h-4 bg-green-500 rounded-full mr-2"></div>
          <span className="text-gray-600">Low Severity Disaster</span>
        </div>
        <div className="flex items-center">
          <div className="w-4 h-4 bg-blue-500 rounded-full mr-2"></div>
          <span className="text-gray-600">Pending/Emergency Request</span>
        </div>
      </motion.div>

      {/* Toggle Button */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.9 }}
      >
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="py-3 px-6 bg-gradient-to-r from-blue-600 to-teal-600 text-white rounded-xl shadow-md"
          onClick={() => setShowDisasters(!showDisasters)}
        >
          {showDisasters ? 'Hide Nearby Disasters and Requests' : 'View Nearby Disasters and Requests'}
        </motion.button>
      </motion.div>
    </div>
  );
}