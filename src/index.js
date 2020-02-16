const express = require('express');
const http = require('http');
const path = require('path');
const socketio = require('socket.io');
const Filter = require('bad-words');
const { generateMessage, generateLocationMessage } = require('./utils/messages')

const app = express();
const server = http.createServer(app); // This is done by default
const io = socketio(server);

const port = process.env.PORT || 3000;
// __dirname is the current directory in which this file lies in
// path library helps manage the paths
const publicDirectoryPath = path.join(__dirname, '../public');

app.use(express.static(publicDirectoryPath));

// let count = 0;

/*
  socket.on — receive some kind of message
  socket.emit — sending to specific places
  io.emit - will send to all connected devices
*/

io.on('connection', (socket) => {
  console.log('New websocket connected');

  socket.on('join', ({ username, room }) => {
    socket.join(room);

    socket.emit('message', generateMessage('Welcome!'));
    socket.broadcast.to(room).emit('message', generateMessage(`${username} has joined!`));
  })

  socket.on('sendMessage', (message, callback) => {
    const filter = new Filter();
    if (filter.isProfane(message)) {
      return callback('Profanity is not allowed');
    }

    io.emit('message', generateMessage(message));
    callback('Delivered!');
  })
  // When client sends a location
  socket.on('sendLocation', (coords, callback) => {
    const url = `https://google.com/maps?q=${coords.latitude},${coords.longitude}`;
    io.emit('locationMessage', generateLocationMessage(url));
    callback('Location shared');
  })
  // When client disconnects 
  socket.on('disconnect', () => {
    io.emit('message', generateMessage('A user has left'));
  });
});

server.listen(port, () => {
  console.log(`listening on port ${port}`);
});