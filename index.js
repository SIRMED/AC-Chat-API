const { v4: uuidv4 } = require('uuid');
const express = require('express');
const cors = require('cors');
const app = express();
const server = require('http').Server(app);
const io = require('socket.io')(server, {
    cors: {
        origin: 'https://silver-waffle-6575644vvxv36q-3000.app.github.dev',
        methods: ['GET', 'POST']
    }
});
const port = process.env.PORT || 8000;

var waitingRoom = [];

var rooms = [];


emptyWaitingRoom();
function emptyWaitingRoom() {
  if(waitingRoom.length >= 2) {
    var cno1 = waitingRoom[0].split(" ")[0];
    var cno2 = waitingRoom[1].split(" ")[0];
    var socket1 = waitingRoom[0].split(" ")[1];
    var socket2 = waitingRoom[1].split(" ")[1];

    var room = {
      id: uuidv4(),
      people: [waitingRoom[0], waitingRoom[1]]
    }

    io.to(socket1).emit("join-request/room", room);
    io.to(socket2).emit("join-request/room", room);
    waitingRoom.splice(0, 2);
  }
  setTimeout(() => {
    emptyWaitingRoom();
  }, 1000);
}

io.on('connection', (socket) => {
  console.log(`User connected with id: ${socket.id}`);

  socket.on("join/waiting-room", (cno) => {
    if(!waitingRoom.includes(`${cno} ${socket.id}`)) {
      waitingRoom.push(`${cno} ${socket.id}`);
      console.log(`User ${socket.id} joined waiting room with CNO: ${cno}`);

      // if(waitingRoom.length%2 == 0 && waitingRoom.length >= 2) {
      //   var room = {
      //     id: uuidv4(),
      //     people: [waitingRoom[0], waitingRoom[1]]
      //   }
      //   rooms.push(room);
      //   io.to(waitingRoom[0].socketId).emit("join-request/room", room);
      //   io.to(waitingRoom[1].socketId).emit("join-request/room", room);
      //   waitingRoom.splice(0, 2);
      // }

    }
  })

  socket.on("join/room", (room) => {
    socket.join(room.id);
    console.log(`User ${socket.id} joined room ${room.id}`);
  })

  socket.on("send-message", ({ room, msg, from }) => {
    console.log(`User ${from} sent message '${msg}' to room ${room.id}`);
    socket.to(room.id).emit("receive-message", { msg, from });
  })
  
  socket.on('disconnect', () => {
    console.log(`User ${socket.id} disconnected`);
  })

});




server.listen(port, () => {
  console.clear();
  console.log('\x1b[36m%s\x1b[0m', `Socket.io server is listening on port ${port}`)
  console.log("---------------------------------------------")
  console.log("")
});