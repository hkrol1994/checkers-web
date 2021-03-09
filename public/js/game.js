const socket = io();
const token = localStorage.getItem("token");

const playerInfoTemplate = document.querySelector("#player-info-template")
  .innerHTML;
const opponentInfoTemplate = document.querySelector("#opponent-info-template")
  .innerHTML;

const room = Qs.parse(location.search, {
  ignoreQueryPrefix: true,
});

const roomNumber = room.room;

let isRedPlayer;
let isRedTurn = true;
let indexPieceSelected;
let isPieceSelected;
let board;
let isMoveEnded = true;
let wasPromotion = false;

const initSquare = (index) => {
  const squareContainer = document.createElement("div");
  const pieceContainer = document.createElement("div");
  pieceContainer.className = "empty-piece";
  if (!board[index].isValid) {
    squareContainer.className = "yellow-square";
  } else {
    squareContainer.className = "blue-square";
    if (!board[index].isEmpty) {
      pieceContainer.className = board[index].isRed
        ? "red-piece"
        : "black-piece";
    }
  }
  squareContainer.appendChild(pieceContainer);
  squareContainer.id = "" + index;
  document.getElementById("board").appendChild(squareContainer);
};

const initBoard = () => {
  while (document.getElementById("board").children.length > 0) {
    document.getElementById("board").lastChild.remove();
  }
  if (isRedPlayer) {
    for (let i = 0; i < board.length; i++) {
      initSquare(i);
    }
  } else {
    for (let i = 63; i >= 0; i--) {
      initSquare(i);
    }
  }
  const blueSquare = document.querySelectorAll(".blue-square");
  for (let square of blueSquare) {
    square.addEventListener("click", (e) => {
      if (isRedPlayer !== isRedTurn) return;
      let index;
      if (e.target.parentElement.id === "board") {
        index = parseInt(e.target.id);
      } else {
        index = parseInt(e.target.parentElement.id);
      }
      playTurn(index);
    });
  }
};

function playTurn(index) {
  if (isPieceSelected && board[index].isValidMove) {
    makeMove(index);
    if (!isMoveEnded) {
      setIsValidMove(indexPieceSelected);
    } else {
      if (wasPromotion) {
        board[index].isKing = true;
      }
      isPieceSelected = false;
      wasPromotion = false;
      if (!isGameOver()) {
        socket.emit("turn-change", roomNumber);
        clearIsPieceSelected();
      } else {
        socket.emit("game-over", roomNumber);
        clearIsPieceSelected();
      }
    }
  } else if (
    isMoveEnded &&
    !board[index].isEmpty &&
    board[index].isRed === isRedTurn
  ) {
    setIsPieceSelected(index);
    setIsValidMove(index);
  }
  socket.emit("board-changed", { roomNumber, board });
}

function makeMove(index) {
  if ((index <= 7 && isRedTurn) || (index >= 56 && !isRedTurn)) {
    wasPromotion = true;
  }
  const attacedMove =
    indexPieceSelected - index > 9 || indexPieceSelected - index < -9;
  if (attacedMove) {
    const indexPieceAttacted = getIndexPieceAttacted(index);
    if (indexPieceAttacted !== undefined) {
      board[indexPieceAttacted].isEmpty = true;
      board[indexPieceAttacted].isKing = false;
    }
    board[index].isRed = board[indexPieceSelected].isRed;
    board[index].isKing = board[indexPieceSelected].isKing;
    board[index].isSelected = board[indexPieceSelected].isSelected;
    board[index].isEmpty = false;
    board[indexPieceSelected].isEmpty = true;
    board[indexPieceSelected].isSelected = false;
    board[indexPieceSelected].isKing = false;
    indexPieceSelected = index;
    if (indexPieceAttacted !== undefined) {
      isMoveEnded = !isPieceCanJump(indexPieceSelected);
    } else {
      isMoveEnded = true;
    }
    return;
  }
  board[index].isRed = board[indexPieceSelected].isRed;
  board[index].isKing = board[indexPieceSelected].isKing;
  board[index].isEmpty = false;
  board[indexPieceSelected].isEmpty = true;
  board[indexPieceSelected].isKing = false;
  isMoveEnded = true;
}

