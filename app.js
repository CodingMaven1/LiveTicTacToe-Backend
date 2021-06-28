const express = require('express');
const cors=require("cors");

const app = express();
app.use(cors());
const server = require('http').Server(app);
const io = require('socket.io')(server, {
    cors: {
        origin: "*",
       
        // handlePreflightRequest: (req, res) => {
        //     res.writeead(200, {
        //         "Access-Control-Allow-Origin": "*",
        //         "Access-Control-Allow-Methods": "GET,POST",
        //         "Access-Control-Allow-Headers": "my-custom-header",
        //         "Access-Control-Allow-Credentials": true
        //     });
        //     res.end();
        // }
    }
});

const port = 5000;

let rooms = 0;

io.on('connection', (socket) => {

    // Creating a new game and notifying the creator.
    socket.on('creategame', (data) => {
        rooms = rooms + 1;
        socket.join(`room${rooms}`);
        socket.emit('newgame', {
            name: data.name,
            room: `room${rooms}`,
            url: `http://livetictactoe.netlify.app/?roomid=room${rooms}&&name=${data.name}&&icon=${data.icon}`
        });
    });
  
    // Connect the 2nd Player to the requested room. Show error if the room is full.
    socket.on('joingame', (data) => {
    //   const room = io.nsps['/'].adapter.rooms[data.room];
        const room = io.sockets.adapter.rooms.get(data.room);
        if (room && room.size === 1) {
            console.log(data)
            socket.join(data.room);
            socket.broadcast.to(data.room).emit('creator', { name: data.name, icon: data.icon });
            socket.emit('opponent', {});
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