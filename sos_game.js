// Global variables
let boardSize = 8;
let currentPlayer = 'blue';
let board = [];
let gameOver = false;
let blueScore = 0;
let redScore = 0;
let gameMode = 'simple';
let ctx;
let gameHistory = []; // Added for recording game history
let isRecording = false; // Added to track if recording is enabled

function startNewGame() {
    boardSize = parseInt(document.getElementById('boardSize').value);
    board = Array(boardSize).fill().map(() => Array(boardSize).fill(''));
    currentPlayer = 'blue';
    gameOver = false;
    blueScore = 0;
    redScore = 0;
    isRecording = document.getElementById('recordGame').checked;
    gameHistory = []; // Reset history for a new game

    document.getElementById('winnerDisplay').textContent = '';
    document.getElementById('currentTurn').textContent = `Current turn: ${currentPlayer}`;
    document.getElementById('saveGameButton').disabled = true;

    setupCanvas();
    drawBoard();
}

function setupCanvas() {
    const boardContainer = document.getElementById('gameBoard');
    boardContainer.innerHTML = ''; // Clear the board container

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

    const canvas = document.createElement('canvas');
    canvas.id = 'sosCanvas';
    canvas.width = table.offsetWidth;
    canvas.height = table.offsetHeight;
    canvas.style.position = 'absolute';
    boardContainer.appendChild(canvas);

    ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
}

function drawBoard() {
    const table = document.querySelector('#gameBoard table');
    if (!table) return;

    for (let i = 0; i < boardSize; i++) {
        for (let j = 0; j < boardSize; j++) {
            const cell = table.rows[i].cells[j];
            cell.textContent = board[i][j] || ''; // Ensure empty cells display blank
        }
    }

    document.getElementById('currentTurn').textContent = `Current turn: ${currentPlayer}`;
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
    if (isRecording) {
        gameHistory.push({ player: currentPlayer, row, col, piece }); // Record the move
    }

    drawBoard();

    if (checkForSOS(row, col)) {
        if (gameMode === 'simple') {
            endGame(currentPlayer);
        } else {
            updateScore();
        }
    } else if (isBoardFull()) {
        endGame(null);
    } else {
        switchPlayer();
    }
}

function checkForSOS(row, col) {
    // Logic to check if SOS was formed
    return false; // Placeholder logic
}

function updateScore() {
    if (currentPlayer === 'blue') {
        blueScore++;
    } else {
        redScore++;
    }
    document.getElementById('currentTurn').textContent = `Blue Score: ${blueScore}, Red Score: ${redScore}`;
}

function switchPlayer() {
    currentPlayer = currentPlayer === 'blue' ? 'red' : 'blue';
    document.getElementById('currentTurn').textContent = `Current turn: ${currentPlayer}`;
}

function endGame(winner) {
    gameOver = true;

    const winnerText = winner
        ? `${winner.charAt(0).toUpperCase() + winner.slice(1)} wins!`
        : 'It\'s a draw!';
    document.getElementById('winnerDisplay').textContent = winnerText;

    if (isRecording) {
        gameHistory.push({
            type: 'end',
            winner: winner,
            boardState: board.map(row => [...row]), // Deep copy of the board
            mode: gameMode
        });
        document.getElementById('saveGameButton').disabled = false; // Enable save button
    }
}

function isBoardFull() {
    return board.every(row => row.every(cell => cell !== ''));
}

function saveRecordedGame() {
    if (!gameHistory.length) return;

    const gameData = {
        boardSize,
        gameMode,
        blueScore,
        redScore,
        moves: gameHistory
    };

    const blob = new Blob([JSON.stringify(gameData, null, 2)], { type: 'application/json' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'sos_game_record.json';
    link.click();
}

window.onload = startNewGame;
