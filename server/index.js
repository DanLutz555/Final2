const express = require("express");
const http = require('http');
const cors = require("cors");
const mongoose = require("mongoose");
const authRoutes = require("./routes/auth");
const messageRoutes = require("./routes/messages");
const socketIo = require("socket.io");
const User = require("./models/userModel");
require("dotenv").config();

const app = express();

app.use(cors());
app.use(express.json());

mongoose.connect(process.env.MONGO_URL, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log("DB Connection Successful"))
.catch((err) => console.log(err.message));

app.use("/api/auth", authRoutes);
app.use("/api/messages", messageRoutes);

const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "http://localhost:3000",
    credentials: true,
  },
});

global.onlineUsers = new Map();

io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  socket.on("add-user", (userId) => {
    onlineUsers.set(userId, socket.id);
    broadcastOnlineUsers();
    const usersOnline = Array.from(onlineUsers.keys());
    io.emit("users-online", usersOnline);
  });

  socket.on("send-msg", (data) => {
    const sendUserSocket = onlineUsers.get(data.to);
    console.log(`Sending message to ${sendUserSocket}`);
    if (sendUserSocket) {
      io.to(sendUserSocket).emit("msg-receive", data.msg);
    }
  });

  socket.on('disconnect', () => {
    console.log('User disconnected', socket.id);
    const userId = [...onlineUsers.entries()].find(([key, val]) => val === socket.id)?.[0];
    if (userId) {
      onlineUsers.delete(userId);
      broadcastOnlineUsers();
    }
    const usersOnline = Array.from(onlineUsers.keys());
        io.emit("users-online", usersOnline);
  });
});

function broadcastOnlineUsers() {
  const usersOnline = Array.from(onlineUsers.keys());
  io.emit("users-online", usersOnline);
}

const PORT = process.env.PORT || 3002;
server.listen(PORT, () => console.log(`Server started on port ${PORT}`));
