let boardSize = 8;
let currentPlayer = 'blue';
let board = [];
let gameOver = false;
let blueScore = 0;
let redScore = 0;
let gameMode = 'simple'; // Default game mode is 'simple'
let canvas, ctx;

function startNewGame() {
    boardSize = parseInt(document.getElementById('boardSize').value);
    board = Array(boardSize).fill().map(() => Array(boardSize).fill(''));
    currentPlayer = 'blue';
    gameOver = false;
    blueScore = 0;
    redScore = 0;
    gameMode = document.querySelector('input[name="gameMode"]:checked').value; // Get game mode
    document.getElementById('winnerDisplay').textContent = '';

    // Set up canvas
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
            cell.textContent = board[i][j];
            row.appendChild(cell);
        }
        table.appendChild(row);
    }
    boardContainer.appendChild(table);

    // Create a canvas overlay
    if (!canvas) {
        canvas = document.createElement('canvas');
        canvas.width = table.clientWidth;
        canvas.height = table.clientHeight;
        canvas.style.position = 'absolute';
        canvas.style.top = `${table.offsetTop}px`;
        canvas.style.left = `${table.offsetLeft}px`;
        canvas.style.pointerEvents = 'none';  // Allow cell clicks through the canvas
        ctx = canvas.getContext('2d');
        boardContainer.appendChild(canvas);
    } else {
        ctx.clearRect(0, 0, canvas.width, canvas.height); // Clear previous drawings
    }
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
    const row = event.target.dataset.row;
    const col = event.target.dataset.col;

    if (board[row][col] !== '' || gameOver) return; // Ignore clicks on occupied cells or when game over

    const piece = currentPlayer === 'blue'
        ? document.querySelector('input[name="bluePiece"]:checked').value
        : document.querySelector('input[name="redPiece"]:checked').value;

    board[row][col] = piece;
    drawBoard();

    const sosFormed = checkForSOS(row, col);
    
    if (gameMode === 'simple') {
        if (sosFormed) {
            endGame(); // End the game when an SOS is formed
        } else {
            switchPlayer();
        }
    } else if (gameMode === 'general') {
        if (!sosFormed) {
            switchPlayer(); // Switch turn if no SOS formed
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
        [[0, -2], [0, -1], [0, 1]], // Horizontal
        [[-2, 0], [-1, 0], [1, 0]], // Vertical
        [[-2, -2], [-1, -1], [1, 1]], // Diagonal \
        [[-2, 2], [-1, 1], [1, -1]]  // Diagonal /
    ];

    let sosFound = false;

    sosSequences.forEach(direction => {
        const [prev, current, next] = direction;
        if (isSOS(row, col, prev, current, next)) {
            sosFound = true;
            drawSOSLine(row, col, prev, next);
            updateScore();
        }
    });

    return sosFound;
}

function isSOS(row, col, prev, current, next) {
    const prevRow = parseInt(row) + prev[0];
    const prevCol = parseInt(col) + prev[1];
    const nextRow = parseInt(row) + next[0];
    const nextCol = parseInt(col) + next[1];

    if (
        prevRow >= 0 && prevRow < boardSize &&
        prevCol >= 0 && prevCol < boardSize &&
        nextRow >= 0 && nextRow < boardSize &&
        nextCol >= 0 && nextCol < boardSize
    ) {
        return board[prevRow][prevCol] === 'S' &&
               board[row][col] === 'O' &&
               board[nextRow][nextCol] === 'S';
    }

    return false;
}

function drawSOSLine(row, col, prev, next) {
    const cellSize = 50;  // Adjust this based on your cell size
    const color = currentPlayer === 'blue' ? 'blue' : 'red';

    // Calculate the start and end coordinates for the line
    const startX = (parseInt(col) + prev[1]) * cellSize + cellSize / 2;
    const startY = (parseInt(row) + prev[0]) * cellSize + cellSize / 2;
    const endX = (parseInt(col) + next[1]) * cellSize + cellSize / 2;
    const endY = (parseInt(row) + next[0]) * cellSize + cellSize / 2;

    // Draw the line on the canvas
    ctx.strokeStyle = color;
    ctx.lineWidth = 4;
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

function endGame() {
    gameOver = true;
    let winnerText;
    if (gameMode === 'simple') {
        winnerText = `${currentPlayer.charAt(0).toUpperCase() + currentPlayer.slice(1)} wins!`;
    } else if (gameMode === 'general') {
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
        const randomMove = availableMoves[Math.floor(Math.random() * availableMoves.length)];
        const row = randomMove[0];
        const col = randomMove[1];
        const piece = currentPlayer === 'blue'
            ? document.querySelector('input[name="bluePiece"]:checked').value
            : document.querySelector('input[name="redPiece"]:checked').value;

        board[row][col] = piece;
        drawBoard();

        const sosFormed = checkForSOS(row, col);
        if (!sosFormed) {
            switchPlayer();
        }
    }
}

window.onload = startNewGame;