function getIndexPieceAttacted(index) {
  if (board[indexPieceSelected].isKing) {
    const up = indexPieceSelected > index;
    let right;
    if (up) {
      right = (indexPieceSelected - index) % 7 === 0;
    } else {
      right = (indexPieceSelected - index) % 9 === 0;
    }
    if (up && right) {
      return getIndexPieceAttactedForKing(-7);
    }
    if (!up && right) {
      return getIndexPieceAttactedForKing(9);
    }
    if (!up && !right) {
      return getIndexPieceAttactedForKing(7);
    }
    if (up && !right) {
      return getIndexPieceAttactedForKing(-9);
    }
  } else {
    return indexPieceSelected - (indexPieceSelected - index) / 2;
  }
}

function getIndexPieceAttactedForKing(distance) {
  for (let i = 1; i < 8; i++) {
    if (
      indexPieceSelected + distance * i < 0 ||
      indexPieceSelected + distance * i > 63
    )
      return;
    if (
      !board[indexPieceSelected + distance * i].isEmpty &&
      board[indexPieceSelected + distance * i].isRed !== isRedTurn
    )
      return indexPieceSelected + distance * i;
  }
}

function isPieceCanJump(indexer) {
  if (board[indexer].isKing) {
    return isKingCanJump(indexer);
  }
  let result = false;
  switch (indexer % 8) {
    case 0:
    case 1:
      if (isPieceCanJumpToSquare(indexer, -7)) {
        result = true;
        board[indexer - 14].isValidMove = true;
      }
      if (isPieceCanJumpToSquare(indexer, 9)) {
        result = true;
        board[indexer + 18].isValidMove = true;
      }
      break;
    case 6:
    case 7:
      if (isPieceCanJumpToSquare(indexer, 7)) {
        result = true;
        board[indexer + 14].isValidMove = true;
      }
      if (isPieceCanJumpToSquare(indexer, -9)) {
        result = true;
        board[indexer - 18].isValidMove = true;
      }
      break;
    default:
      if (isPieceCanJumpToSquare(indexer, -7)) {
        result = true;
        board[indexer - 14].isValidMove = true;
      }
      if (isPieceCanJumpToSquare(indexer, 9)) {
        result = true;
        board[indexer + 18].isValidMove = true;
      }
      if (isPieceCanJumpToSquare(indexer, 7)) {
        result = true;
        board[indexer + 14].isValidMove = true;
      }
      if (isPieceCanJumpToSquare(indexer, -9)) {
        result = true;
        board[indexer - 18].isValidMove = true;
      }
      break;
  }
  return result;
}

function isKingCanJump(indexer) {
  let result = false;
  switch (indexer % 8) {
    case 0:
      if (isKingCanJumpToSquare(indexer, -7)) {
        result = true;
        setIsValidMoveForKing(indexer, -7);
      }
      if (isKingCanJumpToSquare(indexer, 9)) {
        result = true;
        setIsValidMoveForKing(indexer, 9);
      }
      break;
    case 7:
      if (isKingCanJumpToSquare(indexer, 7)) {
        result = true;
        setIsValidMoveForKing(indexer, 7);
      }
      if (isKingCanJumpToSquare(indexer, -9)) {
        result = true;
        setIsValidMoveForKing(indexer, -9);
      }
      break;
    default:
      if (isKingCanJumpToSquare(indexer, -7)) {
        result = true;
        setIsValidMoveForKing(indexer, -7);
      }
      if (isKingCanJumpToSquare(indexer, 9)) {
        result = true;
        setIsValidMoveForKing(indexer, 9);
      }
      if (isKingCanJumpToSquare(indexer, 7)) {
        result = true;
        setIsValidMoveForKing(indexer, 7);
      }
      if (isKingCanJumpToSquare(indexer, -9)) {
        result = true;
        setIsValidMoveForKing(indexer, -9);
      }
      break;
  }
  return result;
}

