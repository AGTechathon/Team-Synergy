'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';

export default function HomePage() {
  const [isHovered, setIsHovered] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [stats, setStats] = useState({
    users: 0,
    rescues: 0,
    volunteers: 0,
    active: 0
  });

  // Disaster images for slider
  const disasterImages = [
    "https://media.istockphoto.com/id/1327617934/photo/aerial-view-of-flooded-houses-with-dirty-water-of-dnister-river-in-halych-town-western-ukraine.jpg?s=612x612&w=0&k=20&c=ffFK1c1lx15S3PlX-tee1py2wkLiKYLad67VvFwTG2I=",
    "https://images.unsplash.com/photo-1621077742331-2df96a07cca7?fm=jpg&q=60&w=3000&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8NHx8ZWFydGhxdWFrZXxlbnwwfHwwfHx8MA%3D%3D",
    "https://media.istockphoto.com/id/1029369178/photo/dramatic-tornado-view.jpg?s=612x612&w=0&k=20&c=xWW4RYT_IqJ50V6GjuxUS--3iwvZ8Vjkx69M0bOuoRE=",
    "https://images.pexels.com/photos/51951/forest-fire-fire-smoke-conservation-51951.jpeg?cs=srgb&dl=pexels-pixabay-51951.jpg&fm=jpg",
    "https://c4.wallpaperflare.com/wallpaper/591/304/963/desktopography-natural-disaster-hurricane-water-wallpaper-preview.jpg"
  ];

  // Auto slide images
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide(prev => (prev + 1) % disasterImages.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [disasterImages.length]);

  // Initialize stats with animation
  useEffect(() => {
    const targetStats = {
      users: 12540,
      rescues: 8420,
      volunteers: 3560,
      active: 28
    };

    const duration = 3000;
    const increment = 50;
    let animationFrame;
    
    const animateStats = (startTime) => {
      const now = Date.now();
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      const newStats = {
        users: Math.floor(progress * targetStats.users),
        rescues: Math.floor(progress * targetStats.rescues),
        volunteers: Math.floor(progress * targetStats.volunteers),
        active: Math.floor(progress * targetStats.active)
      };
      
      setStats(newStats);
      
      if (progress < 1) {
        animationFrame = requestAnimationFrame(() => animateStats(startTime));
      }
    };
    
    const startTime = Date.now();
    animationFrame = requestAnimationFrame(() => animateStats(startTime));
    
    return () => cancelAnimationFrame(animationFrame);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-teal-100 relative overflow-hidden">
      {/* Enhanced background with animated gradient */}
      <motion.div 
        className="absolute top-0 left-0 w-full h-full overflow-hidden"
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.4 }}
        transition={{ duration: 2 }}
      >
        <div className="absolute inset-0 bg-gradient-to-r from-blue-200/20 via-teal-200/20 to-cyan-200/20 animate-gradient-xy"></div>
      </motion.div>

      {/* Navigation Bar */}
      <nav className="relative z-10 py-6 px-4 sm:px-8 flex justify-between items-center">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
          className="flex items-center"
        >
          <div className="bg-blue-600 w-10 h-10 rounded-lg flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <span className="ml-3 text-xl font-bold text-gray-800">RakshaMitra AI</span>
        </motion.div>
        
        <motion.a
              whileHover={{ 
                scale: 1.05,
                boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1)"
              }}
              whileTap={{ scale: 0.95 }}
              href="/user/signup"
              className="px-8 py-4 bg-white text-gray-900 font-medium rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 flex items-center"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
              </svg>
              Create User
            </motion.a>
            <motion.a
              whileHover={{ 
                scale: 1.05,
                boxShadow: "0 10px 25px -5px rgba(59, 130, 246, 0.5)"
              }}
              whileTap={{ scale: 0.95 }}
              href="/user/login"
              className="px-8 py-4 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-medium rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 flex items-center"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
              </svg>
              Login User
            </motion.a>
      </nav>

      {/* Main Content */}
      <main className="relative z-10 flex flex-col items-center justify-center min-h-[80vh] px-4 py-12">
        <motion.div
          className="text-center max-w-6xl"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.6 }}
            className="inline-flex items-center px-4 py-1 rounded-full bg-blue-100 text-blue-600 font-medium mb-6"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            Emergency Response Platform
          </motion.div>
          
          <motion.h1
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-4xl md:text-6xl font-bold text-gray-900 mb-6"
          >
            <span className="block">Connecting Help</span>
            <span className="block bg-gradient-to-r from-blue-600 to-teal-600 bg-clip-text text-transparent">
              When Disaster Strikes
            </span>
          </motion.h1>
          
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.6 }}
            className="text-lg md:text-xl text-gray-700 max-w-2xl mx-auto mb-10"
          >
            A decentralized platform for real-time emergency coordination, rescue requests, and volunteer deployment during natural or man-made disasters.
          </motion.p>
          
          <motion.div
            className="flex flex-col sm:flex-row justify-center gap-4 mb-16"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6, duration: 0.5 }}
          >
            <motion.a
              whileHover={{ 
                scale: 1.05,
                boxShadow: "0 10px 25px -5px rgba(59, 130, 246, 0.5)"
              }}
              whileTap={{ scale: 0.95 }}
              href="/login"
              className="px-8 py-4 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-medium rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 flex items-center"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
              </svg>
              Login Volunteer
            </motion.a>
            
            <motion.a
              whileHover={{ 
                scale: 1.05,
                boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1)"
              }}
              whileTap={{ scale: 0.95 }}
              href="/signup"
              className="px-8 py-4 bg-white text-gray-900 font-medium rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 flex items-center"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
              </svg>
              Create Volunteer
            </motion.a>
            <motion.a
              whileHover={{ 
                scale: 1.05,
                boxShadow: "0 10px 25px -5px rgba(59, 130, 246, 0.5)"
              }}
              whileTap={{ scale: 0.95 }}
              href="/userdashboard"
              className="px-8 py-4 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-medium rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 flex items-center"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
              </svg>
              User Request
            </motion.a>
          </motion.div>

          {/* Rescue Statistics */}
          <motion.div 
            className="bg-gradient-to-r from-blue-500 to-teal-500 rounded-2xl shadow-xl p-8 mb-16"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
          >
            <h3 className="text-2xl font-bold text-center text-white mb-8">Our Impact</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {[
                { value: stats.users, label: "Registered Users", icon: "M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" },
                { value: stats.rescues, label: "Rescues Completed", icon: "M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" },
                { value: stats.volunteers, label: "Active Volunteers", icon: "M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" },
                { value: stats.active, label: "Active Operations", icon: "M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" }
              ].map((stat, index) => (
                <div key={index} className="flex flex-col items-center">
                  <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center mb-4">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={stat.icon} />
                    </svg>
                  </div>
                  <motion.div 
                    className="text-4xl font-bold text-white mb-2"
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.1 * index }}
                  >
                    {stat.value.toLocaleString()}+
                  </motion.div>
                  <div className="text-white/80 text-center">{stat.label}</div>
                </div>
              ))}
            </div>
          </motion.div>
          
          {/* Image Slider */}
          <motion.div 
            className="relative w-full max-w-5xl mx-auto h-[400px] rounded-2xl overflow-hidden shadow-2xl mb-16"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.9 }}
          >
            {disasterImages.map((img, index) => (
              <motion.div
                key={index}
                className="absolute inset-0 w-full h-full"
                initial={{ opacity: 0 }}
                animate={{ 
                  opacity: index === currentSlide ? 1 : 0,
                  zIndex: index === currentSlide ? 10 : 0
                }}
                transition={{ duration: 1.5 }}
              >
                <img 
                  src={img} 
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.parentNode.style.display = "none";
                  }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent"></div>
              </motion.div>
            ))}
            
            {/* Slide indicators */}
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2 z-20">
              {disasterImages.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentSlide(index)}
                  className={`w-3 h-3 rounded-full transition-all ${
                    currentSlide === index ? 'bg-white w-6' : 'bg-white/50'
                  }`}
                />
              ))}
            </div>
            
            {/* Slide counter */}
            <div className="absolute top-4 right-4 bg-black/50 text-white px-3 py-1 rounded-full text-sm z-20">
              {currentSlide + 1} / {disasterImages.length}
            </div>
            
            {/* Slide caption */}
            <div className="absolute bottom-8 left-8 max-w-md z-20 text-left">
              <h3 className="text-2xl font-bold text-white mb-2">Rapid Response in Crisis</h3>
              <p className="text-white/90">Our teams are deployed worldwide within hours of disasters</p>
            </div>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.1, duration: 0.6 }}
            className="max-w-5xl mx-auto"
          >
            <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl p-6 md:p-8 border border-white">
              <h3 className="text-2xl font-bold text-center text-gray-800 mb-8">Key Features</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {[
                  { 
                    icon: "M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z",
                    title: "Real-time Coordination",
                    desc: "Connect responders and volunteers instantly with live mapping and communication tools"
                  },
                  { 
                    icon: "M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z",
                    title: "Resource Mapping",
                    desc: "Visualize available resources, needs, and critical infrastructure in affected areas"
                  },
                  { 
                    icon: "M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z",
                    title: "Secure Communication",
                    desc: "Military-grade encrypted channels for sensitive information and coordination"
                  }
                ].map((feature, index) => (
                  <motion.div 
                    key={index}
                    className="flex flex-col items-center text-center p-6 bg-white rounded-xl border border-gray-100 shadow-md hover:shadow-lg transition-shadow"
                    whileHover={{ y: -10 }}
                    transition={{ duration: 0.3 }}
                  >
                    <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center mb-4">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={feature.icon} />
                      </svg>
                    </div>
                    <h4 className="font-bold text-xl text-gray-800 mb-3">{feature.title}</h4>
                    <p className="text-gray-600">{feature.desc}</p>
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>

          {/* Emergency Contacts Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.2, duration: 0.6 }}
            className="max-w-5xl mx-auto mt-16"
          >
            <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl p-6 md:p-8 border border-white">
              <h3 className="text-2xl font-bold text-center text-gray-800 mb-8">Emergency Contacts</h3>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-6">
                {[
                  {
                    icon: "M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a2 2 0 012-2h2a2 2 0 012 2v5m-4 0h4",
                    title: "Firefighter",
                    contact: "+91-101",
                    desc: "For fire emergencies and rescue operations"
                  },
                  {
                    icon: "M12 19l9 2-9-18-9 18 9-2zm0 0v-8",
                    title: "Police",
                    contact: "+91-100",
                    desc: "For law enforcement and safety concerns"
                  },
                  {
                    icon: "M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z",
                    title: "Ambulance",
                    contact: "+91-102",
                    desc: "For medical emergencies and immediate care"
                  },
                  {
                    icon: "M3 21v-4m0 0V5a2 2 0 012-2h6.5l2 2H21l-3 3m0 0l3 3m-3-3H3m15 9v4m0-4H3",
                    title: "NDRF",
                    contact: "+91-9711077372",
                    desc: "National Disaster Response Force for disaster situations"
                  },
                  {
                    icon: "M19 14l-7 7m0 0l-7-7m7 7V3",
                    title: "Flood Helpline",
                    contact: "+91-1070",
                    desc: "For flood-related emergencies and assistance"
                  },
                  {
                    icon: "M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z",
                    title: "Electricity Board",
                    contact: "+91-1912",
                    desc: "For power outages and electrical emergencies"
                  },
                  {
                    icon: "M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z",
                    title: "Gas Leak Helpline",
                    contact: "+91-1906",
                    desc: "For reporting gas leaks and related emergencies"
                  },
                  {
                    icon: "M6 6h12v12H6z",
                    title: "Coast Guard",
                    contact: "+91-1554",
                    desc: "For maritime emergencies and coastal rescue"
                  },
                  {
                    icon: "M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z",
                    title: "Disaster Mgmt",
                    contact: "+91-1078",
                    desc: "National Disaster Management Authority helpline"
                  },
                  {
                    icon: "M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z",
                    title: "Women Helpline",
                    contact: "+91-1091",
                    desc: "For women in distress or emergency situations"
                  }
                ].map((contact, index) => (
                  <motion.div 
                    key={index}
                    className="flex flex-col items-center text-center p-4 bg-white rounded-xl border border-gray-100 shadow-md hover:shadow-lg transition-shadow"
                    whileHover={{ y: -10 }}
                    transition={{ duration: 0.3 }}
                  >
                    <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mb-3">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={contact.icon} />
                      </svg>
                    </div>
                    <h4 className="font-bold text-base text-gray-800 mb-1">{contact.title}</h4>
                    <a 
                      href={`tel:${contact.contact}`} 
                      className="text-sm font-semibold text-red-600 hover:text-red-700 mb-1"
                    >
                      {contact.contact}
                    </a>
                    <p className="text-gray-600 text-sm">{contact.desc}</p>
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>
        </motion.div>
      </main>

      {/* Footer */}
      <motion.footer 
        className="relative z-10 bg-white/90 backdrop-blur-sm py-8 px-4 text-center text-gray-600 border-t border-gray-100"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.3, duration: 0.6 }}
      >
<div className="max-w-6xl mx-auto">
  <p>© 2025 Disaster Crisis Response Platform. All rights reserved.</p>
  <p className="mt-2 text-sm">Last updated: 10:30 AM IST on Sunday, June 8, 2025</p>
  <p className="mt-2 text-sm">Built by Team Synergy</p>
  <div className="mt-4 flex justify-center space-x-6">
    <a href="mailto:wajiddaudtamboli123@gmail.com" className="text-gray-500 hover:text-blue-600">
      <span className="sr-only">Gmail</span>
      <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path d="M24 5.457v13.909c0 .904-.732 1.636-1.636 1.636h-3.819V11.73L12 16.64l-6.545-4.91v9.273H1.636A1.636 1.636 0 0 1 0 19.366V5.457c0-2.023 2.309-3.178 3.927-1.964L5.455 4.64 12 9.548l6.545-4.91 1.528-1.145C21.69 2.28 24 3.434 24 5.457z"/>
      </svg>
    </a>
    <a href="https://github.com/wajiddaudtamboli" className="text-gray-500 hover:text-blue-600">
      <span className="sr-only">GitHub</span>
      <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
      </svg>
    </a>
    <a href="https://www.linkedin.com/in/wajid-daud-tamboli-3217b031a" className="text-gray-500 hover:text-blue-600">
      <span className="sr-only">LinkedIn</span>
      <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path fillRule="evenodd" d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" clipRule="evenodd" />
      </svg>
    </a>
  </div>
</div>
      </motion.footer>

      {/* Floating emergency button */}
      {/* <motion.button
        className="fixed bottom-8 right-8 w-16 h-16 bg-red-500 rounded-full flex items-center justify-center shadow-lg hover:shadow-xl z-20"
        whileHover={{ scale: 1.1, backgroundColor: "#dc2626" }}
        whileTap={{ scale: 0.9 }}
        animate={{ 
          scale: [1, 1.05, 1],
          boxShadow: ["0 0 0 0 rgba(220, 38, 38, 0.7)", "0 0 0 10px rgba(220, 38, 38, 0)", "0 0 0 0 rgba(220, 38, 38, 0)"]
        }}
        transition={{ 
          scale: { duration: 0.3 },
          boxShadow: { repeat: Infinity, duration: 1.5 }
        }}
        onHoverStart={() => setIsHovered(true)}
        onHoverEnd={() => setIsHovered(false)}
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
        <AnimatePresence>
          {isHovered && (
            <motion.span 
              className="absolute right-20 bg-red-500 text-white px-4 py-2 rounded-lg whitespace-nowrap shadow-lg"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0 }}
            >
              Emergency Alert
            </motion.span>
          )}
        </AnimatePresence>
      </motion.button> */}
    </div>
  );
}
