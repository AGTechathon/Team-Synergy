'use client';

import { motion } from 'framer-motion';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { FiUser, FiLock, FiMail, FiPhone, FiAlertCircle, FiEye, FiEyeOff } from 'react-icons/fi';

export default function LoginPage() {
  const router = useRouter();
  const [contact, setContact] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loginMethod, setLoginMethod] = useState('email'); // 'email' or 'phone'

  // Validation functions
  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const phoneRegex = /^\+?\d{1,4}[-.\s]?\(?\d{1,3}\)?[-.\s]?\d{1,4}[-.\s]?\d{1,4}$/;
    if (!email) return 'Email is required';
    if (!emailRegex.test(email)) return 'Please enter a valid email address';
    if (phoneRegex.test(email)) return 'Please provide an email address, not a phone number';
    return '';
  };

  const validatePhone = (phone) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const phoneRegex = /^\+?\d{1,4}[-.\s]?\(?\d{1,3}\)?[-.\s]?\d{1,4}[-.\s]?\d{1,4}$/;
    if (!phone) return 'Phone number is required';
    if (!phoneRegex.test(phone)) return 'Please enter a valid phone number (e.g., +1234567890 or (123) 456-7890)';
    if (emailRegex.test(phone)) return 'Please provide a phone number, not an email address';
    return '';
  };

  const validatePassword = (password) => {
    if (!password) return 'Password is required';
    return '';
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    // Validate contact based on login method
    if (loginMethod === 'email') {
      const emailError = validateEmail(contact);
      if (emailError) {
        setError(emailError);
        setIsLoading(false);
        return;
      }
    } else {
      const phoneError = validatePhone(contact);
      if (phoneError) {
        setError(phoneError);
        setIsLoading(false);
        return;
      }
    }

    // Validate password
    const passwordError = validatePassword(password);
    if (passwordError) {
      setError(passwordError);
      setIsLoading(false);
      return;
    }

    try {
      const formData = new FormData();
      formData.append('contact', contact);
      formData.append('password', password);
      formData.append('contactMethod', loginMethod);

      const res = await fetch('/api/user/login', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Login failed');

      if (data.token) {
        localStorage.setItem('token', data.token);
      }

      alert('Login successful.');
      setIsLoading(false);
      router.push('/userdashboard'); // Redirect to user dashboard
    } catch (err) {
      console.error("Frontend error:", err);
      setError(err.message || 'Invalid credentials. Please try again.');
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-teal-100 p-4">
      {/* Decorative elements */}
      <div className="fixed top-0 left-0 w-full h-full overflow-hidden -z-10">
        <div className="absolute top-20 left-10 w-64 h-64 bg-blue-200 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob"></div>
        <div className="absolute top-40 right-20 w-72 h-72 bg-teal-200 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-2000"></div>
        <div className="absolute bottom-20 left-1/3 w-60 h-60 bg-cyan-200 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-4000"></div>
      </div>

      <motion.div 
        className="w-full max-w-md"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="text-center mb-10">
          <motion.div
            className="mx-auto bg-blue-600 w-16 h-16 rounded-xl flex items-center justify-center shadow-lg"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.1, duration: 0.5 }}
          >
            <FiUser className="h-8 w-8 text-white" />
          </motion.div>
          <motion.h1 
            className="text-3xl font-bold mt-4 text-gray-800"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.5 }}
          >
            Welcome Back
          </motion.h1>
          <motion.p 
            className="text-gray-600 mt-2"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.5 }}
          >
            Sign in to your Disaster Response account as of 11:29 AM IST on Saturday, May 31, 2025.
          </motion.p>
        </div>

        <motion.div 
          className="bg-white rounded-2xl shadow-xl overflow-hidden"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.5 }}
        >
          {/* Tabs for login method */}
          <div className="flex border-b border-gray-200">
            <button
              className={`flex-1 py-4 font-medium text-center transition-colors ${
                loginMethod === 'email' 
                  ? 'text-blue-600 border-b-2 border-blue-600' 
                  : 'text-gray-500 hover:text-gray-700'
              }`}
              onClick={() => setLoginMethod('email')}
            >
              <div className="flex items-center justify-center">
                <FiMail className="mr-2" />
                Email
              </div>
            </button>
            <button
              className={`flex-1 py-4 font-medium text-center transition-colors ${
                loginMethod === 'phone' 
                  ? 'text-blue-600 border-b-2 border-blue-600' 
                  : 'text-gray-500 hover:text-gray-700'
              }`}
              onClick={() => setLoginMethod('phone')}
            >
              <div className="flex items-center justify-center">
                <FiPhone className="mr-2" />
                Phone
              </div>
            </button>
          </div>

          <div className="p-6 sm:p-8">
            <form onSubmit={handleLogin} className="flex flex-col gap-5">
              {loginMethod === 'email' ? (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email Address
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <FiMail className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="email"
                      placeholder="name@example.com"
                      className="w-full pl-10 pr-3 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                      value={contact}
                      onChange={(e) => setContact(e.target.value)}
                    />
                  </div>
                </div>
              ) : (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Phone Number
                  </label>
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
                    />
                  </div>
                </div>
              )}

              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="block text-sm font-medium text-gray-700">
                    Password
                  </label>
                  <a href="#" className="text-sm text-blue-600 hover:underline">
                    Forgot password?
                  </a>
                </div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FiLock className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    className="w-full pl-10 pr-10 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <FiEyeOff className="h-5 w-5 text-gray-400" />
                    ) : (
                      <FiEye className="h-5 w-5 text-gray-400" />
                    )}
                  </button>
                </div>
              </div>

              {error && (
                <motion.div 
                  className="flex items-center p-3 bg-red-50 text-red-700 rounded-lg border border-red-200"
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <FiAlertCircle className="h-5 w-5 mr-2" />
                  <span>{error}</span>
                </motion.div>
              )}

              <motion.button
                type="submit"
                className={`w-full py-3.5 px-4 rounded-xl font-medium text-white shadow-md transition-all ${
                  isLoading 
                    ? 'bg-blue-400 cursor-not-allowed' 
                    : 'bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 hover:shadow-lg'
                }`}
                whileHover={!isLoading ? { scale: 1.02 } : {}}
                whileTap={!isLoading ? { scale: 0.98 } : {}}
                disabled={isLoading}
              >
                {isLoading ? (
                  <div className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Signing in...
                  </div>
                ) : (
                  'Sign In'
                )}
              </motion.button>
            </form>
          </div>

          <div className="bg-gray-50 px-6 py-4 border-t border-gray-200">
            <p className="text-sm text-center text-gray-600">
              Don't have an account?{' '}
              <a href="/signup" className="font-medium text-blue-600 hover:text-blue-500 hover:underline">
                Sign up
              </a>
            </p>
          </div>
        </motion.div>

        <motion.footer
          className="relative z-10 bg-white/90 backdrop-blur-sm py-8 px-4 text-center text-gray-600 border-t border-gray-100 mt-10"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.6 }}
        >
          <div className="max-w-7xl mx-auto">
            <p>© 2025 Disaster Crisis Response Platform. All rights reserved.</p>
            <p className="mt-2 text-sm">Last updated: 11:29 AM IST on Saturday, May 31, 2025</p>
            <p className="mt-2 text-sm">Built with ❤ to help communities in need</p>
          </div>
        </motion.footer>
      </motion.div>
    </div>
  );
}