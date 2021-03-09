const path = require("path");
const http = require("http");
const express = require("express");
const socketio = require("socket.io");

require("./db/mongoose");
const userRouter = require("./routers/user");
const {
  addUser,
  removeUser,
  getUser,
  getUsersInLobbyByRating,
  updateCanBeInvited,
} = require("./utils/users");
const {
  addRoom,
  getRoom,
  updateBoard,
  initBoardForRoom,
} = require("./utils/rooms");

const app = new express();
const server = http.createServer(app);
const io = socketio(server);

const port = process.env.PORT;
const publicDirPath = path.join(__dirname, "../public");

app.use(express.static(publicDirPath));
app.use(express.json());
app.use(userRouter);

io.on("connection", (socket) => {
  socket.on("joinToLobby", ({ username, rating }, callback) => {
    addUser({ id: socket.id, username, rating });
    socket.join("lobby");
    io.to("lobby").emit("changeInLobby");
  });

  socket.on("getUsersInLobby", () => {
    socket.emit("getUsers", getUsersInLobbyByRating(socket.id));
  });

  socket.on("sendInvite", (id) => {
    updateCanBeInvited(socket.id);
    updateCanBeInvited(id);
    io.to("lobby").emit("changeInLobby");
    const user = getUser(socket.id);
    io.to(id).emit("getInvaite", {
      opponentId: user.id,
      opponentName: user.username,
      opponentRating: user.rating,
    });
  });
  socket.on("cancel-invite", (id) => {
    updateCanBeInvited(socket.id);
    updateCanBeInvited(id);
    io.to("lobby").emit("changeInLobby");
    io.to(id).emit("cancel-invite");
  });
  socket.on("approve-invite", (id) => {
    const room = addRoom(getUser(socket.id), getUser(id));
    socket.emit("goToRoom", room);
    io.to(id).emit("goToRoom", room);
  });

  socket.on("joinRoom", (roomNumber) => {
    const room = getRoom(roomNumber);
    socket.join(roomNumber);
    socket.emit("joined", room);
  });

  socket.on("board-changed", ({ roomNumber, board }) => {
    room = updateBoard(roomNumber, board);
    io.to(roomNumber).emit("board-changed", room);
  });

  socket.on("game-over", (roomNumber) => {
    io.to(roomNumber).emit("game-over");
  });
  socket.on("turn-change", (roomNumber) => {
    io.to(roomNumber).emit("turn-change");
  });

  socket.on("rematch", (roomNumber) => {
    socket.broadcast.to(roomNumber).emit("invite-rematch");
  });

  socket.on("leave", (roomNumber) => {
    socket.broadcast.to(roomNumber).emit("player-leave");
    socket.emit("moveToLobby");
  });

  socket.on("approve-rematch", (roomNumber) => {
    const room = initBoardForRoom(roomNumber);
    io.to(roomNumber).emit("play-rematch", room);
  });

  socket.on("disconnect", () => {
    const user = removeUser(socket.id);
    if (user) {
      io.to("lobby").emit("changeInLobby");
    }
  });
});

server.listen(port, () => {
  console.log("Server is up on port", port);
});
