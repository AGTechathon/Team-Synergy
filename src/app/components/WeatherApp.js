'use client';

import React, { useState, useEffect } from 'react';

const WeatherApp = () => {
  const [city, setCity] = useState('');
  const [weatherData, setWeatherData] = useState(null);
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(true);
  const [locationAccess, setLocationAccess] = useState(true);
  const [selectedRegion, setSelectedRegion] = useState('current');
  const [expandedView, setExpandedView] = useState(false);

  const apiKey = "9f14cc007c89c3c22fc2ebcaddfc6c34";
  const apiURL = "https://api.openweathermap.org/data/2.5/weather?units=metric";

  // Sample agricultural regions - you can expand this list
  const regions = [
    { id: 'current', name: 'My Location' },
    { id: 'solapur', name: 'Solapur, IN' },
    { id: 'maharashtra', name: 'Maharashtra, IN' },
    { id: 'karnataka', name: 'Karnataka, IN' },
    { id: 'punjab', name: 'Punjab, IN' },
    { id: 'andhra', name: 'Andhra Pradesh, IN' },
    { id: 'usa', name: 'United States' },
    { id: 'brazil', name: 'Brazil' },
  ];

  const getCoordinatesForRegion = (regionId) => {
    switch (regionId) {
      case 'solapur': return { lat: 17.6599, lon: 75.9064 };
      case 'maharashtra': return { lat: 19.7515, lon: 75.7139 };
      case 'karnataka': return { lat: 15.3173, lon: 75.7139 };
      case 'punjab': return { lat: 31.1471, lon: 75.3412 };
      case 'andhra': return { lat: 15.9129, lon: 79.7400 };
      case 'usa': return { lat: 37.0902, lon: -95.7129 };
      case 'brazil': return { lat: -14.2350, lon: -51.9253 };
      default: return null;
    }
  };

  const getWeatherIcon = (weatherMain) => {
    const icons = {
      Clouds: "https://cdn-icons-png.flaticon.com/512/1146/1146869.png",
      Clear: "https://cdn-icons-png.flaticon.com/512/979/979585.png",
      Rain: "https://cdn-icons-png.flaticon.com/512/1163/1163657.png",
      Thunderstorm: "https://cdn-icons-png.flaticon.com/512/1146/1146866.png",
      Drizzle: "https://cdn-icons-png.flaticon.com/512/1146/1146867.png",
      Snow: "https://cdn-icons-png.flaticon.com/512/1146/1146868.png",
      Mist: "https://cdn-icons-png.flaticon.com/512/1146/1146871.png",
    };
    return icons[weatherMain] || "https://cdn-icons-png.flaticon.com/512/1146/1146869.png";
  };

  const checkWeather = async (lat, lon, cityName) => {
    setLoading(true);
    setError(false);

    try {
      let url = `${apiURL}&appid=${apiKey}`;
      if (lat && lon) {
        url += `&lat=${lat}&lon=${lon}`;
      } else if (cityName && cityName.trim()) {
        url += `&q=${encodeURIComponent(cityName.trim())}`;
      } else {
        url += `&q=solapur,in`;
      }

      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();

      if (response.status === 404 || !data) {
        setError(true);
        setWeatherData(null);
      } else {
        setWeatherData(data);
        setError(false);
      }
    } catch (err) {
      console.error('Weather API Error:', err);
      setError(true);
      setWeatherData(null);
    } finally {
      setLoading(false);
    }
  };

  const handleRegionChange = (e) => {
    const region = e.target.value;
    setSelectedRegion(region);

    if (region === 'current') {
      getUserLocation();
    } else {
      const coords = getCoordinatesForRegion(region);
      checkWeather(coords.lat, coords.lon);
    }
  };

  const getUserLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          if (position && position.coords) {
            checkWeather(position.coords.latitude, position.coords.longitude);
            setLocationAccess(true);
          } else {
            checkWeather(17.6599, 75.9064);
            setLocationAccess(false);
          }
        },
        (error) => {
          console.error('Geolocation error:', error);
          checkWeather(17.6599, 75.9064);
          setLocationAccess(false);
        }
      );
    } else {
      checkWeather(17.6599, 75.9064);
      setLocationAccess(false);
    }
  };

  useEffect(() => {
    // Add a delay to ensure DOM is ready
    const timer = setTimeout(() => {
      getUserLocation();
    }, 100);

    return () => clearTimeout(timer);
  }, []);

  const getWeatherBackground = () => {
    if (!weatherData) return 'linear-gradient(135deg, #4b6cb7, #182848)';

    const temp = weatherData.main.temp;
    if (temp > 30) return 'linear-gradient(135deg, #f46b45, #eea849)';
    if (temp > 20) return 'linear-gradient(135deg, #56ccf2, #2f80ed)';
    return 'linear-gradient(135deg, #1d2b64, #f8cdda)';
  };

  const getAgriculturalImpact = () => {
    if (!weatherData || !weatherData.weather || !weatherData.weather[0] || !weatherData.main) {
      return 'Loading agricultural data...';
    }

    const weather = weatherData.weather[0].main;
    const temp = weatherData.main.temp;
    const humidity = weatherData.main.humidity;

    if (weather === 'Rain') {
      return humidity > 80 ? 'Heavy rainfall - Monitor for waterlogging' : 'Good for irrigation';
    }
    if (temp > 35) return 'High temperature - Consider shade nets';
    if (temp < 10) return 'Low temperature - Protect sensitive crops';
    if (humidity < 30) return 'Low humidity - Irrigation recommended';

    return 'Favorable conditions for most crops';
  };

  return (
    <>
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        .weatherCard {
          width: 90%;
          color: #fff;
          margin: 20px auto;
          border-radius: 20px;
          padding: 20px;
          text-align: center;
          box-shadow: 0 10px 20px rgba(255, 255, 255, 0.2);
          transition: all 0.3s ease;
          font-family: "Segoe UI", Tahoma, Geneva, Verdana, sans-serif;
          max-width: ${expandedView ? '500px' : '350px'};
          background: ${getWeatherBackground()};
        }

        .weatherHeader {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 15px;
        }

        .weatherTitle {
          margin: 0;
          font-size: 1.4rem;
          font-weight: 600;
          color: #fff;
          text-shadow: 1px 1px 3px rgb(0, 0, 0);
        }

        .toggleButton {
          background: rgb(0, 0, 0);
          border: none;
          color: #fff;
          border-radius: 50%;
          width: 30px;
          height: 30px;
          font-size: 1.2rem;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s;
        }

        .searchContainer {
          margin-bottom: 15px;
        }

        .regionSelect {
          width: 100%;
          padding: 10px;
          border-radius: 25px;
          border: none;
          margin-bottom: 10px;
          font-size: 14px;
          outline: none;
        }

        .searchWrapper {
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .searchInput {
          border: 0;
          outline: 0;
          background-color: rgba(255, 255, 255, 0.9);
          color: #000;
          padding: 10px 20px;
          height: 40px;
          border-radius: 25px;
          flex: 1;
          margin-right: 10px;
          font-size: 14px;
        }

        .searchButton {
          border: 0;
          outline: 0;
          height: 40px;
          width: 40px;
          border-radius: 50%;
          cursor: pointer;
          background-color: rgba(255,255,255,0.9);
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 2px 5px rgb(7, 0, 0);
        }

        .searchIcon {
          width: 18px;
          height: 18px;
        }

        .errorMessage {
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 14px;
          padding: 10px;
          background-color: rgb(5, 0, 0);
          border-radius: 10px;
          margin: 10px 0;
          color: #ffcccc;
        }

        .errorIcon {
          width: 20px;
          height: 20px;
          margin-right: 8px;
          filter: brightness(0) invert(1);
        }

        .loadingContainer {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 20px;
        }

        .spinner {
          border: 4px solid rgb(0, 0, 0);
          border-radius: 50%;
          border-top: 4px solid #fff;
          width: 30px;
          height: 30px;
          animation: spin 1s linear infinite;
          margin-bottom: 10px;
        }

        .weatherDisplay {
          display: flex;
          flex-direction: column;
          align-items: center;
        }

        .mainInfo {
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 10px 0;
        }

        .weatherIcon {
          width: 80px;
          height: 80px;
          margin-right: 15px;
          filter: drop-shadow(2px 2px 4px rgb(0, 0, 0));
        }

        .temperature {
          font-size: 2.5rem;
          font-weight: bold;
          margin: 5px 0;
          text-shadow: 2px 2px 4px rgb(10, 0, 0);
        }

        .cityName {
          font-size: 1.5rem;
          margin: 5px 0;
          font-weight: 500;
          color: #8b0000;
        }

        .weatherDescription {
          font-size: 0.9rem;
          margin: 5px 0;
          text-transform: capitalize;
          opacity: 0.9;
        }

        .agriculturalInfo {
          background-color: rgb(0, 0, 0);
          border-radius: 10px;
          padding: 10px;
          margin: 10px 0;
          width: 100%;
        }

        .impactText {
          margin: 5px 0;
          font-size: 0.9rem;
          line-height: 1.4;
        }

        .extraDetails {
          display: flex;
          justify-content: space-between;
          margin-top: 10px;
        }

        .extraDetail {
          display: flex;
          flex-direction: column;
          font-size: 0.8rem;
        }

        .weatherDetails {
          display: flex;
          justify-content: space-between;
          width: 100%;
          margin: 15px 0;
          padding: 10px 0;
          border-top: 1px solid rgb(0, 0, 0);
        }

        .detailColumn {
          display: flex;
          align-items: center;
          justify-content: center;
          flex: 1;
        }

        .detailIcon {
          width: 30px;
          height: 30px;
          margin-right: 10px;
          filter: brightness(0) invert(1);
        }

        .detailText {
          text-align: left;
        }

        .detailValue {
          font-size: 1.1rem;
          font-weight: 600;
          margin: 0;
        }

        .detailLabel {
          font-size: 0.8rem;
          opacity: 0.8;
          margin: 2px 0 0;
        }        /* Responsive Design */
        @media (min-width: 992px) {
          .weatherCard {
            width: 100%;
            max-width: 400px;
            margin: 0 auto;
          }
        }

        @media (min-width: 600px) and (max-width: 991px) {
          .weatherCard {
            width: 100%;
            max-width: 400px;
            margin: 20px auto;
          }
        }

        @media (max-width: 599px) {
          .weatherCard {
            width: 95%;
            padding: 15px;
            margin: 10px auto;
          }
          
          .weatherTitle {
            font-size: 1.2rem;
          }
          
          .temperature {
            font-size: 2rem;
          }
          
          .cityName {
            font-size: 1.2rem;
          }
          
          .weatherIcon {
            width: 60px;
            height: 60px;
            margin-right: 10px;
          }
          
          .extraDetails {
            flex-direction: column;
            gap: 5px;
          }
          
          .extraDetail {
            flex-direction: row;
            justify-content: space-between;
          }
        }
      `}</style>

      <div className="weatherCard">
        <div className="weatherHeader">
          <h3 className="weatherTitle">Weather Updates</h3>
          <button
            onClick={() => setExpandedView(!expandedView)}
            className="toggleButton"
          >
            {expandedView ? '−' : '+'}
          </button>
        </div>

        <div className="searchContainer">
          <select
            value={selectedRegion}
            onChange={handleRegionChange}
            className="regionSelect"
          >
            {regions.map(region => (
              <option key={region.id} value={region.id}>{region.name}</option>
            ))}
          </select>

          <div className="searchWrapper">
            <input
              type="text"
              placeholder="Or enter city name..."
              value={city}
              onChange={(e) => setCity(e.target.value)}
              onKeyPress={(e) => {
              if (e.key === 'Enter' && city.trim()) {
                checkWeather(null, null, city);
              }
            }}
              className="searchInput"
            />
            <button
              onClick={() => {
                if (city.trim()) {
                  checkWeather(null, null, city);
                }
              }}
              className="searchButton"
            >
              <img
                src="https://cdn-icons-png.flaticon.com/512/751/751463.png"
                alt="Search"
                className="searchIcon"
              />
            </button>
          </div>
        </div>

        {error && (
          <div className="errorMessage">
            <img
              src="https://cdn-icons-png.flaticon.com/512/564/564619.png"
              className="errorIcon"
              alt="Error"
            />
            Invalid location. Try another city or region.
          </div>
        )}

        {loading ? (
          <div className="loadingContainer">
            <div className="spinner"></div>
            <p>Loading weather data...</p>
          </div>
        ) : weatherData && weatherData.main && weatherData.weather && weatherData.weather[0] && (
          <div className="weatherDisplay">
            <div className="mainInfo">
              <img
                src={getWeatherIcon(weatherData.weather[0].main)}
                alt="Weather icon"
                className="weatherIcon"
              />
              <div>
                <h1 className="temperature">{Math.round(weatherData.main.temp)}°C</h1>
                <h2 className="cityName">{weatherData.name}</h2>
                <p className="weatherDescription">{weatherData.weather[0].description}</p>
              </div>
            </div>

            {expandedView && (
              <div className="agriculturalInfo">
                <p className="impactText">
                  <strong>Agricultural Impact:</strong> {getAgriculturalImpact()}
                </p>
                <div className="extraDetails">
                  <div className="extraDetail">
                    <span>Feels Like</span>
                    <strong>{Math.round(weatherData.main.feels_like)}°C</strong>
                  </div>
                  <div className="extraDetail">
                    <span>Min/Max</span>
                    <strong>
                      {Math.round(weatherData.main.temp_min)}° / {Math.round(weatherData.main.temp_max)}°
                    </strong>
                  </div>
                  <div className="extraDetail">
                    <span>Pressure</span>
                    <strong>{weatherData.main.pressure} hPa</strong>
                  </div>
                </div>
              </div>
            )}

            <div className="weatherDetails">
              <div className="detailColumn">
                <img
                  src="https://cdn-icons-png.flaticon.com/512/1582/1582886.png"
                  alt="Humidity"
                  className="detailIcon"
                />
                <div className="detailText">
                  <p className="detailValue">{weatherData.main.humidity}%</p>
                  <p className="detailLabel">Humidity</p>
                </div>
              </div>

              <div className="detailColumn">
                <img
                  src="https://cdn-icons-png.flaticon.com/512/172/172922.png"
                  alt="Wind"
                  className="detailIcon"
                />
                <div className="detailText">
                  <p className="detailValue">{weatherData.wind.speed} km/h</p>
                  <p className="detailLabel">Wind</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default WeatherApp;
