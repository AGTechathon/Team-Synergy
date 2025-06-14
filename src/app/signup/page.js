'use client';

import { motion } from 'framer-motion';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { FiUser, FiMail, FiPhone, FiLock, FiTool, FiEye, FiEyeOff, FiArrowRight, FiImage, FiRefreshCw } from 'react-icons/fi';

export default function SignupPage() {
    const router = useRouter();
    const [name, setName] = useState('');
    const [contact, setContact] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [skills, setSkills] = useState('');
    const [certifications, setCertifications] = useState([]);
    const [aadhaarImage, setAadhaarImage] = useState(null);
    const [aadhaarImagePreview, setAadhaarImagePreview] = useState(null);
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [activeStep, setActiveStep] = useState(1);
    const [contactMethod, setContactMethod] = useState('email');

    // CAPTCHA states
    const [captchaNum1, setCaptchaNum1] = useState(Math.floor(Math.random() * 10));
    const [captchaNum2, setCaptchaNum2] = useState(Math.floor(Math.random() * 10));
    const [captchaAnswer, setCaptchaAnswer] = useState('');
    const [captchaError, setCaptchaError] = useState('');

    // Validation functions
    const validateName = (name) => {
        const nameRegex = /^[A-Za-z\s]{2,}$/;
        if (!name) return 'Full name is required';
        if (!nameRegex.test(name)) return 'Full name must contain only letters and spaces, minimum 2 characters';
        return '';
    };

    const validatePassword = (password) => {
        const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
        if (!password) return 'Password is required';
        if (!passwordRegex.test(password)) {
            return 'Password must be at least 8 characters long, with at least one uppercase letter, one lowercase letter, one number, and one special character (@$!%*?&)';
        }
        return '';
    };

    const validateConfirmPassword = (password, confirmPassword) => {
        if (!confirmPassword) return 'Please confirm your password';
        if (password !== confirmPassword) return 'Passwords do not match';
        return '';
    };

    const validateEmail = (email) => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!email) return 'Email is required';
        if (!emailRegex.test(email)) return 'Please enter a valid email address';
        return '';
    };

    const validatePhone = (phone) => {
        const phoneRegex = /^\+?\d{1,4}[-.\s]?\(?\d{1,3}\)?[-.\s]?\d{1,4}[-.\s]?\d{1,4}$/;
        if (!phone) return 'Phone number is required';
        if (!phoneRegex.test(phone)) return 'Please enter a valid phone number (e.g., +1234567890 or (123) 456-7890)';
        return '';
    };

    const validateSkills = (skills) => {
        if (!skills) return ''; // Skills are optional
        const skillsRegex = /^[A-Za-z\s,]+$/;
        if (!skillsRegex.test(skills)) return 'Skills can only contain letters, spaces, and commas';
        return '';
    };

    const validateCaptcha = () => {
        const correctAnswer = captchaNum1 + captchaNum2;
        if (!captchaAnswer) return 'Please solve the CAPTCHA';
        if (parseInt(captchaAnswer) !== correctAnswer) return 'Incorrect CAPTCHA answer';
        return '';
    };

    const regenerateCaptcha = () => {
        setCaptchaNum1(Math.floor(Math.random() * 10));
        setCaptchaNum2(Math.floor(Math.random() * 10));
        setCaptchaAnswer('');
        setCaptchaError('');
    };

    const handleAadhaarImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            const validTypes = ['image/jpeg', 'image/png'];
            if (!validTypes.includes(file.type)) {
                setError('Please upload an Aadhaar card image in JPEG or PNG format.');
                setAadhaarImage(null);
                setAadhaarImagePreview(null);
                return;
            }
            if (file.size > 2 * 1024 * 1024) { // 2MB limit
                setError('Image size must be less than 2MB.');
                setAadhaarImage(null);
                setAadhaarImagePreview(null);
                return;
            }

            setAadhaarImage(file);
            setAadhaarImagePreview(URL.createObjectURL(file));
            setError('');
        }
    };

    const resetForm = () => {
        setName('');
        setContact('');
        setPassword('');
        setConfirmPassword('');
        setSkills('');
        setCertifications([]);
        setAadhaarImage(null);
        if (aadhaarImagePreview) {
            URL.revokeObjectURL(aadhaarImagePreview);
            setAadhaarImagePreview(null);
        }
        setActiveStep(1);
        setError('');
        setContactMethod('email');
        setCaptchaAnswer('');
        setCaptchaError('');
        regenerateCaptcha();
    };

    const handleSignup = async (e) => {
        e.preventDefault();
        setError('');
        setCaptchaError('');
        setIsLoading(true);

        // Step 1 validations
        const nameError = validateName(name);
        if (nameError) {
            setError(nameError);
            setIsLoading(false);
            return;
        }

        const passwordError = validatePassword(password);
        if (passwordError) {
            setError(passwordError);
            setIsLoading(false);
            return;
        }

        const confirmPasswordError = validateConfirmPassword(password, confirmPassword);
        if (confirmPasswordError) {
            setError(confirmPasswordError);
            setIsLoading(false);
            return;
        }

        // Step 2 validations
        if (contactMethod === 'email') {
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

        // Step 3 validations
        const skillsError = validateSkills(skills);
        if (skillsError) {
            setError(skillsError);
            setIsLoading(false);
            return;
        }

        // Step 4: CAPTCHA validation
        const captchaValidationError = validateCaptcha();
        if (captchaValidationError) {
            setCaptchaError(captchaValidationError);
            setIsLoading(false);
            return;
        }

        // Prepare form data
        const formData = new FormData();
        formData.append('name', name);
        formData.append('contact', contact);
        formData.append('password', password);
        formData.append('skills', skills);
        formData.append('certifications', JSON.stringify(certifications));
        if (aadhaarImage) {
            formData.append('aadhaarImage', aadhaarImage);
        }

        try {
            const res = await fetch('/api/staff/signup', {
                method: 'POST',
                body: formData,
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.message || 'Signup failed');

            if (data.token) {
                localStorage.setItem('token', data.token);
            }

            alert('Volunteer registered successfully.');
            resetForm();
            setIsLoading(false);
            router.push('/login');
        } catch (err) {
            setError(err.message || 'Signup failed. Please try again.');
            setIsLoading(false);
        }
    };

    const nextStep = () => {
        if (activeStep < 4) {
            if (activeStep === 1) {
                const nameError = validateName(name);
                if (nameError) {
                    setError(nameError);
                    return;
                }
                const passwordError = validatePassword(password);
                if (passwordError) {
                    setError(passwordError);
                    return;
                }
                const confirmPasswordError = validateConfirmPassword(password, confirmPassword);
                if (confirmPasswordError) {
                    setError(confirmPasswordError);
                    return;
                }
            }
            if (activeStep === 2) {
                if (contactMethod === 'email') {
                    const emailError = validateEmail(contact);
                    if (emailError) {
                        setError(emailError);
                        return;
                    }
                } else {
                    const phoneError = validatePhone(contact);
                    if (phoneError) {
                        setError(phoneError);
                        return;
                    }
                }
            }
            if (activeStep === 3) {
                const skillsError = validateSkills(skills);
                if (skillsError) {
                    setError(skillsError);
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
            setCaptchaError('');
        }
    };

    const toggleCertification = (cert) => {
        if (certifications.includes(cert)) {
            setCertifications(certifications.filter((c) => c !== cert));
        } else {
            setCertifications([...certifications, cert]);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-teal-100 p-4">
            {/* Decorative background elements */}
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
                {/* Header Section */}
                <div className="bg-gradient-to-r from-blue-600 to-teal-600 p-6 sm:p-8 text-white">
                    <motion.div 
                        className="flex items-center justify-center mb-4"
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                    >
                        <div className="bg-white/20 p-3 rounded-full mr-3">
                            <FiUser className="h-6 w-6" />
                        </div>
                        <h1 className="text-2xl font-bold">Volunteer Registration</h1>
                    </motion.div>
                    <motion.p 
                        className="text-center text-blue-100 max-w-xl mx-auto"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.4 }}
                    >
                        Join our emergency response team as of 01:13 AM IST on Saturday, May 31, 2025, and help communities in times of crisis.
                    </motion.p>
                </div>

                {/* Progress Steps */}
                <motion.div 
                    className="px-6 py-4 border-b border-gray-200 bg-gray-50"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.6 }}
                >
                    <div className="flex justify-between">
                        {[1, 2, 3, 4].map((step) => (
                            <div key={step} className="flex flex-col items-center flex-1">
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                                    step <= activeStep 
                                        ? 'bg-blue-600 text-white' 
                                        : 'bg-gray-200 text-gray-500'
                                }`}>
                                    {step}
                                </div>
                                <span className="mt-2 text-xs text-gray-600">
                                    {step === 1 ? 'Personal' : step === 2 ? 'Contact' : step === 3 ? 'Skills' : 'Confirm'}
                                </span>
                            </div>
                        ))}
                    </div>
                </motion.div>

                {/* Form Content */}
                <div className="p-6 sm:p-8">
                    <form onSubmit={handleSignup} className="space-y-6">
                        {activeStep === 1 && (
                            <motion.div
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ duration: 0.4 }}
                            >
                                <h2 className="text-xl font-bold text-gray-800 mb-6">Personal Information</h2>
                                
                                <div className="mb-5">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Full Name
                                    </label>
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

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Password
                                        </label>
                                        <div className="relative">
                                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                                <FiLock className="h-5 w-5 text-gray-400" />
                                            </div>
                                            <input
                                                type={showPassword ? "text" : "password"}
                                                placeholder="Create a password"
                                                className="w-full pl-10 pr-10 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                                                value={password}
                                                onChange={(e) => setPassword(e.target.value)}
                                                required
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

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Confirm Password
                                        </label>
                                        <div className="relative">
                                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                                <FiLock className="h-5 w-5 text-gray-400" />
                                            </div>
                                            <input
                                                type={showPassword ? "text" : "password"}
                                                placeholder="Confirm your password"
                                                className="w-full pl-10 pr-10 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                                                value={confirmPassword}
                                                onChange={(e) => setConfirmPassword(e.target.value)}
                                                required
                                            />
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        )}

                        {activeStep === 2 && (
                            <motion.div
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ duration: 0.4 }}
                            >
                                <h2 className="text-xl font-bold text-gray-800 mb-6">Contact Information</h2>
                                
                                <div className="mb-6">
                                    <label className="block text-sm font-medium text-gray-700 mb-3">
                                        Contact Method
                                    </label>
                                    <div className="flex space-x-4">
                                        <button
                                            type="button"
                                            className={`flex-1 py-3 rounded-xl border transition-colors ${
                                                contactMethod === 'email' 
                                                    ? 'border-blue-500 bg-blue-50 text-blue-600' 
                                                    : 'border-gray-300 text-gray-600 hover:bg-gray-50'
                                            }`}
                                            onClick={() => setContactMethod('email')}
                                        >
                                            <div className="flex flex-col items-center">
                                                <FiMail className="h-5 w-5 mb-1" />
                                                <span>Email</span>
                                            </div>
                                        </button>
                                        <button
                                            type="button"
                                            className={`flex-1 py-3 rounded-xl border transition-colors ${
                                                contactMethod === 'phone' 
                                                    ? 'border-blue-500 bg-blue-50 text-blue-600' 
                                                    : 'border-gray-300 text-gray-600 hover:bg-gray-50'
                                            }`}
                                            onClick={() => setContactMethod('phone')}
                                        >
                                            <div className="flex flex-col items-center">
                                                <FiPhone className="h-5 w-5 mb-1" />
                                                <span>Phone</span>
                                            </div>
                                        </button>
                                    </div>
                                </div>

                                <div className="mb-5">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        {contactMethod === 'email' ? 'Email Address' : 'Phone Number'}
                                    </label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                            {contactMethod === 'email' ? (
                                                <FiMail className="h-5 w-5 text-gray-400" />
                                            ) : (
                                                <FiPhone className="h-5 w-5 text-gray-400" />
                                            )}
                                        </div>
                                        <input
                                            type={contactMethod === 'email' ? "email" : "tel"}
                                            placeholder={contactMethod === 'email' ? "john.doe@example.com" : "+1 (555) 123-4567"}
                                            className="w-full pl-10 pr-3 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                                            value={contact}
                                            onChange={(e) => setContact(e.target.value)}
                                            required
                                        />
                                    </div>
                                </div>
                            </motion.div>
                        )}

                        {activeStep === 3 && (
                            <motion.div
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ duration: 0.4 }}
                            >
                                <h2 className="text-xl font-bold text-gray-800 mb-6">Skills & Expertise</h2>
                                
                                <div className="mb-5">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Skills (Optional)
                                    </label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                            <FiTool className="h-5 w-5 text-gray-400" />
                                        </div>
                                        <input
                                            type="text"
                                            placeholder="Medical, Search & Rescue, Logistics, Communications..."
                                            className="w-full pl-10 pr-3 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                                            value={skills}
                                            onChange={(e) => setSkills(e.target.value)}
                                        />
                                    </div>
                                    <p className="mt-1 text-sm text-gray-500">
                                        List your skills separated by commas (e.g., First Aid, CPR, Logistics)
                                    </p>
                                </div>

                                <div className="mb-5">
                                    <h3 className="font-medium text-gray-700 mb-3">Certifications</h3>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                        {['First Aid', 'CPR', 'EMT', 'Fire Safety', 'Search & Rescue', 'Crisis Counseling'].map((cert, index) => (
                                            <label key={index} className="flex items-center bg-gray-50 rounded-lg p-3 cursor-pointer hover:bg-blue-50">
                                                <input 
                                                    type="checkbox" 
                                                    className="h-4 w-4 text-blue-600 rounded focus:ring-blue-500"
                                                    checked={certifications.includes(cert)}
                                                    onChange={() => toggleCertification(cert)}
                                                />
                                                <span className="ml-2 text-gray-700">{cert}</span>
                                            </label>
                                        ))}
                                    </div>
                                </div>

                                <div className="mt-6">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Aadhaar Card Image (Optional)
                                    </label>
                                    <div className="relative">
                                        <input
                                            type="file"
                                            accept="image/jpeg,image/png"
                                            className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                                            onChange={handleAadhaarImageChange}
                                        />
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                            <FiImage className="h-5 w-5 text-gray-400" />
                                        </div>
                                    </div>
                                    {aadhaarImagePreview && (
                                        <motion.div
                                            className="mt-4"
                                            initial={{ opacity: 0, scale: 0.95 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            transition={{ duration: 0.3 }}
                                        >
                                            <img
                                                src={aadhaarImagePreview}
                                                alt="Aadhaar Card Preview"
                                                className="w-full max-w-xs rounded-lg shadow-md"
                                            />
                                            <motion.button
                                                type="button"
                                                className="mt-2 px-4 py-1 bg-red-500 text-white rounded-lg hover:bg-red-600 transition"
                                                whileHover={{ scale: 1.05 }}
                                                whileTap={{ scale: 0.95 }}
                                                onClick={() => {
                                                    URL.revokeObjectURL(aadhaarImagePreview);
                                                    setAadhaarImage(null);
                                                    setAadhaarImagePreview(null);
                                                    setError('');
                                                }}
                                            >
                                                Remove Image
                                            </motion.button>
                                        </motion.div>
                                    )}
                                    <p className="mt-2 text-sm text-gray-500">
                                        Upload a clear image of your Aadhaar card. Max size: 2MB. Formats: JPEG, PNG.
                                    </p>
                                </div>
                            </motion.div>
                        )}

                        {activeStep === 4 && (
                            <motion.div
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ duration: 0.4 }}
                            >
                                <h2 className="text-xl font-bold text-gray-800 mb-6">Review & Confirm</h2>
                                
                                <div className="space-y-4">
                                    <div className="bg-gray-50 p-4 rounded-lg">
                                        <h3 className="text-sm font-medium text-gray-700">Personal Information</h3>
                                        <p className="mt-1 text-gray-600">Name: {name}</p>
                                        <p className="text-gray-600">Password: ••••••••</p>
                                    </div>
                                    <div className="bg-gray-50 p-4 rounded-lg">
                                        <h3 className="text-sm font-medium text-gray-700">Contact Information</h3>
                                        <p className="mt-1 text-gray-600">
                                            {contactMethod === 'email' ? 'Email' : 'Phone'}: {contact}
                                        </p>
                                    </div>
                                    <div className="bg-gray-50 p-4 rounded-lg">
                                        <h3 className="text-sm font-medium text-gray-700">Skills & Expertise</h3>
                                        <p className="mt-1 text-gray-600">Skills: {skills || 'None'}</p>
                                        <p className="text-gray-600">
                                            Certifications: {certifications.length > 0 ? certifications.join(', ') : 'None'}
                                        </p>
                                    </div>
                                    <div className="bg-gray-50 p-4 rounded-lg">
                                        <h3 className="text-sm font-medium text-gray-700">Aadhaar Card</h3>
                                        <p className="mt-1 text-gray-600">
                                            Aadhaar Image: {aadhaarImage ? 'Uploaded' : 'Not provided'}
                                        </p>
                                    </div>
                                </div>

                                {/* CAPTCHA Section */}
                                <div className="mt-6">
                                    <h3 className="text-sm font-medium text-gray-700 mb-2">Verify You're Not a Bot</h3>
                                    <div className="flex items-center space-x-4 bg-gray-50 p-4 rounded-lg">
                                        <span className="text-gray-700">
                                            What is {captchaNum1} + {captchaNum2}?
                                        </span>
                                        <input
                                            type="number"
                                            placeholder="Enter answer"
                                            className="w-24 p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                                            value={captchaAnswer}
                                            onChange={(e) => setCaptchaAnswer(e.target.value)}
                                        />
                                        <motion.button
                                            type="button"
                                            className="p-2 text-gray-600 hover:text-blue-600 transition"
                                            whileHover={{ scale: 1.1 }}
                                            whileTap={{ scale: 0.9 }}
                                            onClick={regenerateCaptcha}
                                        >
                                            <FiRefreshCw className="h-5 w-5" />
                                        </motion.button>
                                    </div>
                                    {captchaError && (
                                        <motion.div 
                                            className="mt-2 flex items-center p-2 bg-red-50 text-red-700 rounded-lg border border-red-200"
                                            initial={{ opacity: 0, y: -10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                        >
                                            <div className="h-5 w-5 mr-2 bg-red-100 rounded-full flex items-center justify-center">
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                                </svg>
                                            </div>
                                            <span>{captchaError}</span>
                                        </motion.div>
                                    )}
                                </div>
                            </motion.div>
                        )}

                        {error && (
                            <motion.div 
                                className="flex items-center p-3 bg-red-50 text-red-700 rounded-lg border border-red-200"
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                            >
                                <div className="h-5 w-5 mr-2 bg-red-100 rounded-full flex items-center justify-center">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </div>
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
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                    </svg>
                                    Back
                                </motion.button>
                            ) : (
                                <div></div>
                            )}

                            {activeStep < 4 ? (
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
                                            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                            </svg>
                                            Creating Account...
                                        </div>
                                    ) : (
                                        <div className="flex items-center">
                                            Complete Registration
                                            <FiArrowRight className="h-5 w-5 ml-2" />
                                        </div>
                                    )}
                                </motion.button>
                            )}
                        </div>
                    </form>
                </div>

                {/* Footer */}
                <div className="bg-gray-50 px-6 py-4 border-t border-gray-200">
                    <p className="text-sm text-center text-gray-600">
                        Already have an account?{' '}
                        <a href="/login" className="font-medium text-blue-600 hover:text-blue-500 hover:underline">
                            Login
                        </a>
                    </p>
                </div>
            </motion.div>
        </div>
    );
}