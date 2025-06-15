const WebSocket = require('ws');

const wss = new WebSocket.Server({ port: 8080 });

const users = new Map(); // Map of user IDs to { ws, username, city, group }
const groups = new Set(); // Set of group names

wss.on('connection', (ws) => {
  console.log('New client connected');

  ws.on('message', (message) => {
    let data;
    try {
      data = JSON.parse(message);
    } catch (err) {
      console.error('Invalid message format:', message);
      return;
    }

    const userId = ws._id || Date.now().toString();
    ws._id = userId;

    if (data.type === 'join') {
      // Create a default group for the user's city if it doesn't exist
      const defaultGroup = `${data.city} Group`;
      groups.add(defaultGroup);

      users.set(userId, { ws, username: data.username, city: data.city, group: data.group });

      // Broadcast updated user list
      const userList = Array.from(users.values()).map(user => ({
        username: user.username,
        city: user.city,
      }));
      broadcast({ type: 'users', users: userList });

      // Broadcast updated group list
      broadcast({ type: 'groups', groups: Array.from(groups) });
    } else if (data.type === 'createGroup') {
      groups.add(data.groupName);
      broadcast({ type: 'groups', groups: Array.from(groups) });
    } else if (data.type === 'message') {
      const user = users.get(userId);
      if (user) {
        const message = {
          type: 'message',
          username: data.username,
          text: data.text,
          city: data.city,
          group: data.group,
          timestamp: data.timestamp,
        };

        // Broadcast message to users in the same group
        users.forEach((client, id) => {
          if (
            client.ws.readyState === WebSocket.OPEN &&
            client.group === data.group
          ) {
            client.ws.send(JSON.stringify(message));
          }
        });
      }
    }
  });

  ws.on('close', () => {
    users.delete(ws._id);
    // Broadcast updated user list
    const userList = Array.from(users.values()).map(user => ({
      username: user.username,
      city: user.city,
    }));
    broadcast({ type: 'users', users: userList });
    console.log('Client disconnected');
  });
});

function broadcast(data) {
  wss.clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify(data));
    }
  });
}

console.log('WebSocket server running on ws://localhost:8080');