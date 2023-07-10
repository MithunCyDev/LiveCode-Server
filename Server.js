const express = require("express");
const app = express();
const http = require("http");
const server = http.createServer(app);
const cors = require("cors");
const bodyParser = require("body-parser");
require("dotenv").config();
const router = require("./Router");
const socketIo = require("socket.io");
const { userModel } = require("./Schema");
const databaseConnection = require("./Mongoose");
const io = socketIo(server, {
  reconnection: true,
  reconnectionAttempts: 3,
  reconnectionDelay: 1000, // Initial delay in milliseconds
  reconnectionDelayMax: 5000, // Maximum delay between attempts
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"],
    allowedHeaders: ["Content-Type"],
    credentials: true,
  },
});

//Middleware
app.use(bodyParser.json());
app.use(cors());

io.on("error", (error) => {
  console.error("Socket.IO Error:", error);
});

//Database Connection with mongoose
databaseConnection();

//Call Router
app.use(router);

const userSocketMap = {};

function getAllConnectedClients(roomId) {
  return Array.from(io.sockets.adapter.rooms.get(roomId) || []).map(
    (socketId) => {
      return {
        socketId,
        userName: userSocketMap[socketId],
      };
    }
  );
}

// Socket.io events
io.on("connection", (socket) => {
  console.log("New client connected");

  socket.on("joinRoom", async (roomId, user) => {
    //room id will be save in the database
    const newUser = new userModel({ userRoomId: roomId });

    const checkUser = await userModel.findOne(
      { name: user },
      { userRoomId: roomId }
    );

    //Find user and update roomId or if there is no room id then create one
    await userModel.findOneAndUpdate(
      { name: user },
      { userRoomId: roomId },
      {
        new: true,
        upsert: true,
      }
    );

    //if user is not exist then save in database user and roomId
    if (!checkUser) {
      newUser.save();
    }

    userSocketMap[socket.id] = user;
    socket.join(roomId);

    const clients = getAllConnectedClients(roomId);
    clients.forEach(({ socketId }) => {
      io.to(socketId).emit("joined", {
        clients,
        user,
        socketId: socket.id,
      });
    });
  });

  // Code update section
  socket.on("codeChange", async ({ user, roomId, code }) => {
    // Update the code in the database
    console.log(code, "userCode");
    await userModel
      .findOneAndUpdate(
        { name: user },
        { code: code },
        { new: true, upsert: true }
      )
      .then(async (updatedUser) => {
        console.log(updatedUser.code, "database code");
        const updatedCode = updatedUser.code;

        try {
          // Retrieve the room sockets
          const room = io.sockets.adapter.rooms.get(roomId);
          if (room) {
            const roomSockets = Array.from(room);

            // Broadcast the updated code to all users in the room except the sender
            for (const socketId of roomSockets) {
              if (socketId !== socket.id) {
                io.sockets.sockets
                  .get(socketId)
                  .emit("updateCode", updatedCode);
              }
            }
          }
        } catch (error) {
          console.log(error);
        }
      })
      .catch((error) => {
        console.log(error);
      });
  });

  socket.on("disconnecting", () => {
    const rooms = [...socket.rooms];
    rooms.forEach((roomId) => {
      socket.in(roomId).emit("disconnected", {
        socketId: socket.id,
        userName: userSocketMap[socket.id],
      });
    });
    delete userSocketMap[socket.id];
    socket.leave();
    console.log("Client disconnected");
  });

  //Reconnect Method
  socket.on("reconnect", (attemptNumber) => {
    console.log(`Socket reconnected after ${attemptNumber} attempts`);
  });

});

const port = 4000;
server.listen(port, () => {
  console.log(`server running ${port}`);
});
