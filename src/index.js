const express = require('express');
const http = require('http');
const path = require('path');
const socketio = require('socket.io');
const Filter = require('bad-words');
const { generateMessage, generateLocationMessage } = require('./utils/messages');
const { addUser, removeUser, getUser, getUsersInRoom } = require('./utils/users');

const app = express();
const server = http.createServer(app); // This is done by default
const io = socketio(server);

const port = process.env.PORT || 3000;
// __dirname is the current directory in which this file lies in
// path library helps manage the paths
const publicDirectoryPath = path.join(__dirname, '../public');

app.use(express.static(publicDirectoryPath));

/*
  socket.on — receive some kind of message
  socket.emit — sending to specific places
  io.emit - will send to all connected devices
*/

io.on('connection', (socket) => {
  console.log('New websocket connected');

  socket.on('join', ({ username, room }, callback) => {
    // It either returned an error or user
    // socket.id uniquely identifies each connection
    const { error, user } = addUser({ id: socket.id, username, room });

    // If there is an error
    if (error) {
      return callback(error);
    }

    socket.join(user.room);

    socket.emit('message', generateMessage('Admin', 'Welcome!'));
    socket.broadcast.to(user.room).emit('message', generateMessage(`${user.username} has joined!`));
    // Updating the room information
    io.to(user.room).emit('roomData', { room: user.room, users: getUsersInRoom(user.room) });

    callback();
  })

  socket.on('sendMessage', (message, callback) => {
    const filter = new Filter();
    if (filter.isProfane(message)) {
      return callback('Profanity is not allowed');
    }

    const user = getUser(socket.id);

    io.to(user.room).emit('message', generateMessage(user.username, message));
    callback('Delivered!');
  })
  // When client sends a location
  socket.on('sendLocation', (coords, callback) => {
    const url = `https://google.com/maps?q=${coords.latitude},${coords.longitude}`;

    const user = getUser(socket.id);

    io.to(user.room).emit('locationMessage', generateLocationMessage(user.username, url));

    callback('Location shared');
  })
  // When client disconnects 
  socket.on('disconnect', () => {
    const user = removeUser(socket.id);

    if (user) {
      io.to(user.room).emit('message', generateMessage('Admin', `${user.username} has left!`));
      // Updating the room information
      io.to(user.room).emit('roomData', { room: user.room, users: getUsersInRoom(user.room) });
    }
  });
});

server.listen(port, () => {
  console.log(`listening on port ${port}`);
});