function isKingCanJumpToSquare(indexer, distance) {
  for (let i = 0; i < 8; i++) {
    //לוודא שנמצאים עדיין בתוך המערך
    if (
      indexer + distance * (i + 1) < 0 ||
      indexer + distance * (i + 1) > 63 ||
      indexer + distance * (i + 2) < 0 ||
      indexer + distance * (i + 2) > 63
    )
      return false;
    if (
      (indexer + distance * (i + 1)) % 8 === 0 &&
      (distance === 7 || distance === -9)
    )
      continue;
    if (board[indexer + distance * (i + 1)].isEmpty) continue;
    if (
      board[indexer + distance * (i + 1)].isRed !== isRedTurn &&
      board[indexer + distance * (i + 2)].isEmpty
    ) {
      return true;
    } else {
      return false;
    }
  }
}

function setIsValidMoveForKing(indexer, distance) {
  let enemyIndexer;
  for (let i = 0; i < 8; i++) {
    if (
      !board[indexer + distance * (i + 1)].isEmpty &&
      board[indexer + distance * (i + 1)].isRed !== isRedTurn
    ) {
      enemyIndexer = indexer + distance * (i + 1);
      for (let j = 0; j < 8; j++) {
        if (
          enemyIndexer + distance * (j + 1) < 0 ||
          enemyIndexer + distance * (j + 1) > 63
        ) {
          return;
        }
        if (board[enemyIndexer + distance * (j + 1)].isEmpty) {
          board[enemyIndexer + distance * (j + 1)].isValidMove = true;
        } else {
          return;
        }
      }
    }
  }
}

function isPieceCanJumpToSquare(indexer, distance) {
  if (
    indexer + distance < 0 ||
    indexer + distance > 63 ||
    indexer + distance * 2 < 0 ||
    indexer + distance * 2 > 63
  )
    return false;
  return (
    board[indexer + distance].isRed !== isRedTurn &&
    !board[indexer + distance].isEmpty &&
    board[indexer + distance * 2].isEmpty
  );
}

function setIsValidMove(indexer) {
  for (let square of board) {
    square.isValidMove = false;
  }
  //בדיקה האם החלק יכול לבצע קפיצה
  if (isPieceCanJump(indexer)) return;
  //בדיקה האם יש חלק אחר שיכול לבצע קפיצה
  if (isOtherPieceCanJump()) return;
  //מהלכים רגילים
  switch (indexer % 8) {
    case 0:
      setIsValidMoveRight(indexer);
      break;
    case 7:
      setIsValidMoveLeft(indexer);
      break;
    default:
      setIsValidMoveLeft(indexer);
      setIsValidMoveRight(indexer);
      break;
  }
}

function isOtherPieceCanJump() {
  for (let i = 0; i < board.length; i++) {
    if (!board[i].isEmpty && board[i].isRed === isRedTurn) {
      if (isPieceCanJump(i)) {
        for (let square of board) {
          square.isValidMove = false;
        }
        return true;
      }
    }
  }
  return false;
}

function setIsValidMoveLeft(indexer) {
  if (board[indexer].isKing) {
    setIsValidRegularMoveForKing(indexer, -9);
    setIsValidRegularMoveForKing(indexer, 7);
    return;
  }
  const leftSquare = isRedTurn ? -9 : 7;
  if (board[indexer + leftSquare].isEmpty) {
    board[indexer + leftSquare].isValidMove = true;
  }
}

function setIsValidRegularMoveForKing(indexer, distance) {
  for (let i = 1; i < 8; i++) {
    if (indexer + distance * i < 0 || indexer + distance * i > 63) {
      break;
    }
    if (board[indexer + distance * i].isEmpty) {
      board[indexer + distance * i].isValidMove = true;
    } else {
      break;
    }
  }
}

function setIsValidMoveRight(indexer) {
  if (board[indexer].isKing) {
    setIsValidRegularMoveForKing(indexer, 9);
    setIsValidRegularMoveForKing(indexer, -7);
    return;
  }
  const rightSquare = isRedTurn ? -7 : 9;
  if (board[indexer + rightSquare].isEmpty) {
    board[indexer + rightSquare].isValidMove = true;
  }
}

function isGameOver() {
  let enemyPiecesCount = 0;
  for (let square of board) {
    if (!square.isEmpty && square.isRed !== isRedTurn) enemyPiecesCount++;
  }
  if (enemyPiecesCount === 0 || isBlocks()) {
    return true;
  }
  return false;
}

