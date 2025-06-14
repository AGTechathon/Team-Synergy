'use client';

import { motion } from 'framer-motion';
import { FiActivity, FiSend, FiUsers, FiPlus, FiMapPin } from 'react-icons/fi';
import { useState, useEffect, useRef } from 'react';
import { getNearestCity } from '../utils/cities';

export default function LiveChatPage() {
  const [userLocation, setUserLocation] = useState({ city: null, lat: null, lon: null });
  const [permissionRequested, setPermissionRequested] = useState(false);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [groups, setGroups] = useState([]);
  const [currentGroup, setCurrentGroup] = useState(null); // Will be set to city group
  const [users, setUsers] = useState([]);
  const [newGroupName, setNewGroupName] = useState('');
  const [ws, setWs] = useState(null);
  const [username, setUsername] = useState('');
  const messagesEndRef = useRef(null);


  useEffect(() => {
    let user = prompt('Enter your username:') || `User${Math.floor(Math.random() * 1000)}`;
    localStorage.setItem('username', user);
    setUsername(user);
}, []);

  // Request geolocation permission and initialize WebSocket
  useEffect(() => {

    // Request geolocation permission
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
            alert('Unable to access your location. Defaulting to "Unknown" city.');
            setUserLocation({ city: 'Unknown', lat: 0, lon: 0 });
          },
          { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
        );
      } else {
        alert('Geolocation is not supported by your browser. Defaulting to "Unknown" city.');
        setUserLocation({ city: 'Unknown', lat: 0, lon: 0 });
      }
    }

    // Initialize WebSocket
    const websocket = new WebSocket('ws://localhost:8080');
    setWs(websocket);

    websocket.onopen = () => {
      console.log('WebSocket connected');
    };

    websocket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === 'message') {
        setMessages((prev) => [...prev, data]);
      } else if (data.type === 'users') {
        setUsers(data.users);
      } else if (data.type === 'groups') {
        setGroups(data.groups);
      }
    };

    websocket.onclose = () => {
      console.log('WebSocket disconnected');
    };

    return () => {
      websocket.close();
    };
  }, [permissionRequested]);

  // When userLocation is set, create/join the default city group
  useEffect(() => {
    if (ws && ws.readyState === WebSocket.OPEN && userLocation.city) {
      const defaultGroup = `${userLocation.city} Group`;
      setCurrentGroup(defaultGroup);

      // Create the default group if it doesn't exist
      ws.send(JSON.stringify({
        type: 'createGroup',
        groupName: defaultGroup,
        username,
        city: userLocation.city,
      }));

      // Join the default group
      ws.send(JSON.stringify({
        type: 'join',
        username,
        city: userLocation.city,
        group: defaultGroup,
      }));
    }
  }, [userLocation.city, ws, username]);

  // Scroll to the latest message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Send a message
  const sendMessage = () => {
    if (newMessage.trim() && ws && ws.readyState === WebSocket.OPEN) {
      const message = {
        type: 'message',
        username,
        text: newMessage,
        city: userLocation.city,
        group: currentGroup,
        timestamp: new Date().toLocaleTimeString('en-US', { timeZone: 'Asia/Kolkata' }),
      };
      ws.send(JSON.stringify(message));
      setNewMessage('');
    }
  };

  // Create a new group
  const createGroup = () => {
    if (newGroupName.trim() && ws && ws.readyState === WebSocket.OPEN) {
      const groupMessage = {
        type: 'createGroup',
        groupName: newGroupName,
        username,
        city: userLocation.city,
      };
      ws.send(JSON.stringify(groupMessage));
      setNewGroupName('');
    }
  };

  // Join a group
  const joinGroup = (groupName) => {
    if (ws && ws.readyState === WebSocket.OPEN) {
      setCurrentGroup(groupName);
      ws.send(JSON.stringify({
        type: 'join',
        username,
        city: userLocation.city,
        group: groupName,
      }));
      setMessages([]); // Clear messages when switching groups
    }
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
      <h2 className="text-3xl font-bold text-gray-800 mb-4">Live Chat</h2>
      <p className="text-gray-600 max-w-md text-center mb-8">
        Real-time communication with disaster response teams and volunteers
      </p>

      {/* Location Info */}
      {userLocation.city && (
        <div className="flex items-center text-gray-600 mb-4">
          <FiMapPin className="mr-2" />
          <span>You are chatting from: {userLocation.city}</span>
        </div>
      )}

      {/* Group Creation and Selection */}
      <div className="w-full max-w-md mb-6">
        <div className="flex items-center mb-4">
          <input
            type="text"
            placeholder="New group name"
            className="flex-1 px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500"
            value={newGroupName}
            onChange={(e) => setNewGroupName(e.target.value)}
          />
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="ml-2 px-4 py-2 bg-blue-600 text-white rounded-xl flex items-center"
            onClick={createGroup}
          >
            <FiPlus className="mr-2" />
            Create Group
          </motion.button>
        </div>
        <div className="flex flex-wrap gap-2">
          {groups.map((group) => (
            <motion.button
              key={group}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className={`px-4 py-2 rounded-xl ${
                currentGroup === group
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-700'
              }`}
              onClick={() => joinGroup(group)}
            >
              {group}
            </motion.button>
          ))}
        </div>
      </div>

      {/* User List */}
      <div className="w-full max-w-md mb-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-2 flex items-center">
          <FiUsers className="mr-2" />
          Online Users ({users.length})
        </h3>
        <div className="bg-gray-50 p-4 rounded-xl max-h-32 overflow-y-auto">
          {users.length > 0 ? (
            users.map((user, index) => (
              <div key={index} className="text-gray-700">
                {user.username} ({user.city})
              </div>
            ))
          ) : (
            <div className="text-gray-500">No users online</div>
          )}
        </div>
      </div>

      {/* Chat Area */}
      <div className="w-full max-w-md bg-white rounded-xl shadow-md p-4 mb-6">
        <div className="h-96 overflow-y-auto p-4">
          {messages.map((msg, index) => (
            <div
              key={index}
              className={`mb-4 ${
                msg.username === username ? 'text-right' : 'text-left'
              }`}
            >
              <div
                className={`inline-block p-3 rounded-lg ${
                  msg.username === username
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-800'
                }`}
              >
                <div className="text-sm font-semibold">{msg.username}</div>
                <div>{msg.text}</div>
                <div className="text-xs text-gray-400 mt-1">{msg.timestamp}</div>
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
        <div className="flex items-center p-2 border-t border-gray-200">
          <input
            type="text"
            placeholder="Type a message..."
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
    </motion.div>
  );
}