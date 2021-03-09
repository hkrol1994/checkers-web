const { initBoard } = require("./checkers");

let roomNumber = 0;
const rooms = [];

const addRoom = (user1, user2) => {
  roomNumber++;
  const firstUser = user1;
  const secondUser = user2;
  const isFirstUserStart = Math.floor(Math.random() * 2) === 0;
  const room = {
    firstUser,
    secondUser,
    isFirstUserStart,
    roomNumber,
    board: initBoard(),
  };
  rooms.push(room);
  return room;
};

const getRoom = (roomNumber) => {
  return rooms.find((room) => room.roomNumber === parseInt(roomNumber));
};

const updateBoard = (roomNumber, board) => {
  const room = rooms.find((room) => room.roomNumber === parseInt(roomNumber));
  room.board = board;
  return room;
};

const initBoardForRoom = (roomNumber) => {
  const room = rooms.find((room) => room.roomNumber === parseInt(roomNumber));
  room.board = initBoard();
  return room;
};

module.exports = { addRoom, getRoom, updateBoard, initBoardForRoom };
