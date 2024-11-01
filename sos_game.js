let boardSize = 8;
let currentPlayer = 'blue';
let board = [];
let gameOver = false;
let blueScore = 0;
let redScore = 0;
let gameMode = 'simple';
let ctx;

function startNewGame() {
    boardSize = parseInt(document.getElementById('boardSize').value);
    board = Array(boardSize).fill().map(() => Array(boardSize).fill(''));
    currentPlayer = 'blue';
    gameOver = false;
    blueScore = 0;
    redScore = 0;
    gameMode = document.querySelector('input[name="gameMode"]:checked').value;
    document.getElementById('winnerDisplay').textContent = '';

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
    canvas.style.position = 'absolute';
    canvas.style.top = '0px';
    canvas.style.left = '0px';
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
    if (gameOver) return;

    const row = parseInt(event.target.dataset.row);
    const col = parseInt(event.target.dataset.col);

    if (board[row][col] !== '') return;

    const piece = currentPlayer === 'blue'
        ? document.querySelector('input[name="bluePiece"]:checked').value
        : document.querySelector('input[name="redPiece"]:checked').value;

    board[row][col] = piece;
    drawBoard();

    const sosFormed = checkForSOS(row, col);

    if (sosFormed) {
        updateScore();

        if (gameMode === 'simple') {
            endGame(currentPlayer);
            return; // Game ends immediately when SOS is formed
        }
    }

    if (gameMode === 'general' && sosFormed) {
        // Player gets another turn
        if (isBoardFull()) {
            endGame(getWinnerByScore());
        }
        // Do not switch player, allow the current player to move again
    } else {
        // Switch player if no SOS formed or in simple game after a non-winning move
        switchPlayer();
        if (gameMode === 'general' && isBoardFull()) {
            endGame(getWinnerByScore());
        } else if (gameMode === 'simple' && isBoardFull()) {
            endGame(null); // Draw if the board is full and no SOS formed
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
    const piece = board[row][col];
    const sosFound = findAndMarkSOS(row, col);
    return sosFound;
}

function findAndMarkSOS(row, col) {
    const directions = [
        { dr: 0, dc: 1 },  // Horizontal right
        { dr: 1, dc: 0 },  // Vertical down
        { dr: 1, dc: 1 },  // Diagonal down-right
        { dr: 1, dc: -1 }, // Diagonal down-left
        { dr: 0, dc: -1 }, // Horizontal left
        { dr: -1, dc: 0 }, // Vertical up
        { dr: -1, dc: -1 },// Diagonal up-left
        { dr: -1, dc: 1 }  // Diagonal up-right
    ];

    let sosFormed = false;

    for (const dir of directions) {
        const positions = [
            { r: row - dir.dr, c: col - dir.dc },
            { r: row, c: col },
            { r: row + dir.dr, c: col + dir.dc }
        ];

        if (positions.every(pos => pos.r >= 0 && pos.r < boardSize && pos.c >= 0 && pos.c < boardSize)) {
            const [first, second, third] = positions.map(pos => board[pos.r][pos.c]);
            if (first === 'S' && second === 'O' && third === 'S') {
                drawLine(positions[0], positions[2]);
                sosFormed = true;
            }
        }
    }

    return sosFormed;
}

function drawLine(startPos, endPos) {
    const table = document.querySelector('table');
    const cellSize = table.rows[0].cells[0].offsetWidth;
    const color = currentPlayer === 'blue' ? 'blue' : 'red';

    const startX = (startPos.c + 0.5) * cellSize;
    const startY = (startPos.r + 0.5) * cellSize;
    const endX = (endPos.c + 0.5) * cellSize;
    const endY = (endPos.r + 0.5) * cellSize;

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

function endGame(winner) {
    gameOver = true;
    let winnerText;

    if (gameMode === 'simple') {
        winnerText = winner ? `${capitalize(winner)} wins!` : 'It\'s a draw!';
    } else if (gameMode === 'general') {
        winnerText = blueScore > redScore
            ? 'Blue wins!'
            : redScore > blueScore
            ? 'Red wins!'
            : 'It\'s a draw!';
    }
    document.getElementById('winnerDisplay').textContent = winnerText;
}

function getWinnerByScore() {
    return blueScore > redScore ? 'blue' : redScore > blueScore ? 'red' : null;
}

function capitalize(word) {
    return word.charAt(0).toUpperCase() + word.slice(1);
}

function isComputerTurn() {
    const bluePlayerType = document.querySelector('input[name="bluePlayerType"]:checked').value;
    const redPlayerType = document.querySelector('input[name="redPlayerType"]:checked').value;
    return (currentPlayer === 'blue' && bluePlayerType === 'computer') || 
           (currentPlayer === 'red' && redPlayerType === 'computer');
}

function makeComputerMove() {
    if (gameOver) return;

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
            ? document.querySelector('input[name="bluePiece"]:checked').value
            : document.querySelector('input[name="redPiece"]:checked').value;

        board[row][col] = piece;
        drawBoard();

        const sosFormed = checkForSOS(row, col);

        if (sosFormed) {
            updateScore();

            if (gameMode === 'simple') {
                endGame(currentPlayer);
                return; // Game ends immediately when SOS is formed
            }
        }

        if (gameMode === 'general' && sosFormed) {
            // Computer gets another turn
            if (isBoardFull()) {
                endGame(getWinnerByScore());
            } else {
                setTimeout(makeComputerMove, 500);
            }
        } else {
            switchPlayer();
            if (gameMode === 'general' && isBoardFull()) {
                endGame(getWinnerByScore());
            } else if (gameMode === 'simple' && isBoardFull()) {
                endGame(null); // Draw if the board is full and no SOS formed
            }
        }
    }
}

window.onload = startNewGame;
