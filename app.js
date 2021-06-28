const express = require('express');

const app = express();
const server = require('http').Server(app);
const io = require('socket.io')(server);

const port = 5000;

let rooms = 0;

io.on('connection', (socket) => {

    // Creating a new game and notifying the creator.
    socket.on('creategame', (data) => {
        rooms = rooms + 1;
        socket.join(`room-${rooms}`);
        socket.emit('newgame', {
            name: data.name,
            room: `room-${rooms}`,
            url: `http://livetictactoe.netlify.app/?roomId=room-${rooms}`
        });
    });
  
    // Connect the 2nd Player to the requested room. Show error if the room is full.
    socket.on('joingame', (data) => {
      const room = io.nsps['/'].adapter.rooms[data.room];
      if (room && room.length === 1) {
        socket.join(data.room);
        socket.broadcast.to(data.room).emit('player1', {});
        socket.emit('player2', { name: data.name, room: data.room });
      } else {
        socket.emit('error', { message: 'Room_Full' });
      }
    });
  
    // Handle the turn played by either player and notify the other.
    socket.on('playturn', (data) => {
      socket.broadcast.to(data.room).emit('turnplayed', {
        tile: data.tile,
        room: data.room,
      });
    });
  
    // Notify the players about the result.
    socket.on('gamecomplete', (data) => {
      socket.broadcast.to(data.room).emit('gameend', data);
    });

  });
  
  
server.listen(port, () => {
    console.log(`Server running at ${port}`);
});