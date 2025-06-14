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

function RequestPage() {
  const router = useRouter();
  const { setLocation } = useContext(LocationContext);
  const [name, setName] = useState('');
  const [contact, setContact] = useState('');
  const [type, setType] = useState('');
  const [urgency, setUrgency] = useState('');
  const [description, setDescription] = useState('');
  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');
  const [image, setImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [activeStep, setActiveStep] = useState(1);

  const requestTypes = ['Medical', 'Rescue', 'Supplies', 'Shelter', 'Other'];
  const urgencyLevels = ['Low', 'Medium', 'High', 'Critical'];

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

  // Update location in context when latitude or longitude changes
  useEffect(() => {
    if (latitude && longitude) {
      setLocation({ latitude: parseFloat(latitude), longitude: parseFloat(longitude) });
    }
  }, [latitude, longitude, setLocation]);

  // Validation functions
  const validateName = (name) => {
    const nameRegex = /^[A-Za-z\s]{2,}$/;
    if (!name) return 'Full name is required';
    if (!nameRegex.test(name)) return 'Full name must contain only letters and spaces, minimum 2 characters';
    return '';
  };

  const validatePhone = (phone) => {
    const phoneRegex = /^\+?\d{1,4}[-.\s]?\(?\d{1,3}\)?[-.\s]?\d{1,4}[-.\s]?\d{1,4}$/;
    if (!phone) return 'Phone number is required';
    if (!phoneRegex.test(phone)) return 'Please enter a valid phone number (e.g., +1234567890 or (123) 456-7890)';
    return '';
  };

  const validateRequestType = (type) => {
    if (!type) return 'Please select a request type';
    if (!requestTypes.includes(type)) return 'Invalid request type selected';
    return '';
  };

  const validateUrgency = (urgency) => {
    if (!urgency) return 'Please select an urgency level';
    if (!urgencyLevels.includes(urgency)) return 'Invalid urgency level selected';
    return '';
  };

  const validateDescription = (description) => {
    if (!description) return ''; // Description is optional
    const descriptionRegex = /^[A-Za-z0-9\s.,!?-]+$/;
    if (!descriptionRegex.test(description)) return 'Description can only contain letters, numbers, spaces, and basic punctuation (.,!?-)';
    return '';
  };

  const validateLatitude = (latitude) => {
    const lat = parseFloat(latitude);
    if (!latitude) return 'Latitude is required';
    if (isNaN(lat) || lat < -90 || lat > 90) return 'Latitude must be a number between -90 and 90';
    return '';
  };

  const validateLongitude = (longitude) => {
    const lon = parseFloat(longitude);
    if (!longitude) return 'Longitude is required';
    if (isNaN(lon) || lon < -180 || lon > 180) return 'Longitude must be a number between -180 and 180';
    return '';
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const validTypes = ['image/jpeg', 'image/png', 'image/gif'];
      if (!validTypes.includes(file.type)) {
        setError('Please upload an image in JPEG, PNG, or GIF format.');
        setImage(null);
        setImagePreview(null);
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        // 5MB limit
        setError('Image size must be less than 5MB.');
        setImage(null);
        setImagePreview(null);
        return;
      }

      setImage(file);
      setImagePreview(URL.createObjectURL(file));
      setError('');
    }
  };

  const resetForm = () => {
  setName('');
  setContact('');
  setType('');
  setUrgency('');
  setDescription('');
  setLatitude('');
  setLongitude('');
  setImage(null);
  if (imagePreview) {
    URL.revokeObjectURL(imagePreview);  // Fixed this line
    setImagePreview(null);
  }
  setActiveStep(1);
  setError('');
  setLocation({ latitude: null, longitude: null });
};

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
UUUUUUU
    // Step 1 validations
    const nameError = validateName(name);
    if (nameError) {
      setError(nameError);
      setIsLoading(false);
      return;
    }

    const phoneError = validatePhone(contact);
    if (phoneError) {
      setError(phoneError);
      setIsLoading(false);
      return;
    }

    // Step 2 validations
    const typeError = validateRequestType(type);
    if (typeError) {
      setError(typeError);
      setIsLoading(false);
      return;
    }

    const urgencyError = validateUrgency(urgency);
    if (urgencyError) {
      setError(urgencyError);
      setIsLoading(false);
      return;
    }

    const descriptionError = validateDescription(description);
    if (descriptionError) {
      setError(descriptionError);
      setIsLoading(false);
      return;
    }

    // Step 3 validations
    const latitudeError = validateLatitude(latitude);
    if (latitudeError) {
      setError(latitudeError);
      setIsLoading(false);
      return;
    }

    const longitudeError = validateLongitude(longitude);
    if (longitudeError) {
      setError(longitudeError);
      setIsLoading(false);
      return;
    }

    // Prepare form data to send to the backend
    const formData = new FormData();
    formData.append('name', name);
    formData.append('contact', contact);
    formData.append('type', type);
    formData.append('urgency', urgency);
    formData.append('description', description);
    formData.append('latitude', parseFloat(latitude));
    formData.append('longitude', parseFloat(longitude));
    if (image) {
      formData.append('image', image);
    }

    try {
      const res = await fetch('/api/staff/requests', {
        method: 'POST',
        body: formData,
      });

      const text = await res.text();
      let data;
      try {
        data = JSON.parse(text);
      } catch (jsonErr) {
        console.error('Failed to parse response as JSON:', jsonErr);
        throw new Error('Server did not return valid JSON');
      }

      if (!res.ok) throw new Error(data.message || 'Request submission failed');

      alert('Request submitted successfully.');
      resetForm();
      setIsLoading(false);
      router.push('/userdashboard');
    } catch (err) {
      console.error('Frontend error:', err);
      setError(err.message || 'Request submission failed. Please try again.');
      setIsLoading(false);
    }
  };

  const nextStep = () => {
    if (activeStep < 3) {
      if (activeStep === 1) {
        const nameError = validateName(name);
        if (nameError) {
          setError(nameError);
          return;
        }
        const phoneError = validatePhone(contact);
        if (phoneError) {
          setError(phoneError);
          return;
        }
      }
      if (activeStep === 2) {
        const typeError = validateRequestType(type);
        if (typeError) {
          setError(typeError);
          return;
        }
        const urgencyError = validateUrgency(urgency);
        if (urgencyError) {
          setError(urgencyError);
          return;
        }
        const descriptionError = validateDescription(description);
        if (descriptionError) {
          setError(descriptionError);
          return;
        }
      }
      setError('');
      setActiveStep(activeStep + 1);
    }
  };

  const prevStep = () => {
    if (activeStep > 1) {
      setActiveStep(activeStep - 1);
      setError('');
    }
  };

  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const lat = position.coords.latitude.toString();
          const lon = position.coords.longitude.toString();
          setLatitude(lat);
          setLongitude(lon);
          setLocation({ latitude: parseFloat(lat), longitude: parseFloat(lon) });
          setError('');
        },
        (err) => {
          setError('Failed to get location. Please enter coordinates manually.');
        }
      );
    } else {
      setError('Geolocation is not supported by your browser.');
    }
  };

  return (
    <div className="flex items-center justify-center p-4">
      <div className="fixed top-0 left-0 w-full h-full overflow-hidden -z-10">
        <div className="absolute top-20 left-10 w-64 h-64 bg-blue-200 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob"></div>
        <div className="absolute top-40 right-20 w-72 h-72 bg-teal-200 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-2000"></div>
        <div className="absolute bottom-20 left-1/3 w-60 h-60 bg-cyan-200 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-4000"></div>
      </div>

      <motion.div
        className="w-full max-w-2xl bg-white rounded-2xl shadow-xl overflow-hidden"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
      >
        <div className="bg-gradient-to-r from-blue-600 to-teal-600 p-6 sm:p-8 text-white">
          <motion.div
            className="flex items-center justify-center mb-4"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <div className="bg-white/20 p-3 rounded-full mr-3">
              <FiHelpCircle className="h-6 w-6" />
            </div>
            <h1 className="text-2xl font-bold">Submit a Request</h1>
          </motion.div>
          <motion.p
            className="text-center text-blue-100 max-w-xl mx-auto"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            Request assistance for disaster response as of {getCurrentTime()}. Fill in the details below to get help.
          </motion.p>
        </div>

        <motion.div
          className="px-6 py-4 border-b border-gray-200 bg-gray-50"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
        >
          <div className="flex justify-between">
            {[1, 2, 3].map((step) => (
              <div key={step} className="flex flex-col items-center flex-1">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    step <= activeStep ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-500'
                  }`}
                >
                  {step}
                </div>
                <span className="mt-2 text-xs text-gray-600">
                  {step === 1 ? 'Personal' : step === 2 ? 'Request Details' : 'Location'}
                </span>
              </div>
            ))}
          </div>
        </motion.div>

        <div className="p-6 sm:p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {activeStep === 1 && (
              <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.4 }}>
                <h2 className="text-xl font-bold text-gray-800 mb-6">Personal Information</h2>

                <div className="mb-5">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <FiUser className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="text"
                      placeholder="John Doe"
                      className="w-full pl-10 pr-3 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                      value={name}
                      onChange={(e) => setName(e.target.value.trim())}
                      required
                    />
                  </div>
                </div>

                <div className="mb-5">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Contact (Phone Number)</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <FiPhone className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="tel"
                      placeholder="+1 (555) 123-4567"
                      className="w-full pl-10 pr-3 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                      value={contact}
                      onChange={(e) => setContact(e.target.value)}
                      required
                    />
                  </div>
                </div>
              </motion.div>
            )}

            {activeStep === 2 && (
              <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.4 }}>
                <h2 className="text-xl font-bold text-gray-800 mb-6">Request Details</h2>

                <div className="mb-5">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Request Type</label>
                  <div className="grid grid-cols-2 gap-3">
                    {requestTypes.map((reqType, index) => (
                      <label key={index} className="flex items-center bg-gray-50 rounded-lg p-3 cursor-pointer hover:bg-blue-50">
                        <input
                          type="radio"
                          name="type"
                          value={reqType}
                          className="h-4 w-4 text-blue-600 rounded focus:ring-blue-500"
                          checked={type === reqType}
                          onChange={(e) => setType(e.target.value)}
                          required
                        />
                        <span className="ml-2 text-gray-700">{reqType}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="mb-5">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Urgency Level</label>
                  <div className="grid grid-cols-2 gap-3">
                    {urgencyLevels.map((level, index) => (
                      <label key={index} className="flex items-center bg-gray-50 rounded-lg p-3 cursor-pointer hover:bg-blue-50">
                        <input
                          type="radio"
                          name="urgency"
                          value={level}
                          className="h-4 w-4 text-blue-600 rounded focus:ring-blue-500"
                          checked={urgency === level}
                          onChange={(e) => setUrgency(e.target.value)}
                          required
                        />
                        <span className="ml-2 text-gray-700">{level}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="mb-5">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description (Optional)</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <FiMessageSquare className="h-5 w-5 text-gray-400" />
                    </div>
                    <textarea
                      placeholder="Describe your request (e.g., need medical supplies for 10 people)"
                      className="w-full pl-10 pr-3 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                      rows="4"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                    />
                  </div>
                </div>
              </motion.div>
            )}

            {activeStep === 3 && (
              <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.4 }}>
                <h2 className="text-xl font-bold text-gray-800 mb-6">Location Details</h2>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Latitude</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <FiMapPin className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        type="number"
                        step="any"
                        placeholder="e.g., 40.7128"
                        className="w-full pl-10 pr-3 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                        value={latitude}
                        onChange={(e) => setLatitude(e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Longitude</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <FiMapPin className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        type="number"
                        step="any"
                        placeholder="e.g., -74.0060"
                        className="w-full pl-10 pr-3 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                        value={longitude}
                        onChange={(e) => setLongitude(e.target.value)}
                        required
                      />
                    </div>
                  </div>
                </div>

                <motion.button
                  type="button"
                  className="mt-4 px-4 py-2 bg-blue-600 text-white font-medium rounded-xl hover:bg-blue-700 transition flex items-center"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={getCurrentLocation}
                >
                  <FiCrosshair className="h-5 w-5 mr-2" />
                  Use My Location
                </motion.button>

                <p className="mt-2 text-sm text-gray-500">
                  Enter your location coordinates or use the button above to auto-detect. Example: New York City is approximately 40.7128, -74.0060.
                </p>

                <div className="mt-6">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Upload Image (Optional)</label>
                  <div className="relative">
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/gif"
                      className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                      onChange={handleImageChange}
                    />
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <FiImage className="h-5 w-5 text-gray-400" />
                    </div>
                  </div>
                  {imagePreview && (
                    <motion.div
                      className="mt-4"
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.3 }}
                    >
                      <img src={imagePreview} alt="Preview" className="w-full max-w-xs rounded-lg shadow-md" />
                      <motion.button
                        type="button"
                        className="mt-2 px-4 py-1 bg-red-500 text-white rounded-lg hover:bg-red-600 transition"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => {
                          URL.revokeObjectURL(imagePreview);
                          setImage(null);
                          setImagePreview(null);
                          setError('');
                        }}
                      >
                        Remove Image
                      </motion.button>
                    </motion.div>
                  )}
                  <p className="mt-2 text-sm text-gray-500">
                    Upload an image to provide more context (e.g., damage photos). Max size: 5MB. Formats: JPEG, PNG, GIF.
                  </p>
                </div>
              </motion.div>
            )}

            {error && (
              <motion.div
                className="flex items-center p-3 bg-red-50 text-red-700 rounded-lg border border-red-200"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <FiAlertTriangle className="h-5 w-5 mr-2" />
                <span>{error}</span>
              </motion.div>
            )}

            <div className="flex justify-between mt-8">
              {activeStep > 1 ? (
                <motion.button
                  type="button"
                  className="px-6 py-3 text-gray-600 font-medium rounded-xl border border-gray-300 hover:bg-gray-50 transition flex items-center"
                  whileHover={{ x: -5 }}
                  onClick={prevStep}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5 mr-1"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                  Back
                </motion.button>
              ) : (
                <div></div>
              )}

              {activeStep < 3 ? (
                <motion.button
                  type="button"
                  className="px-6 py-3 bg-blue-600 text-white font-medium rounded-xl hover:bg-blue-700 transition flex items-center"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={nextStep}
                >
                  Next
                  <FiArrowRight className="h-5 w-5 ml-1" />
                </motion.button>
              ) : (
                <motion.button
                  type="submit"
                  className={`px-8 py-3 bg-gradient-to-r from-blue-600 to-teal-600 text-white font-medium rounded-xl shadow-md hover:shadow-lg transition-all flex items-center ${
                    isLoading ? 'opacity-80 cursor-not-allowed' : ''
                  }`}
                  whileHover={!isLoading ? { scale: 1.05 } : {}}
                  whileTap={!isLoading ? { scale: 0.95 } : {}}
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
                      Submitting Request...
                    </div>
                  ) : (
                    <div className="flex items-center">
                      Submit Request
                      <FiArrowRight className="h-5 w-5 ml-2" />
                    </div>
                  )}
                </motion.button>
              )}
            </div>
          </form>
        </div>
      </motion.div>
    </div>
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
