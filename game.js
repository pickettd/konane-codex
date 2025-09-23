const BOARD_SIZE = 6;
const PLAYERS = { BLACK: "black", WHITE: "white" };

const state = {
  board: [],
  currentPlayer: PLAYERS.BLACK,
  selectedCell: null,
  captured: {
    [PLAYERS.BLACK]: 0,
    [PLAYERS.WHITE]: 0,
  },
};

const dom = {};

window.addEventListener("DOMContentLoaded", () => {
  cacheDom();
  bindEvents();
  startNewGame();
});

function cacheDom() {
  dom.board = document.getElementById("board");
  dom.turnIndicator = document.getElementById("turn-indicator");
  dom.moveFeedback = document.getElementById("move-feedback");
  dom.resetButton = document.getElementById("reset-button");
  dom.blackScore = document.getElementById("black-score");
  dom.whiteScore = document.getElementById("white-score");
}

function bindEvents() {
  dom.resetButton.addEventListener("click", startNewGame);
}

function startNewGame() {
  state.board = createInitialBoard();
  state.currentPlayer = PLAYERS.BLACK;
  state.selectedCell = null;
  state.captured[PLAYERS.BLACK] = 0;
  state.captured[PLAYERS.WHITE] = 0;

  renderBoard();
  updateHud();
}

function createInitialBoard() {
  const board = [];
  for (let row = 0; row < BOARD_SIZE; row += 1) {
    const rowData = [];
    for (let col = 0; col < BOARD_SIZE; col += 1) {
      const stone = (row + col) % 2 === 0 ? PLAYERS.BLACK : PLAYERS.WHITE;
      rowData.push({ stone, row, col });
    }
    board.push(rowData);
  }
  return board;
}

function renderBoard() {
  dom.board.replaceChildren();
  dom.board.style.gridTemplateColumns = `repeat(${BOARD_SIZE}, 1fr)`;
  dom.board.style.gridTemplateRows = `repeat(${BOARD_SIZE}, 1fr)`;

  state.board.forEach((rowData) => {
    rowData.forEach((cell) => {
      const cellWrapper = document.createElement("div");
      cellWrapper.className = "board-cell";

      const cellButton = document.createElement("button");
      cellButton.type = "button";
      cellButton.dataset.row = String(cell.row);
      cellButton.dataset.col = String(cell.col);

      if (cell.stone) {
        cellButton.dataset.stone = cell.stone;
      } else {
        cellWrapper.classList.add("empty-slot");
      }

      cellButton.addEventListener("click", onCellClick);

      cellWrapper.appendChild(cellButton);
      dom.board.appendChild(cellWrapper);
    });
  });
}

function onCellClick(event) {
  // Placeholder interaction logic until move handling is implemented in later phases.
  const { row, col } = event.currentTarget.dataset;
  state.selectedCell = { row: Number(row), col: Number(col) };
  highlightSelectedCell();
  dom.moveFeedback.textContent = "Move handling coming in Phase 4.";
}

function highlightSelectedCell() {
  const buttons = dom.board.querySelectorAll("button");
  buttons.forEach((button) => {
    const isSelected =
      Number(button.dataset.row) === state.selectedCell?.row &&
      Number(button.dataset.col) === state.selectedCell?.col;
    if (isSelected) {
      button.dataset.selected = "true";
    } else {
      delete button.dataset.selected;
    }
  });
}

function updateHud() {
  dom.turnIndicator.textContent = `Current turn: ${capitalize(state.currentPlayer)}`;
  dom.blackScore.textContent = `Black: ${state.captured[PLAYERS.BLACK]}`;
  dom.whiteScore.textContent = `White: ${state.captured[PLAYERS.WHITE]}`;
}

function capitalize(value) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}
