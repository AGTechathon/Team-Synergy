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
