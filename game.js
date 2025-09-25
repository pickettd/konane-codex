const BOARD_SIZE = 6;
const PLAYERS = Object.freeze({ BLACK: "black", WHITE: "white" });
const STAGES = Object.freeze({
  OPENING_BLACK: "opening_black",
  OPENING_WHITE: "opening_white",
  ACTIVE: "active",
});
const DIRECTIONS = [
  { row: -1, col: 0 },
  { row: 1, col: 0 },
  { row: 0, col: -1 },
  { row: 0, col: 1 },
];

const state = {
  board: [],
  currentPlayer: PLAYERS.BLACK,
  stage: STAGES.OPENING_BLACK,
  openingAnchor: null,
  selectedCell: null,
  legalTargets: [],
  chainInProgress: false,
  chainSegments: [],
  lastMoveSegments: [],
  captured: {
    [PLAYERS.BLACK]: 0,
    [PLAYERS.WHITE]: 0,
  },
  history: [],
  winner: null,
};

const dom = {};

window.addEventListener("DOMContentLoaded", () => {
  cacheDom();
  bindEvents();
  exposeDebugApi();
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
  dom.resetButton.addEventListener("click", () => startNewGame());
  document.addEventListener("keydown", onGlobalKeydown);
}

function exposeDebugApi() {
  window.konane = {
    undo: undoLastMove,
    state,
  };
}

function startNewGame() {
  state.board = createInitialBoard();
  state.currentPlayer = PLAYERS.BLACK;
  state.stage = STAGES.OPENING_BLACK;
  state.openingAnchor = null;
  state.selectedCell = null;
  state.legalTargets = [];
  state.chainInProgress = false;
  state.chainSegments = [];
  state.lastMoveSegments = [];
  state.captured[PLAYERS.BLACK] = 0;
  state.captured[PLAYERS.WHITE] = 0;
  state.history = [];
  state.winner = null;

  renderBoard();
  updateHud();
  setFeedback("Opening: Black remove a center stone or black corner.");
}

function createInitialBoard() {
  return Array.from({ length: BOARD_SIZE }, (_, row) =>
    Array.from({ length: BOARD_SIZE }, (_, col) =>
      (row + col) % 2 === 0 ? PLAYERS.BLACK : PLAYERS.WHITE
    )
  );
}

function renderBoard() {
  dom.board.replaceChildren();
  dom.board.style.gridTemplateColumns = `repeat(${BOARD_SIZE}, 1fr)`;
  dom.board.style.gridTemplateRows = `repeat(${BOARD_SIZE}, 1fr)`;

  const chainOrigins = new Set();
  const chainPath = new Set();
  let chainDestinationKey = null;
  state.chainSegments.forEach((segment, index) => {
    const originKey = makeCellKey(segment.from.row, segment.from.col);
    chainOrigins.add(originKey);
    const destKey = makeCellKey(segment.to.row, segment.to.col);
    chainPath.add(destKey);
    if (index === state.chainSegments.length - 1) {
      chainDestinationKey = destKey;
    }
  });

  const lastMoveOrigins = new Set();
  const lastMovePath = new Set();
  let lastMoveDestinationKey = null;
  state.lastMoveSegments.forEach((segment, index) => {
    const originKey = makeCellKey(segment.from.row, segment.from.col);
    lastMoveOrigins.add(originKey);
    const destKey = makeCellKey(segment.to.row, segment.to.col);
    lastMovePath.add(destKey);
    if (index === state.lastMoveSegments.length - 1) {
      lastMoveDestinationKey = destKey;
    }
  });

  for (let row = 0; row < BOARD_SIZE; row += 1) {
    for (let col = 0; col < BOARD_SIZE; col += 1) {
      const wrapper = document.createElement("div");
      wrapper.className = "board-cell";

      const button = document.createElement("button");
      button.type = "button";
      button.dataset.row = String(row);
      button.dataset.col = String(col);
      button.setAttribute(
        "aria-label",
        `${describeCell(row, col)} (${row + 1}, ${col + 1})`
      );

      const stone = state.board[row][col];
      if (stone) {
        button.dataset.stone = stone;
      } else {
        wrapper.classList.add("empty-slot");
      }

      const isSelected =
        state.selectedCell &&
        row === state.selectedCell.row &&
        col === state.selectedCell.col;
      if (isSelected) {
        button.dataset.selected = "true";
        button.setAttribute("aria-selected", "true");
      } else {
        button.setAttribute("aria-selected", "false");
      }

      if (state.legalTargets.some((target) => target.row === row && target.col === col)) {
        button.dataset.target = "true";
      }

      if (state.stage === STAGES.OPENING_BLACK && isValidOpeningBlack(row, col)) {
        button.dataset.target = "true";
      }

      if (state.stage === STAGES.OPENING_WHITE && isValidOpeningWhite(row, col)) {
        button.dataset.target = "true";
      }

      const cellKey = makeCellKey(row, col);

      let chainMarker = null;
      if (chainPath.has(cellKey)) {
        chainMarker = chainDestinationKey === cellKey ? "destination" : "path";
      }
      if (chainOrigins.has(cellKey) && !chainMarker) {
        chainMarker = "origin";
      }
      if (chainMarker) {
        button.dataset.chain = chainMarker;
      }

      let lastMoveMarker = null;
      if (lastMovePath.has(cellKey)) {
        lastMoveMarker = lastMoveDestinationKey === cellKey ? "destination" : "path";
      }
      if (lastMoveOrigins.has(cellKey) && !lastMoveMarker) {
        lastMoveMarker = "origin";
      }
      if (lastMoveMarker) {
        button.dataset.lastMove = lastMoveMarker;
      }

      button.addEventListener("click", onCellClick);
      button.addEventListener("keydown", onCellKeydown);

      wrapper.appendChild(button);
      dom.board.appendChild(wrapper);
    }
  }
}

function onCellClick(event) {
  if (state.winner) {
    setFeedback("Game over. Start a new game to keep playing.");
    return;
  }

  const row = Number(event.currentTarget.dataset.row);
  const col = Number(event.currentTarget.dataset.col);

  if (state.stage === STAGES.OPENING_BLACK) {
    handleOpeningBlack(row, col);
    return;
  }

  if (state.stage === STAGES.OPENING_WHITE) {
    handleOpeningWhite(row, col);
    return;
  }

  if (state.stage !== STAGES.ACTIVE) {
    return;
  }

  if (state.chainInProgress) {
    if (
      state.selectedCell &&
      row === state.selectedCell.row &&
      col === state.selectedCell.col
    ) {
      finishTurn();
      return;
    }

    if (isLegalTarget(row, col)) {
      executeMove(row, col);
      return;
    }

    setFeedback(
      "Continue the capture sequence or click the highlighted stone to end your turn."
    );
    return;
  }

  if (state.selectedCell && isLegalTarget(row, col)) {
    executeMove(row, col);
    return;
  }

  const stone = state.board[row][col];

  if (stone === state.currentPlayer) {
    if (
      state.selectedCell &&
      state.selectedCell.row === row &&
      state.selectedCell.col === col
    ) {
      clearSelection();
      setFeedback("Selection cleared. Choose a stone to move.");
      return;
    }

    const moves = getLegalMovesFrom(row, col, state.currentPlayer);
    if (moves.length === 0) {
      clearSelection();
      setFeedback("No legal captures for that stone. Choose another.");
      return;
    }

    state.selectedCell = { row, col };
    state.legalTargets = moves;
    renderBoard();
    setFeedback("Select a highlighted square to capture.");
    return;
  }

  if (stone && stone !== state.currentPlayer) {
    setFeedback(`It is ${capitalize(state.currentPlayer)}'s turn.`);
  } else if (state.selectedCell) {
    setFeedback("Choose one of the highlighted destinations to complete the move.");
  } else {
    setFeedback("Select one of your stones to begin a move.");
  }
}

function clearSelection(options = {}) {
  const { reRender = true, preserveChain = false } = options;
  state.selectedCell = null;
  state.legalTargets = [];
  state.chainInProgress = false;
  if (!preserveChain) {
    state.chainSegments = [];
  }
  if (reRender) {
    renderBoard();
  }
}

function executeMove(targetRow, targetCol) {
  if (state.stage !== STAGES.ACTIVE) return;

  const target = state.legalTargets.find(
    (entry) => entry.row === targetRow && entry.col === targetCol
  );
  if (!target || !state.selectedCell) return;

  pushHistory();

  const from = state.selectedCell;
  const captured = target.captured;

  if (state.chainSegments.length === 0) {
    state.lastMoveSegments = [];
  }

  state.chainSegments.push({
    from: { row: from.row, col: from.col },
    to: { row: targetRow, col: targetCol },
  });

  state.board[from.row][from.col] = null;
  state.board[captured.row][captured.col] = null;
  state.board[targetRow][targetCol] = state.currentPlayer;

  state.captured[state.currentPlayer] += 1;

  const nextMoves = getLegalMovesFrom(targetRow, targetCol, state.currentPlayer);

  if (nextMoves.length > 0) {
    state.selectedCell = { row: targetRow, col: targetCol };
    state.legalTargets = nextMoves;
    state.chainInProgress = true;
    renderBoard();
    updateHud();
    setFeedback(
      "Capture chain in progress: choose another jump or click the highlighted stone to end your turn."
    );
    return;
  }

  finishTurn();
}

function finishTurn() {
  const opponent = getOpponent(state.currentPlayer);

  state.lastMoveSegments = state.chainSegments.slice();
  clearSelection({ reRender: false, preserveChain: true });
  state.chainSegments = [];
  renderBoard();

  if (!hasAnyLegalMove(opponent)) {
    state.winner = state.currentPlayer;
    updateHud();
    setFeedback(
      `${capitalize(state.currentPlayer)} wins! ${capitalize(opponent)} has no legal moves.`
    );
    return;
  }

  state.currentPlayer = opponent;
  updateHud();
  setFeedback(`${capitalize(state.currentPlayer)} to move.`);
}

function pushHistory() {
  const snapshot = {
    board: state.board.map((row) => [...row]),
    currentPlayer: state.currentPlayer,
    captured: { ...state.captured },
    winner: state.winner,
    stage: state.stage,
    openingAnchor: state.openingAnchor ? { ...state.openingAnchor } : null,
    selectedCell: state.selectedCell ? { ...state.selectedCell } : null,
    legalTargets: state.legalTargets.map((target) => ({ ...target })),
    chainInProgress: state.chainInProgress,
    chainSegments: state.chainSegments.map((segment) => ({
      from: { ...segment.from },
      to: { ...segment.to },
    })),
    lastMoveSegments: state.lastMoveSegments.map((segment) => ({
      from: { ...segment.from },
      to: { ...segment.to },
    })),
  };

  state.history.push(snapshot);
}

function undoLastMove() {
  if (state.history.length === 0) {
    setFeedback("No moves to undo.");
    return false;
  }

  const snapshot = state.history.pop();
  state.board = snapshot.board.map((row) => [...row]);
  state.currentPlayer = snapshot.currentPlayer;
  state.captured = { ...snapshot.captured };
  state.winner = snapshot.winner;
  state.stage = snapshot.stage;
  state.openingAnchor = snapshot.openingAnchor ? { ...snapshot.openingAnchor } : null;
  state.selectedCell = snapshot.selectedCell ? { ...snapshot.selectedCell } : null;
  state.legalTargets = snapshot.legalTargets.map((target) => ({ ...target }));
  state.chainInProgress = snapshot.chainInProgress;
  state.chainSegments = snapshot.chainSegments.map((segment) => ({
    from: { ...segment.from },
    to: { ...segment.to },
  }));
  state.lastMoveSegments = snapshot.lastMoveSegments.map((segment) => ({
    from: { ...segment.from },
    to: { ...segment.to },
  }));

  renderBoard();
  updateHud();
  setFeedback("Reverted to the previous turn.");
  return true;
}

function getLegalMovesFrom(row, col, player) {
  if (state.board[row][col] !== player) {
    return [];
  }

  const opponent = getOpponent(player);
  const moves = [];

  DIRECTIONS.forEach((delta) => {
    const midRow = row + delta.row;
    const midCol = col + delta.col;
    const landingRow = row + delta.row * 2;
    const landingCol = col + delta.col * 2;

    if (!isOnBoard(midRow, midCol) || !isOnBoard(landingRow, landingCol)) {
      return;
    }

    if (
      state.board[midRow][midCol] === opponent &&
      state.board[landingRow][landingCol] === null
    ) {
      moves.push({
        row: landingRow,
        col: landingCol,
        captured: { row: midRow, col: midCol },
      });
    }
  });

  return moves;
}

function hasAnyLegalMove(player) {
  for (let row = 0; row < BOARD_SIZE; row += 1) {
    for (let col = 0; col < BOARD_SIZE; col += 1) {
      if (
        state.board[row][col] === player &&
        getLegalMovesFrom(row, col, player).length > 0
      ) {
        return true;
      }
    }
  }
  return false;
}

function isLegalTarget(row, col) {
  return state.legalTargets.some((target) => target.row === row && target.col === col);
}

function describeCell(row, col) {
  const stone = state.board[row][col];
  if (!stone) {
    return "Empty slot";
  }
  return `${capitalize(stone)} stone`;
}

function updateHud() {
  if (state.winner) {
    dom.turnIndicator.textContent = `Winner: ${capitalize(state.winner)}`;
  } else if (state.stage === STAGES.OPENING_BLACK) {
    dom.turnIndicator.textContent =
      "Opening: Black remove a center stone or black corner.";
  } else if (state.stage === STAGES.OPENING_WHITE) {
    dom.turnIndicator.textContent = "Opening: White remove an adjacent stone.";
  } else if (state.chainInProgress) {
    dom.turnIndicator.textContent = `Capture chain: ${capitalize(state.currentPlayer)} continues.`;
  } else {
    dom.turnIndicator.textContent = `Current turn: ${capitalize(state.currentPlayer)}`;
  }

  dom.blackScore.textContent = String(state.captured[PLAYERS.BLACK]);
  dom.whiteScore.textContent = String(state.captured[PLAYERS.WHITE]);
}

function setFeedback(message) {
  dom.moveFeedback.textContent = message;
}

function capitalize(value) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function getOpponent(player) {
  return player === PLAYERS.BLACK ? PLAYERS.WHITE : PLAYERS.BLACK;
}

function isOnBoard(row, col) {
  return row >= 0 && row < BOARD_SIZE && col >= 0 && col < BOARD_SIZE;
}

function handleOpeningBlack(row, col) {
  const stone = state.board[row][col];
  if (stone !== PLAYERS.BLACK) {
    setFeedback("Select one of the highlighted black stones to remove.");
    return;
  }

  if (!isValidOpeningBlack(row, col)) {
    setFeedback("Remove a center black stone or a black corner stone to begin.");
    return;
  }

  pushHistory();

  state.board[row][col] = null;
  state.stage = STAGES.OPENING_WHITE;
  state.currentPlayer = PLAYERS.WHITE;
  state.openingAnchor = { row, col };
  clearSelection({ reRender: false });

  renderBoard();
  updateHud();
  setFeedback("Opening: White remove an adjacent stone.");
}

function handleOpeningWhite(row, col) {
  if (!state.openingAnchor) {
    setFeedback("Black must remove a stone first.");
    return;
  }

  const stone = state.board[row][col];
  if (stone !== PLAYERS.WHITE) {
    setFeedback("White must remove a stone adjacent to the opening.");
    return;
  }

  if (!isValidOpeningWhite(row, col)) {
    setFeedback("Choose a white stone orthogonally adjacent to the empty space.");
    return;
  }

  pushHistory();

  state.board[row][col] = null;
  state.stage = STAGES.ACTIVE;
  state.currentPlayer = PLAYERS.BLACK;
  clearSelection({ reRender: false });

  renderBoard();
  updateHud();

  if (hasAnyLegalMove(state.currentPlayer)) {
    setFeedback("Black to move. Select a stone with a legal capture.");
  } else {
    state.winner = PLAYERS.WHITE;
    updateHud();
    setFeedback("White wins! Black has no legal captures.");
  }
}

function isValidOpeningBlack(row, col) {
  if (state.board[row][col] !== PLAYERS.BLACK) {
    return false;
  }

  const lowMid = Math.floor(BOARD_SIZE / 2) - 1;
  const centerPositions = [
    { row: lowMid, col: lowMid },
    { row: lowMid + 1, col: lowMid + 1 },
  ];

  const isCenter = centerPositions.some((pos) => pos.row === row && pos.col === col);
  const isCorner =
    (row === 0 && col === 0) ||
    (row === 0 && col === BOARD_SIZE - 1) ||
    (row === BOARD_SIZE - 1 && col === 0) ||
    (row === BOARD_SIZE - 1 && col === BOARD_SIZE - 1);

  return isCenter || isCorner;
}

function isValidOpeningWhite(row, col) {
  if (!state.openingAnchor) {
    return false;
  }

  if (state.board[row][col] !== PLAYERS.WHITE) {
    return false;
  }

  const distance =
    Math.abs(row - state.openingAnchor.row) + Math.abs(col - state.openingAnchor.col);
  return distance === 1;
}

function onCellKeydown(event) {
  const key = event.key;
  const row = Number(event.currentTarget.dataset.row);
  const col = Number(event.currentTarget.dataset.col);

  if (KEY_TO_OFFSET[key]) {
    event.preventDefault();
    const nextRow = row + KEY_TO_OFFSET[key].row;
    const nextCol = col + KEY_TO_OFFSET[key].col;
    focusCell(nextRow, nextCol);
    return;
  }

  if (key === "Home") {
    event.preventDefault();
    focusCell(row, 0);
    return;
  }

  if (key === "End") {
    event.preventDefault();
    focusCell(row, BOARD_SIZE - 1);
    return;
  }

  if (key === "PageUp") {
    event.preventDefault();
    focusCell(0, col);
    return;
  }

  if (key === "PageDown") {
    event.preventDefault();
    focusCell(BOARD_SIZE - 1, col);
    return;
  }

  if (key === "Escape" && state.stage === STAGES.ACTIVE) {
    event.preventDefault();
    if (state.chainInProgress) {
      setFeedback(
        "Finish the capture chain by selecting a target or reselect the highlighted stone to end the turn."
      );
    } else if (state.selectedCell) {
      clearSelection();
      setFeedback("Selection cleared. Choose a stone to move.");
    }
  }
}

function onGlobalKeydown(event) {
  if (event.key !== "Escape") {
    return;
  }

  if (state.stage !== STAGES.ACTIVE) {
    return;
  }

  if (state.chainInProgress) {
    setFeedback(
      "Finish the capture chain by selecting a target or reselect the highlighted stone to end the turn."
    );
    return;
  }

  if (state.selectedCell) {
    event.preventDefault();
    clearSelection();
    setFeedback("Selection cleared. Choose a stone to move.");
  }
}

function focusCell(row, col) {
  if (!isOnBoard(row, col)) {
    return;
  }

  const targetButton = dom.board.querySelector(
    `button[data-row="${row}"][data-col="${col}"]`
  );
  targetButton?.focus({ preventScroll: true });
}

function makeCellKey(row, col) {
  return `${row}-${col}`;
}

const KEY_TO_OFFSET = Object.freeze({
  ArrowUp: { row: -1, col: 0 },
  ArrowDown: { row: 1, col: 0 },
  ArrowLeft: { row: 0, col: -1 },
  ArrowRight: { row: 0, col: 1 },
});
