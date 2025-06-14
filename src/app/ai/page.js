'use client';

import { motion } from 'framer-motion';
import { FiActivity, FiSend, FiThermometer, FiDroplet, FiWind, FiAlertTriangle, FiMapPin, FiCheckSquare } from 'react-icons/fi';
import { useState, useEffect, useRef } from 'react';
import { getNearestCity } from '../utils/cities';

export default function AIChatPage() {
  const [userLocation, setUserLocation] = useState({ city: null, lat: null, lon: null });
  const [permissionRequested, setPermissionRequested] = useState(false);
  const [weatherData, setWeatherData] = useState(null);
  const [forecastSummary, setForecastSummary] = useState([]);
  const [riskLevel, setRiskLevel] = useState(null);
  const [riskExplanation, setRiskExplanation] = useState('');
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const messagesEndRef = useRef(null);

  // Request geolocation permission
  useEffect(() => {
    if (!permissionRequested) {
      setPermissionRequested(true);
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            const { latitude, longitude } = position.coords;
            const city = getNearestCity(latitude, longitude);
            setUserLocation({ city, lat: latitude, lon: longitude });
          },
          (err) => {
            console.error('Geolocation error:', err);
            setUserLocation({ city: 'Unknown', lat: 0, lon: 0 });
            setMessages((prev) => [
              ...prev,
              { sender: 'AI', text: 'I couldn’t access your location due to a permission error or timeout. I’ll assume an unknown location for now. How can I assist you with weather analysis or disaster preparedness?' },
            ]);
          },
          { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
        );
      } else {
        setUserLocation({ city: 'Unknown', lat: 0, lon: 0 });
        setMessages((prev) => [
          ...prev,
          { sender: 'AI', text: 'Geolocation is not supported by your browser. I’ll assume an unknown location. How can I assist you with weather analysis or disaster preparedness?' },
        ]);
      }
    }
  }, [permissionRequested]);

  // Fetch weather data when location is available
  useEffect(() => {
    if (userLocation.lat !== null && userLocation.lon !== null && userLocation.city && userLocation.city !== 'Unknown') {
      const fetchWeatherData = async () => {
        try {
          const response = await fetch(
            `https://api.open-meteo.com/v1/forecast?latitude=${userLocation.lat}&longitude=${userLocation.lon}&current=temperature_2m,relative_humidity_2m,precipitation,wind_speed_10m,pressure_msl&daily=temperature_2m_max,temperature_2m_min,precipitation_sum,wind_speed_10m_max,relative_humidity_2m_max&timezone=Asia/Kolkata`
          );
          if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
          }
          const data = await response.json();
          setWeatherData(data);

          // Analyze current weather conditions
          const currentTemp = data.current?.temperature_2m ?? 0;
          const currentPrecip = data.current?.precipitation ?? 0;
          const currentWind = data.current?.wind_speed_10m ?? 0;
          const currentHumidity = data.current?.relative_humidity_2m ?? 0;
          const currentPressure = data.current?.pressure_msl ?? 0;

          // Analyze 7-day forecast
          const forecast = [];
          let extremeTempDays = 0;
          let heavyRainDays = 0;
          let highWindDays = 0;
          let highHumidityDays = 0;
          let pressureDrop = false;

          if (data.daily) {
            for (let i = 0; i < 7; i++) {
              const maxTemp = data.daily.temperature_2m_max?.[i] ?? 0;
              const minTemp = data.daily.temperature_2m_min?.[i] ?? 0;
              const precip = data.daily.precipitation_sum?.[i] ?? 0;
              const wind = data.daily.wind_speed_10m_max?.[i] ?? 0;
              const humidity = data.daily.relative_humidity_2m_max?.[i] ?? 0;

              forecast.push({
                date: new Date(data.daily.time?.[i] ?? Date.now()).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }),
                maxTemp,
                minTemp,
                precip,
                wind,
                humidity,
              });

              if (maxTemp > 35 || minTemp < 0) extremeTempDays++;
              if (precip > 10) heavyRainDays++;
              if (wind > 50) highWindDays++;
              if (humidity > 85) highHumidityDays++;
              if (i > 0 && data.daily.time?.[i] && currentPressure - (data.daily.pressure_msl?.[i] ?? currentPressure) > 5) pressureDrop = true;
            }
          }
          setForecastSummary(forecast);

          // Predict potential weather risks
          let riskFactors = [];
          let predictedRisks = [];
          if (currentTemp > 35) riskFactors.push('extreme heat');
          if (currentTemp < 0) riskFactors.push('extreme cold');
          if (currentPrecip > 10) riskFactors.push('heavy rainfall');
          if (currentWind > 50) riskFactors.push('high winds');
          if (currentHumidity > 85) riskFactors.push('high humidity');
          if (currentPressure < 980) riskFactors.push('low pressure');

          let forecastRiskFactors = [];
          if (extremeTempDays > 2) forecastRiskFactors.push(`${extremeTempDays} days of extreme temperature`);
          if (heavyRainDays > 2) {
            forecastRiskFactors.push(`${heavyRainDays} days of heavy rainfall`);
            predictedRisks.push('Potential flooding risk due to sustained heavy rainfall.');
          }
          if (highWindDays > 2) {
            forecastRiskFactors.push(`${highWindDays} days of high winds`);
            predictedRisks.push('Potential for wind-related damage (e.g., fallen trees, power outages).');
          }
          if (highHumidityDays > 2) forecastRiskFactors.push(`${highHumidityDays} days of high humidity`);
          if (pressureDrop) {
            forecastRiskFactors.push('significant pressure drop');
            predictedRisks.push('Potential for storm or cyclone development due to rapid pressure drop.');
          }

          let risk = 'None';
          let explanation = 'No significant weather risks detected for disaster response planning.';

          if (riskFactors.length > 0 || forecastRiskFactors.length > 0) {
            if (riskFactors.length >= 2 || (riskFactors.length === 1 && forecastRiskFactors.length >= 2)) {
              risk = 'High';
              explanation = `High risk due to current conditions (${riskFactors.join(', ')}) and forecast (${forecastRiskFactors.join(', ')}). Immediate action may be required.\n\n**Predicted Risks:**\n${predictedRisks.join('\n')}`;
            } else if (riskFactors.length === 1 || forecastRiskFactors.length >= 1) {
              risk = 'Medium';
              explanation = `Medium risk due to ${riskFactors.length > 0 ? `current conditions (${riskFactors.join(', ')})` : ''}${riskFactors.length > 0 && forecastRiskFactors.length > 0 ? ' and ' : ''}${forecastRiskFactors.length > 0 ? `forecast (${forecastRiskFactors.join(', ')})` : ''}. Monitor the situation closely.\n\n**Predicted Risks:**\n${predictedRisks.join('\n') || 'No specific risks predicted.'}`;
            } else {
              risk = 'Low';
              explanation = `Low risk with minor concerns (${[...riskFactors, ...forecastRiskFactors].join(', ')}). Stay prepared but no immediate action required.`;
            }
          }

          setRiskLevel(risk);
          setRiskExplanation(explanation);

          // Initial AI message with weather analysis
          setMessages((prev) => [
            ...prev,
            {
              sender: 'AI',
              text: `Hello! I’m your AI Weather Assistant for disaster response planning. I’ve analyzed the weather in ${userLocation.city} as of ${new Date().toLocaleString('en-US', { timeZone: 'Asia/Kolkata', hour: 'numeric', minute: 'numeric', hour12: true })} on Saturday, May 31, 2025.\n\n**Current Weather:**\n- Temperature: ${currentTemp}°C\n- Precipitation: ${currentPrecip} mm\n- Wind Speed: ${currentWind} km/h\n- Humidity: ${currentHumidity}%\n- Pressure: ${currentPressure} hPa\n\n**Risk Level:** ${risk}\n${explanation}\n\nWhat would you like to know more about? You can ask about the forecast, disaster preparedness, or generate a preparedness checklist!`,
            },
          ]);
        } catch (error) {
          console.error('Error fetching weather data:', error);
          setRiskLevel('None');
          setRiskExplanation('Unable to fetch weather data due to a network or API error.');
          setMessages((prev) => [
            ...prev,
            { sender: 'AI', text: `I couldn’t fetch the weather data for ${userLocation.city} due to a network or API error: ${error.message}. Please try again later or let me know how I can assist you!` },
          ]);
        }
      };

      fetchWeatherData();
    }
  }, [userLocation]);

  // Scroll to the latest message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Generate a disaster preparedness checklist
  const generateChecklist = () => {
    let checklist = [];
    if (riskLevel === 'High' || riskLevel === 'Medium') {
      checklist.push('Prepare an emergency kit (water, food, flashlight, batteries, first aid kit).');
      checklist.push('Create a family communication plan.');
      checklist.push('Identify the nearest emergency shelter or evacuation route.');
      checklist.push('Secure heavy objects and outdoor furniture.');
    }

    if (forecastSummary.some((day) => day.precip > 10)) {
      checklist.push('Ensure proper drainage around your home to prevent flooding.');
      checklist.push('Stock up on sandbags or flood barriers if in a flood-prone area.');
    }
    if (forecastSummary.some((day) => day.maxTemp > 35)) {
      checklist.push('Stay hydrated and avoid outdoor activities during peak heat hours.');
      checklist.push('Ensure access to cooling centers or air-conditioned spaces.');
    }
    if (forecastSummary.some((day) => day.minTemp < 0)) {
      checklist.push('Insulate your home and ensure heating systems are functional.');
      checklist.push('Stock up on blankets and warm clothing.');
    }
    if (forecastSummary.some((day) => day.wind > 50)) {
      checklist.push('Secure windows and doors to protect against high winds.');
      checklist.push('Avoid parking under trees or near power lines.');
    }
    if (forecastSummary.some((day) => day.humidity > 85)) {
      checklist.push('Use dehumidifiers to prevent mold growth.');
      checklist.push('Ensure proper ventilation in enclosed spaces.');
    }

    if (checklist.length === 0) {
      checklist.push('No specific preparations needed based on current weather data.');
      checklist.push('Stay informed by monitoring local weather updates.');
    }

    return checklist;
  };

  // Handle user message
  const sendMessage = () => {
    if (!newMessage.trim()) return;

    // Add user's message to the chat
    setMessages((prev) => [...prev, { sender: 'User', text: newMessage }]);

    // Process the user's message
    const message = newMessage.toLowerCase();
    let aiResponse = '';

    if (message.includes('weather') || message.includes('today') || message.includes('current')) {
      if (weatherData) {
        aiResponse = `Here’s the current weather in ${userLocation.city ?? 'your location'} as of ${new Date().toLocaleString('en-US', { timeZone: 'Asia/Kolkata', hour: 'numeric', minute: 'numeric', hour12: true })}:\n\n- Temperature: ${weatherData.current?.temperature_2m ?? 'N/A'}°C\n- Precipitation: ${weatherData.current?.precipitation ?? 'N/A'} mm\n- Wind Speed: ${weatherData.current?.wind_speed_10m ?? 'N/A'} km/h\n- Humidity: ${weatherData.current?.relative_humidity_2m ?? 'N/A'}%\n- Pressure: ${weatherData.current?.pressure_msl ?? 'N/A'} hPa\n\n**Risk Level:** ${riskLevel ?? 'N/A'}\n${riskExplanation}`;
      } else {
        aiResponse = 'I don’t have the current weather data right now. Please try again later!';
      }
    } else if (message.includes('forecast') || message.includes('week')) {
      if (forecastSummary.length > 0) {
        let forecastText = `Here’s the 7-day weather forecast for ${userLocation.city ?? 'your location'}:\n\n`;
        forecastSummary.forEach((day) => {
          forecastText += `${day.date}: Temp ${day.minTemp}°C - ${day.maxTemp}°C, Precip ${day.precip} mm, Wind ${day.wind} km/h, Humidity ${day.humidity}%\n`;
        });
        aiResponse = forecastText + `\n**Risk Level (based on forecast):** ${riskLevel ?? 'N/A'}\n${riskExplanation}`;
      } else {
        aiResponse = 'I don’t have the forecast data right now. Please try again later!';
      }
    } else if (message.includes('safe') || message.includes('disaster') || message.includes('prepare')) {
      if (riskLevel) {
        let advice = '';
        if (riskLevel === 'High') {
          advice = 'Immediate action is recommended. Prepare emergency kits, secure structures, and stay updated with local authorities. Avoid unnecessary travel.';
        } else if (riskLevel === 'Medium') {
          advice = 'Monitor the situation closely. Prepare emergency supplies, check on vulnerable individuals, and be ready to act if conditions worsen.';
        } else if (riskLevel === 'Low') {
          advice = 'Stay prepared with basic supplies, but no immediate action is required. Keep an eye on weather updates.';
        } else {
          advice = 'No immediate preparations are needed. Continue with normal activities but stay aware of weather changes.';
        }
        aiResponse = `Based on the current risk level (${riskLevel}), here’s my advice for disaster preparedness:\n\n${advice}`;
      } else {
        aiResponse = 'I don’t have enough data to assess safety right now. Please try again later!';
      }
    } else if (message.includes('checklist') || message.includes('list')) {
      const checklist = generateChecklist();
      aiResponse = `Here’s your personalized disaster preparedness checklist for ${userLocation.city ?? 'your location'} based on the current and forecasted weather:\n\n${checklist.map((item, index) => `${index + 1}. ${item}`).join('\n')}`;
    } else {
      aiResponse = 'I can help with weather analysis, disaster preparedness, or generating a preparedness checklist! Try asking about the current weather, the forecast, disaster safety, or type "checklist" to get a personalized preparedness list.';
    }

    // Add AI's response to the chat
    setMessages((prev) => [...prev, { sender: 'AI', text: aiResponse }]);
    setNewMessage('');
  };

  return (
    <motion.div
      className="flex flex-col items-center min-h-screen p-4"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <div className="bg-gradient-to-r from-blue-600 to-teal-600 p-5 rounded-full mb-6">
        <FiActivity size={40} className="text-white" />
      </div>
      <h2 className="text-3xl font-bold text-gray-800 mb-4">AI Weather Assistant</h2>
      <p className="text-gray-600 max-w-md text-center mb-8">
        AI-powered weather analysis and disaster preparedness for effective response planning
      </p>

      {/* Weather Overview */}
      {weatherData && (
        <motion.div
          className="w-full max-w-md bg-white rounded-xl shadow-md p-4 mb-4"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
        >
          <h3 className="text-lg font-semibold text-gray-800 mb-2">Current Weather in {userLocation.city}</h3>
          <div className="flex items-center space-x-4">
            <FiThermometer className="text-blue-600" size={24} />
            <span>{weatherData.current?.temperature_2m ?? 'N/A'}°C</span>
            <FiDroplet className="text-blue-600" size={24} />
            <span>{weatherData.current?.precipitation ?? 'N/A'} mm</span>
            <FiWind className="text-blue-600" size={24} />
            <span>{weatherData.current?.wind_speed_10m ?? 'N/A'} km/h</span>
          </div>
          <div className="mt-2 flex items-center">
            <FiAlertTriangle className="text-red-600 mr-2" size={20} />
            <span>Risk Level: {riskLevel ?? 'N/A'}</span>
          </div>
        </motion.div>
      )}

      {/* Chat Area */}
      <div className="w-full max-w-md bg-white rounded-xl shadow-md p-4 mb-6">
        <div className="h-96 overflow-y-auto p-4">
          {messages.map((msg, index) => (
            <div
              key={index}
              className={`mb-4 ${msg.sender === 'User' ? 'text-right' : 'text-left'}`}
            >
              <div
                className={`inline-block p-3 rounded-lg ${
                  msg.sender === 'User'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-800'
                }`}
              >
                <div className="text-sm font-semibold">{msg.sender}</div>
                <div className="whitespace-pre-line">{msg.text}</div>
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
        <div className="flex items-center p-2 border-t border-gray-200">
          <input
            type="text"
            placeholder="Ask about weather, preparedness, or type 'checklist'..."
            className="flex-1 px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
          />
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="ml-2 px-4 py-2 bg-blue-600 text-white rounded-xl flex items-center"
            onClick={sendMessage}
          >
            <FiSend />
          </motion.button>
        </div>
      </div>

      {/* Checklist Button */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className="px-6 py-3 bg-gradient-to-r from-blue-600 to-teal-600 text-white rounded-xl flex items-center"
        onClick={() => {
          const checklist = generateChecklist();
          setMessages((prev) => [
            ...prev,
            { sender: 'AI', text: `Here’s your personalized disaster preparedness checklist for ${userLocation.city ?? 'your location'} based on the current and forecasted weather:\n\n${checklist.map((item, index) => `${index + 1}. ${item}`).join('\n')}` },
          ]);
        }}
      >
        <FiCheckSquare className="mr-2" /> Generate Preparedness Checklist
      </motion.button>
    </motion.div>
  );
}