function isBlocks() {
  const dirction = isRedTurn ? 1 : -1;
  isRedTurn = !isRedTurn;
  for (let i = 0; i < board.length; i++) {
    if (!board[i].isEmpty && board[i].isRed === isRedTurn) {
      if (isPieceCanJump(i)) {
        isRedTurn = !isRedTurn;
        return false;
      }
      if (board[i].isKing) {
        switch (i % 8) {
          case 0:
            if (
              (i > 7 && board[i - 7].isEmpty) ||
              (i < 56 && board[i + 9].isEmpty)
            ) {
              isRedTurn = !isRedTurn;
              return false;
            }
            break;
          case 7:
            if (
              (i > 14 && board[i - 9].isEmpty) ||
              (i < 56 && board[i + 7].isEmpty)
            ) {
              isRedTurn = !isRedTurn;
              return false;
            }
            break;
          default:
            if (
              (i > 7 && board[i - 7].isEmpty) ||
              (i < 56 && board[i + 9].isEmpty) ||
              (i > 14 && board[i - 9].isEmpty) ||
              (i < 56 && board[i + 7].isEmpty)
            ) {
              isRedTurn = !isRedTurn;
              return false;
            }
        }
      } else {
        if (i + dirction * 7 > 0 && i + dirction * 7 < 63) {
          if (
            board[i + dirction * 7].isEmpty &&
            board[i + dirction * 7].isValid
          ) {
            isRedTurn = !isRedTurn;
            return false;
          }
        }
        if (i + dirction * 9 > 0 && i + dirction * 9 < 63) {
          if (
            board[i + dirction * 9].isEmpty &&
            board[i + dirction * 9].isValid
          ) {
            isRedTurn = !isRedTurn;
            return false;
          }
        }
      }
    }
  }
  isRedTurn = !isRedTurn;
  return true;
}

function setIsPieceSelected(index) {
  if (!isMoveEnded) return;
  else {
    for (let square of board) {
      square.isSelected = false;
    }
    board[index].isSelected = true;
    isPieceSelected = true;
  }
  indexPieceSelected = index;
}

function clearIsPieceSelected() {
  for (let square of board) {
    square.isSelected = false;
    square.isValidMove = false;
  }
}

function printBoard() {
  for (let i = 0; i <= 63; i++) {
    let classForSquare = "";
    let classForPiece = "";
    classForSquare += board[i].isValid ? "blue-square" : "yellow-square";
    if (board[i].isValid) {
      if (board[i].isKing) {
        classForPiece += board[i].isRed ? "red-king " : "black-king ";
      }
      if (!board[i].isEmpty) {
        classForPiece += board[i].isRed ? "red-piece" : "black-piece";
      } else {
        classForPiece += "empty-piece";
      }
      classForPiece += board[i].isValidMove ? " possible-locations" : "";
      classForPiece += board[i].isSelected ? " piece-selected" : "";
    }
    document.getElementById(i).className = classForSquare;
    if (classForPiece !== "") {
      document.getElementById(i).firstChild.className = classForPiece;
    }
  }
  document.getElementById("turn").innerHTML = isRedTurn ? "Red" : "Black";
}

function culcRating() {
  let playerRating = parseInt(
    document.querySelector(".player-info").children[1].innerText
  );
  let opponentRating = parseInt(
    document.querySelector(".opponent-info").children[1].innerText
  );
  let difference = playerRating - opponentRating;
  if (difference > 420) difference = 420;
  if (difference < -420) difference = 420;
  if (isRedTurn === isRedPlayer) {
    playerRating += 10 + (difference * 19) / 800;
    playerRating = Math.round(playerRating);
    opponentRating += -10 - (difference * 19) / 800;
    opponentRating = Math.round(opponentRating);
  } else {
    playerRating += -10 + (difference * 19) / 800;
    playerRating = Math.round(playerRating);
    opponentRating += 10 - (difference * 19) / 800;
    opponentRating = Math.round(opponentRating);
  }
  updateRaiting(playerRating, opponentRating);
  return playerRating;
}

