// app.js
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');

const FOX_EMOJI = '🦊';
const LEAF_EMOJI = '🌿';
const HAPPY_EMOJI = '😀';

const KEY_LEFT = 37;
const KEY_UP = 38;
const KEY_RIGHT = 39;
const KEY_DOWN = 40;

const ENEMY_MOVE_DELAY = 500; // ms between enemy position changes
const DROP_SHADOW_OFFSET = 2; // px offset from text

const FIELD_OFFSET = 50; // px from the top

let initialState = {
  isRunning: true,
  playerWon: false,
  numXCells: 0,
  numYCells: 0,
  numMowed: 0,
  totalCells: 0,
  playerPos: { x: 0, y: 0 },
  enemyPos: { x: 0, y: 0 },
  timeEnemyMoved: 0,
  keysDown: new Set(),
  board: []
};
let state = Object.assign({}, initialState);

const update = () => {
  const { keysDown, playerPos, numXCells, numYCells, board, timeEnemyMoved, enemyPos } = state;
  const prevPlayerPos = Object.assign({}, playerPos);
  // Down key
  if (keysDown.has(KEY_DOWN)) {
    playerPos.y++;
    if (playerPos.y >= numYCells) {
      playerPos.y = 0;
    }
    keysDown.delete(KEY_DOWN);
  }
  // Up key
  if (keysDown.has(KEY_UP)) {
    playerPos.y--;
    if (playerPos.y < 0) {
      playerPos.y = numYCells - 1;
    }
    keysDown.delete(KEY_UP);
  }
  // Left key
  if (keysDown.has(KEY_LEFT)) {
    playerPos.x--;
    if (playerPos.x < 0) {
      playerPos.x = numXCells - 1;
    }
    keysDown.delete(KEY_LEFT);
  }
  // Right key
  if (keysDown.has(KEY_RIGHT)) {
    playerPos.x++;
    if (playerPos.x >= numXCells) {
      playerPos.x = 0;
    }
    keysDown.delete(KEY_RIGHT);
  }
  const hasPlayerMoved = (prevPlayerPos.x !== playerPos.x || prevPlayerPos.y !== playerPos.y);
  if (hasPlayerMoved) {
    // erase player's old position
    board[prevPlayerPos.x][prevPlayerPos.y] = '';
  }
  if (board[playerPos.x][playerPos.y] !== '') {
    board[playerPos.x][playerPos.y] = '';
  }

  // Calculate the number of tiles mowed
  state.numMowed = board.reduce((cnt, row) => {
    return row.reduce((rowCnt, cell) => rowCnt + (cell === '' ? 1 : 0), cnt)
  }, 0);
  const isPlayerDone = (state.numMowed === state.totalCells);

  // Enemy movement
  if (Date.now() - timeEnemyMoved > ENEMY_MOVE_DELAY) {
    const yDiff = Math.abs(playerPos.y - enemyPos.y);
    const xDiff = Math.abs(playerPos.x - enemyPos.x);
    if (xDiff > yDiff) {
      enemyPos.x += (playerPos.x < enemyPos.x ? -1 : +1);
    } else {
      enemyPos.y += (playerPos.y < enemyPos.y ? -1 : +1);
    }
    state.timeEnemyMoved = Date.now();
  }

  // Collision detection with enemy
  const enemyCaughtPlayer = (playerPos.x === enemyPos.x && playerPos.y === enemyPos.y);
  if (enemyCaughtPlayer || isPlayerDone) {
    // Game Over!
    state.playerWon = isPlayerDone;
    state.isRunning = false;
  }
};

const CELL_SIZE = 50; // px in width and height
const CELL_EMOJI_YOFFSET = 6;
const drawCell = (x, y, emoji) => {
  const xPos = x * CELL_SIZE;
  const yPos = y * CELL_SIZE + FIELD_OFFSET;
  ctx.font = `${CELL_SIZE}px Arial`;
  ctx.textBaseline = 'top';
  ctx.fillText(emoji, xPos, yPos + CELL_EMOJI_YOFFSET);
};

