'use client';

import { motion } from 'framer-motion';
import { useState, useEffect, createContext, useContext } from 'react';
import { useRouter } from 'next/navigation';
import { FiUser, FiPhone, FiHelpCircle, FiAlertTriangle, FiMessageSquare, FiMapPin, FiArrowRight, FiCrosshair, FiHome, FiMap, FiAlertCircle, FiMessageCircle, FiActivity, FiX, FiImage, FiSend } from 'react-icons/fi';
import MapsPage from '../maps/page';
import LiveChatPage from '../chat/page';
import AIChatPage from '../ai/page';

// Create a Location Context
const LocationContext = createContext({
  location: { latitude: null, longitude: null },
  setLocation: () => {},
});

export default function App() {
  const [activePage, setActivePage] = useState('request');
  const [isNavOpen, setIsNavOpen] = useState(false);
  const [location, setLocation] = useState({ latitude: null, longitude: null });

  // Earth animation state
  const [rotation, setRotation] = useState(0);
  const [cloudPosition, setCloudPosition] = useState(0);

  // Animate Earth
  useEffect(() => {
    let animationFrameId;
    let lastTime = 0;

    const animate = (time) => {
      if (lastTime) {
        const delta = time - lastTime;
        setRotation((prev) => (prev + 0.2 * (delta / 16)) % 360);
        setCloudPosition((prev) => (prev + 0.5 * (delta / 16)) % 100);
      }
      lastTime = time;
      animationFrameId = requestAnimationFrame(animate);
    };

    if (activePage === 'maps') {
      animationFrameId = requestAnimationFrame(animate);
    }

    return () => {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
    };
  }, [activePage]);

  // Navigation items
  const navItems = [
    { id: 'request', icon: <FiHome size={20} />, label: 'Request' },
    { id: 'maps', icon: <FiMap size={20} />, label: 'Maps' },
    { id: 'alert', icon: <FiAlertCircle size={20} />, label: 'Alert' },
    { id: 'chat', icon: <FiMessageCircle size={20} />, label: 'Chat' },
    { id: 'aichat', icon: <FiActivity size={20} />, label: 'AI Chat' },
  ];

  return (
    <LocationContext.Provider value={{ location, setLocation }}>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-teal-100">
        {/* Floating Navbar */}
        <motion.nav
          className={`fixed top-4 left-1/2 transform -translate-x-1/2 z-50 max-w-2xl w-full px-4 ${isNavOpen ? 'backdrop-blur-lg' : ''}`}
          initial={{ y: -100 }}
          animate={{ y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="relative">
            {/* Navigation Toggle */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="absolute -top-2 right-0 bg-gradient-to-r from-blue-600 to-teal-600 text-white p-3 rounded-full shadow-lg"
              onClick={() => setIsNavOpen(!isNavOpen)}
              aria-label={isNavOpen ? 'Close navigation' : 'Open navigation'}
            >
              {isNavOpen ? <FiX size={24} /> : <FiMap size={24} />}
            </motion.button>

            {/* Navigation Items */}
            {isNavOpen && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-white/80 backdrop-blur-md rounded-2xl shadow-xl p-4 mt-4"
              >
                <div className="grid grid-cols-5 gap-2">
                  {navItems.map((item) => (
                    <motion.button
                      key={item.id}
                      whileHover={{ scale: 1.05, y: -5 }}
                      whileTap={{ scale: 0.95 }}
                      className={`flex flex-col items-center p-3 rounded-xl transition-all ${
                        activePage === item.id
                          ? 'bg-gradient-to-r from-blue-600 to-teal-600 text-white shadow-lg'
                          : 'bg-white/90 hover:bg-gray-100 text-gray-700'
                      }`}
                      onClick={() => {
                        setActivePage(item.id);
                        setIsNavOpen(false);
                      }}
                      aria-label={`Go to ${item.label} page`}
                    >
                      <div className="mb-1">{item.icon}</div>
                      <span className="text-xs font-medium">{item.label}</span>
                    </motion.button>
                  ))}
                </div>
              </motion.div>
            )}
          </div>
        </motion.nav>

        {/* Page Content */}
        <div className="pt-24 pb-10 px-4">
          {activePage === 'request' && <RequestPage />}
          {activePage === 'maps' && <MapsPage rotation={rotation} cloudPosition={cloudPosition} />}
          {activePage === 'alert' && <PlaceholderPage title="Emergency Alert" />}
          {activePage === 'chat' && <LiveChatPage />}
          {activePage === 'aichat' && <AIChatPage />}
        </div>
      </div>
    </LocationContext.Provider>
  );
}


function PlaceholderPage({ title }) {
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [volunteers, setVolunteers] = useState([]);
  const [emergencyType, setEmergencyType] = useState('');
  const [description, setDescription] = useState('');

  const emergencyTypes = [
    'Medical Emergency',
    'Natural Disaster',
    'Fire',
    'Rescue Operation',
    'Food/Water Shortage',
    'Other'
  ];

  // Fetch volunteers from the database
useEffect(() => {
  const fetchVolunteers = async () => {
    try {
      const response = await fetch('/api/volunteers', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch volunteers');
      }
      
      const data = await response.json();
      setVolunteers(data);
    } catch (err) {
      console.error('Error fetching volunteers:', err);
      setError('Failed to load volunteer data');
    }
  };

  fetchVolunteers();
}, []);

  const handleSendAlert = async () => {
  setError('');
  setSuccessMessage('');
  setIsLoading(true);

  if (!emergencyType) {
    setError('Please select an emergency type');
    setIsLoading(false);
    return;
  }

  if (volunteers.length === 0) {
    setError('No volunteers available to notify');
    setIsLoading(false);
    return;
  }

  // Prepare alert data
  const alertData = {
    emergencyType,
    description,
    message: `EMERGENCY ALERT: ${emergencyType}
              ${description ? `Details: ${description}` : ''}
              Volunteers needed with skills in: ${[...new Set(volunteers.map(v => v.skills))].join(', ')}`
  };

  try {
    const response = await fetch('/api/alerts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(alertData),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to send alert');
    }

    const result = await response.json();
    setSuccessMessage(`Alert sent to ${result.totalRecipients} volunteers (${result.successfulSends} successful)`);
  } catch (err) {
    console.error('Error sending alert:', err);
    setError(err.message || 'Failed to send alert. Please try again.');
  } finally {
    setIsLoading(false);
  }
};

  // Get current time in IST
  const getCurrentTime = () => {
    return new Date().toLocaleString('en-US', {
      timeZone: 'Asia/Kolkata',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <motion.div
      className="flex flex-col items-center justify-center min-h-[60vh]"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <div className="bg-gradient-to-r from-red-600 to-orange-600 p-5 rounded-full mb-6">
        <FiAlertCircle size={40} className="text-white" />
      </div>
      <h2 className="text-3xl font-bold text-gray-800 mb-4">{title}</h2>
      <p className="text-gray-600 max-w-md text-center mb-8">
        Send emergency alerts to all registered volunteers.
      </p>

      <div className="w-full max-w-md bg-white rounded-xl shadow-md p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Emergency Details</h3>
        
        <div className="mb-5">
          <label className="block text-sm font-medium text-gray-700 mb-1">Emergency Type*</label>
          <select
            className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
            value={emergencyType}
            onChange={(e) => setEmergencyType(e.target.value)}
            required
          >
            <option value="">Select emergency type</option>
            {emergencyTypes.map((type, index) => (
              <option key={index} value={type}>{type}</option>
            ))}
          </select>
        </div>

        <div className="mb-5">
          <label className="block text-sm font-medium text-gray-700 mb-1">Additional Details (Optional)</label>
          <textarea
            placeholder="Provide more details about the emergency..."
            className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
            rows="3"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>

        <div className="mb-4 p-3 bg-blue-50 rounded-lg">
          <p className="text-sm text-blue-800">
            <strong>Note:</strong> This alert will be sent to all {volunteers.length} registered volunteers.
          </p>
        </div>

        {error && (
          <motion.div
            className="flex items-center p-3 bg-red-50 text-red-700 rounded-lg border border-red-200 mb-4"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <FiAlertTriangle className="h-5 w-5 mr-2" />
            <span>{error}</span>
          </motion.div>
        )}

        {successMessage && (
          <motion.div
            className="flex items-center p-3 bg-green-50 text-green-700 rounded-lg border border-green-200 mb-4"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <FiSend className="h-5 w-5 mr-2" />
            <span>{successMessage}</span>
          </motion.div>
        )}

        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className={`w-full px-8 py-3 bg-gradient-to-r from-red-600 to-orange-600 text-white rounded-xl shadow-md flex items-center justify-center ${
            isLoading ? 'opacity-80 cursor-not-allowed' : ''
          }`}
          onClick={handleSendAlert}
          disabled={isLoading}
        >
          {isLoading ? (
            <div className="flex items-center">
              <svg
                className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
              Sending Alert...
            </div>
          ) : (
            <div className="flex items-center">
              <FiAlertTriangle className="h-5 w-5 mr-2" />
              Send Alert to All Volunteers
            </div>
          )}
        </motion.button>
      </div>
    </motion.div>
  );
}
