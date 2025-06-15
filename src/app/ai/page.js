'use client';

import { motion } from 'framer-motion';
import { FiActivity } from 'react-icons/fi';
import RakshaMitraAIChatBot from '../components/RakshaMitraAIChatBot';
import WeatherApp from '../components/WeatherApp';

export default function AIChatPage() {
  return (
    <motion.div
      className="flex flex-col items-center min-h-screen p-4 bg-gray-50"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-teal-600 p-5 rounded-full mb-6">
        <FiActivity size={40} className="text-white" />
      </div>
      <h2 className="text-3xl font-bold text-gray-800 mb-4">AI Weather Assistant</h2>
      <p className="text-gray-600 max-w-2xl text-center mb-8">
        AI-powered weather analysis and disaster preparedness for effective response planning. 
        Get real-time weather data, agricultural impact analysis, and chat with our AI assistant.
      </p>      {/* Main Content Section - Weather and Chatbot Side by Side */}
      <div className="w-full max-w-7xl flex flex-col xl:flex-row gap-6 items-start">
        {/* Weather App Section */}
        <motion.div
          className="w-full xl:w-1/3 flex-shrink-0"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2, duration: 0.5 }}
        >
          <WeatherApp />
        </motion.div>

        {/* RakshaMitra AI ChatBot Section */}
        <motion.div
          className="w-full xl:w-2/3 flex-grow"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4, duration: 0.5 }}
        >
          <RakshaMitraAIChatBot />
        </motion.div>
      </div>
    </motion.div>
  );
}