const drawText = (str, x, y) => {
  ctx.fillStyle = 'black';
  ctx.fillText(str, x + DROP_SHADOW_OFFSET, y + DROP_SHADOW_OFFSET);
  ctx.fillStyle = 'white';
  ctx.fillText(str, x, y);
};

const draw = () => {
  ctx.fillStyle = 'black';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Divider line for board
  const GUTTER = 10; // px from line
  const FIELD_LINE_OFFSET = FIELD_OFFSET - GUTTER;
  ctx.strokeStyle = 'white';
  ctx.beginPath();
  ctx.moveTo(0, FIELD_LINE_OFFSET);
  ctx.lineTo(canvas.width, FIELD_LINE_OFFSET);
  ctx.stroke();

  // Title
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = `20px Arial`;
  drawText('Mower', canvas.width / 2, FIELD_LINE_OFFSET / 2);
  ctx.textAlign = 'left';

  // Progress
  const { isRunning, numMowed, totalCells } = state;
  ctx.font = `20px Arial`;
  ctx.textBaseline = 'middle';
  const pctDone = Math.floor((numMowed / totalCells) * 100);
  const msg = `${pctDone}%`;
  const xPos = 10;
  const yPos = FIELD_LINE_OFFSET / 2;
  drawText(msg, xPos, yPos);

  // Field
  const { numXCells, numYCells, board, enemyPos, playerPos } = state;
  for (let x = 0; x < numXCells; x++) {
    for (let y = 0; y < numYCells; y++) {
      const isPlayerPos = (x === playerPos.x && y === playerPos.y);
      const isEnemyPos = (x === enemyPos.x && y === enemyPos.y);
      const cellEmoji = (isEnemyPos ? FOX_EMOJI : (isPlayerPos ? HAPPY_EMOJI : board[x][y]));
      if (cellEmoji !== '') {
        drawCell(x, y, cellEmoji);
      }
    }
  }

  // Game Over message
  if (!isRunning) {
    const { playerWon } = state;
    // Game Over message
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = `${CELL_SIZE}px Arial`;
    const gameOverMsg = playerWon ? 'You Won!' : 'You Lose!'
    const totalMsg = `Total: ${Math.floor((numMowed/totalCells)*100)}% (${numMowed}/${totalCells});`
    const xPos = Math.floor(canvas.width / 2);
    const yPos = Math.floor(canvas.height / 2);
    // draw text
    drawText(gameOverMsg, xPos, yPos - CELL_SIZE);
    drawText(totalMsg, xPos, yPos);
  }
};

const loop = () => {
  if (state.isRunning === true) {
    update();
    draw();
  }
  requestAnimationFrame(loop);
};

const resize = () => {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  const fieldHeight = canvas.height - FIELD_OFFSET;
  const fieldWidth = canvas.width;
  state.numXCells = Math.floor(fieldWidth / CELL_SIZE);
  state.numYCells = Math.floor(fieldHeight / CELL_SIZE);
  state.totalCells = state.numXCells * state.numYCells;
}

const startNewGame = () => {
  const { numXCells, numYCells } = state;
  console.log(`creating a new board (${numXCells}, ${numYCells})`);
  const board = new Array(numXCells).fill().map(_ => new Array(numYCells).fill(LEAF_EMOJI));
  const playerPos = { x: 0, y: 0 };
  const enemyPos = { x: numXCells - 1, y: numYCells - 1 };
  Object.assign(state, {
    isRunning: true,
    playerWon: false,
    numMowed: 0,
    playerPos,
    enemyPos,
    board
  });
}

const keydown = (e) => {
  state.keysDown.add(e.which);
};

const keyup = (e) => {
  state.keysDown.delete(e.which);
};

// App start
window.addEventListener('resize', resize);
window.addEventListener('keydown', keydown);
window.addEventListener('keyup', keyup);
resize();
startNewGame();
loop();