function updateRaiting(playerRating, opponentRating) {
  const rating = { rating: playerRating };

  fetch("/users/me", {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(rating),
  })
    .then((res) => {
      if (res.ok) {
        document.querySelector(
          ".player-info"
        ).children[1].innerHTML = playerRating;
        document.querySelector(
          ".opponent-info"
        ).children[1].innerHTML = opponentRating;
      } else {
        throw new Error();
      }
    })
    .catch((err) => {
      console.log(err);
    });
}

function printGameOver() {
  document.getElementById("game-over-modal").classList.remove("none");
  document.getElementById("game-result").innerHTML =
    isRedTurn === isRedPlayer ? "Won" : "Lose";
  document.getElementById("new-rating").innerHTML = culcRating();
  document.querySelector(".turn-message").classList.add("none");
}

const rematchBtn = document.getElementById("rematch");
rematchBtn.addEventListener("click", () => {
  socket.emit("rematch", roomNumber);
  document.getElementById("game-over-modal").classList.add("none");
  document.getElementById("waiting-modal").classList.remove("none");
});

const cancelRematch = document.getElementById("cancel-invite");
cancelRematch.addEventListener("click", () => {
  socket.emit("leave", roomNumber);
});
const declineRematch = document.getElementById("decline-rematch");
declineRematch.addEventListener("click", () => {
  socket.emit("leave", roomNumber);
});
const exitBtn = document.getElementById("exit");
exitBtn.addEventListener("click", () => {
  socket.emit("leave", roomNumber);
});

const approveRematch = document.getElementById("approve-rematch");
approveRematch.addEventListener("click", () => {
  socket.emit("approve-rematch", roomNumber);
});

socket.on("play-rematch", (room) => {
  isRedPlayer = !isRedPlayer;
  isRedTurn = true;
  board = room.board;
  const modals = document.querySelectorAll(".modal");
  for (let modal of modals) {
    modal.classList.add("none");
  }
  initBoard();
  printBoard();
});

socket.on("invite-rematch", () => {
  document.getElementById("get-invite-modal").classList.remove("none");
  document.getElementById("game-over-modal").classList.add("none");
});

socket.on("player-leave", () => {
  document.getElementById("return-to-lobby-modal").classList.remove("none");
  document.getElementById("game-over-modal").classList.add("none");
});

socket.emit("joinRoom", roomNumber);

socket.on("joined", (room) => {
  let isFirstUser;
  //users info
  fetch("/users/me", {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })
    .then((res) => {
      if (res.ok) {
        return res.json();
      } else {
        throw new Error(res.status);
      }
    })
    .then((resObj) => {
      if (
        resObj.name === room.firstUser.username &&
        resObj.rating === room.firstUser.rating
      ) {
        isFirstUser = true;
        const playerInfoHtml = Mustache.render(playerInfoTemplate, {
          username: room.firstUser.username,
          rating: room.firstUser.rating,
        });
        document.querySelector(".player-info").innerHTML = playerInfoHtml;
        const opponentInfoHtml = Mustache.render(opponentInfoTemplate, {
          username: room.secondUser.username,
          rating: room.secondUser.rating,
        });
        document.querySelector(".opponent-info").innerHTML = opponentInfoHtml;
      } else {
        isFirstUser = false;
        const playerInfoHtml = Mustache.render(playerInfoTemplate, {
          username: room.secondUser.username,
          rating: room.secondUser.rating,
        });
        document.querySelector(".player-info").innerHTML = playerInfoHtml;
        const opponentInfoHtml = Mustache.render(opponentInfoTemplate, {
          username: room.firstUser.username,
          rating: room.firstUser.rating,
        });
        document.querySelector(".opponent-info").innerHTML = opponentInfoHtml;
      }
      board = room.board;
      if (
        (isFirstUser && room.isFirstUserStart) ||
        (!isFirstUser && !room.isFirstUserStart)
      ) {
        isRedPlayer = true;
        initBoard();
      } else {
        isRedPlayer = false;
        initBoard();
      }
    })
    .catch((err) => {
      console.log(err);
    });
});

socket.on("board-changed", (room) => {
  board = room.board;
  printBoard();
});

socket.on("game-over", () => {
  printGameOver();
});

socket.on("turn-change", () => {
  isRedTurn = !isRedTurn;
});

socket.on("moveToLobby", () => {
  location.href = "/lobby.html";
});
