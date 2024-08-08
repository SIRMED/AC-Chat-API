const { v4: uuidv4 } = require('uuid');
const express = require('express');
const cors = require('cors');
const http = require('http');
const socketIo = require('socket.io');

const appApi = express(); // REST API app
const appSocket = express(); // Socket.io app

const portApi = 7000; // Port for REST API
const portSocket = 8000; // Port for Socket.io server

console.clear();
console.log('\x1b[36m%s\x1b[0m', `Server is starting up...`)
console.log("---------------------------------------------")
console.log("")

var waitingRoom = [];

function emptyWaitingRoom() {
  if (waitingRoom.length >= 2) {
    const [cno1, socket1] = waitingRoom[0].split(" ");
    const [cno2, socket2] = waitingRoom[1].split(" ");

    const room = {
      id: uuidv4(),
      people: [waitingRoom[0], waitingRoom[1]]
    };

    io.to(socket1).emit("join-request/room", room);
    io.to(socket2).emit("join-request/room", room);
    waitingRoom.splice(0, 2);
  }
  setTimeout(() => {
    emptyWaitingRoom();
  }, 1000);
}

appApi.use(cors());
appApi.use(express.json());

appApi.get('/get-waiting-room', (req, res) => {
  res.json({ "waitingRoom": waitingRoom });
});

appApi.listen(portApi, () => {
  console.log(`REST API server is listening on port ${portApi}`);
});


const serverSocket = http.createServer(appSocket);
const io = socketIo(serverSocket, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

io.on('connection', (socket) => {
  let userId = null;
  console.log(`User connected with id: ${socket.id}`);

  socket.on("join/waiting-room", (cno) => {
    if (!waitingRoom.includes(`${cno} ${socket.id}`)) {
      waitingRoom.push(`${cno} ${socket.id}`);
      userId = `${cno} ${socket.id}`;

      console.log(`User ${socket.id} joined waiting room with CNO: ${cno}`);
    }
  });

  socket.on("send-message", ({ id, message }) => {
    console.log(`Sending "${message}" to "${id}"`)
    io.to(id.split(" ")[1]).emit("recive-message", {
      "from": userId,
      "message": message
    })
  })

  socket.on('disconnect', () => {
    waitingRoom = waitingRoom.filter((str) => str !== userId);
    io.emit("user-discon", userId)
    console.log(`User ${socket.id} disconnected`);
  });
});

serverSocket.listen(portSocket, () => {
  console.log(`Socket.io server is listening on port ${portSocket}`);
});