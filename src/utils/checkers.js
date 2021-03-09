const initBoard = () => {
  const board = [];
  for (let row = 0; row < 8; row++) {
    for (let coulmn = 0; coulmn < 8; coulmn++) {
      if (row % 2 === coulmn % 2) {
        board[row * 8 + coulmn] = {
          isValid: false,
          isEmpty: true,
          isRed: false,
          isKing: false,
          isValidMove: false,
          isSelected: false,
        };
      } else {
        if (row <= 2) {
          board[row * 8 + coulmn] = {
            isValid: true,
            isEmpty: false,
            isRed: false,
            isKing: false,
            isValidMove: false,
            isSelected: false,
          };
        } else if (row >= 5) {
          board[row * 8 + coulmn] = {
            isValid: true,
            isEmpty: false,
            isRed: true,
            isKing: false,
            isValidMove: false,
            isSelected: false,
          };
        } else {
          board[row * 8 + coulmn] = {
            isValid: true,
            isEmpty: true,
            isRed: false,
            isKing: false,
            isValidMove: false,
            isSelected: false,
          };
        }
      }
    }
  }
  return board;
};

module.exports = { initBoard };
