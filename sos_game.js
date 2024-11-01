let boardSize = 8;
let currentPlayer = 'blue';
let board = [];
let gameOver = false;
let blueScore = 0;
let redScore = 0;
let gameMode = 'simple'; // Default game mode is 'simple'
let ctx; // Canvas context

function startNewGame() {
    boardSize = parseInt(document.getElementById('boardSize').value);
    board = Array(boardSize).fill().map(() => Array(boardSize).fill(''));
    currentPlayer = 'blue';
    gameOver = false;
    blueScore = 0;
    redScore = 0;
    gameMode = document.querySelector('input[name="gameMode"]:checked').value;
    document.getElementById('winnerDisplay').textContent = '';

    // Set up the canvas
    setupCanvas();
    drawBoard();
}

function setupCanvas() {
    const boardContainer = document.getElementById('gameBoard');
    boardContainer.innerHTML = '';

    const table = document.createElement('table');
    for (let i = 0; i < boardSize; i++) {
        const row = document.createElement('tr');
        for (let j = 0; j < boardSize; j++) {
            const cell = document.createElement('td');
            cell.dataset.row = i;
            cell.dataset.col = j;
            cell.addEventListener('click', handleCellClick);
            row.appendChild(cell);
        }
        table.appendChild(row);
    }
    boardContainer.appendChild(table);

    let canvas = document.getElementById('sosCanvas');
    if (!canvas) {
        canvas = document.createElement('canvas');
        canvas.id = 'sosCanvas';
        boardContainer.appendChild(canvas);
    }
    canvas.width = table.clientWidth;
    canvas.height = table.clientHeight;
    ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
}

function drawBoard() {
    const table = document.querySelector('table');
    for (let i = 0; i < boardSize; i++) {
        for (let j = 0; j < boardSize; j++) {
            const cell = table.rows[i].cells[j];
            cell.textContent = board[i][j];
        }
    }
}

function handleCellClick(event) {
    const row = parseInt(event.target.dataset.row);
    const col = parseInt(event.target.dataset.col);

    if (board[row][col] !== '' || gameOver) return;

    const piece = currentPlayer === 'blue'
        ? document.querySelector('input[name="bluePiece"]:checked').value
        : document.querySelector('input[name="redPiece"]:checked').value;

    board[row][col] = piece;
    drawBoard();

    const sosFormed = checkForSOS(row, col);
    if (gameMode === 'simple') {
        if (sosFormed) {
            endGame(currentPlayer); // End the game as soon as the first SOS is formed
        } else if (isBoardFull()) {
            endGame('draw'); // If board is full without SOS, it’s a draw
        } else {
            switchPlayer();
        }
    } else if (gameMode === 'general') {
        if (sosFormed) {
            updateScore();
            // Player takes another turn if they form an SOS
        } else {
            switchPlayer();
        }
        if (isBoardFull()) {
            endGame(); // End the game when the board is full
        }
    }

    if (!gameOver && isComputerTurn()) {
        setTimeout(makeComputerMove, 500);
    }
}

function switchPlayer() {
    currentPlayer = currentPlayer === 'blue' ? 'red' : 'blue';
}

function checkForSOS(row, col) {
    const sosSequences = [
        [[0, -2], [0, -1], [0, 1], [0, 2]], // Horizontal
        [[-2, 0], [-1, 0], [1, 0], [2, 0]], // Vertical
        [[-2, -2], [-1, -1], [1, 1], [2, 2]], // Diagonal \
        [[-2, 2], [-1, 1], [1, -1], [2, -2]] // Diagonal /
    ];

    let sosFound = false;

    sosSequences.forEach(direction => {
        const [prev, current, next] = direction;
        if (isSOS(row, col, prev, current, next)) {
            sosFound = true;
            drawSOSLine(row, col, prev, current, next);
        }
    });

    return sosFound;
}

function isSOS(row, col, prev, current, next) {
    const prevRow = row + prev[0];
    const prevCol = col + prev[1];
    const currentRow = row + current[0];
    const currentCol = col + current[1];
    const nextRow = row + next[0];
    const nextCol = col + next[1];

    if (
        prevRow >= 0 && prevRow < boardSize &&
        prevCol >= 0 && prevCol < boardSize &&
        currentRow >= 0 && currentRow < boardSize &&
        currentCol >= 0 && currentCol < boardSize &&
        nextRow >= 0 && nextRow < boardSize &&
        nextCol >= 0 && nextCol < boardSize
    ) {
        return board[prevRow][prevCol] === 'S' &&
               board[currentRow][currentCol] === 'O' &&
               board[nextRow][nextCol] === 'S';
    }

    return false;
}

function drawSOSLine(row, col, prev, current, next) {
    const table = document.querySelector('table');
    const cellSize = table.rows[0].cells[0].offsetWidth;
    const color = currentPlayer === 'blue' ? 'blue' : 'red';

    const startX = (col + next[1] + 0.5) * cellSize;
    const startY = (row + next[0] + 0.5) * cellSize;
    const endX = (col + prev[1] + 0.5) * cellSize;
    const endY = (row + prev[0] + 0.5) * cellSize;

    ctx.strokeStyle = color;
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(startX, startY);
    ctx.lineTo(endX, endY);
    ctx.stroke();
}

function updateScore() {
    if (currentPlayer === 'blue') {
        blueScore++;
    } else {
        redScore++;
    }
}

function isBoardFull() {
    return board.every(row => row.every(cell => cell !== ''));
}

function endGame(winner = null) {
    gameOver = true;
    let winnerText;

    if (gameMode === 'simple') {
        winnerText = winner === 'draw' ? "It's a draw!" : `${winner.charAt(0).toUpperCase() + winner.slice(1)} wins!`;
    } else {
        if (blueScore > redScore) {
            winnerText = 'Blue wins!';
        } else if (redScore > blueScore) {
            winnerText = 'Red wins!';
        } else {
            winnerText = "It's a draw!";
        }
    }

    document.getElementById('winnerDisplay').textContent = winnerText;
}

function isComputerTurn() {
    const bluePlayerType = document.querySelector('input[name="bluePlayerType"]:checked').value;
    const redPlayerType = document.querySelector('input[name="redPlayerType"]:checked').value;
    return (currentPlayer === 'blue' && bluePlayerType === 'computer') || 
           (currentPlayer === 'red' && redPlayerType === 'computer');
}

function makeComputerMove() {
    let availableMoves = [];
    for (let i = 0; i < boardSize; i++) {
        for (let j = 0; j < boardSize; j++) {
            if (board[i][j] === '') {
                availableMoves.push([i, j]);
            }
        }
    }

    if (availableMoves.length > 0) {
        const [row, col] = availableMoves[Math.floor(Math.random() * availableMoves.length)];
        const piece = currentPlayer === 'blue'
            ? document.querySelector('input[name