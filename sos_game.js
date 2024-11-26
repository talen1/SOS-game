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
    document.getElementById('winnerDisplay').textContent = '';
    document.getElementById('currentTurn').textContent = `Current turn: ${currentPlayer}`;

    setupCanvas();
    drawBoard();

    // Trigger autoplay if both players are computers
    if (isBothPlayersComputer()) {
        setTimeout(playComputerVsComputer, 500);
    }
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
    canvas.style.top = `${table.offsetTop}px`;
    canvas.style.left = `${table.offsetLeft}px`;
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
    document.getElementById('currentTurn').textContent = `Current turn: ${currentPlayer}`;
}

function handleCellClick(event) {
    if (gameOver || isComputerTurn()) return;

    const row = parseInt(event.target.dataset.row);
    const col = parseInt(event.target.dataset.col);

    if (board[row][col] !== '') return;

    const piece = currentPlayer === 'blue'
        ? document.querySelector('input[name="bluePiece"]:checked').value
        : document.querySelector('input[name="redPiece"]:checked').value;

    board[row][col] = piece;
    drawBoard();

    const sosFormed = checkForSOS(row, col);

    if (gameMode === 'simple') {
        if (sosFormed) {
            endGame(currentPlayer);
        } else if (isBoardFull()) {
            endGame(null);
        } else {
            switchPlayer();
        }
    } else if (gameMode === 'general') {
        if (sosFormed) {
            updateScore();
        } else {
            switchPlayer();
        }

        if (isBoardFull()) {
            endGame(getWinnerByScore());
        }
    }

    if (!gameOver && isComputerTurn()) {
        setTimeout(makeComputerMove, 500);
    }
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
            : document.querySelector('input[name="redPiece"]:checked").value;

        board[row][col] = piece;
        drawBoard();

        const sosFormed = checkForSOS(row, col);

        if (gameMode === 'simple' && sosFormed) {
            endGame(currentPlayer);
            return;
        }

        if (gameMode === 'general') {
            if (sosFormed) {
                updateScore();
            } else {
                switchPlayer();
            }
        }

        if (!gameOver) {
            switchPlayer();
        }
    }
}

function playComputerVsComputer() {
    if (!gameOver) {
        makeComputerMove();
        setTimeout(playComputerVsComputer, 500);
    }
}

function switchPlayer() {
    currentPlayer = currentPlayer === 'blue' ? 'red' : 'blue';
    document.getElementById('currentTurn').textContent = `Current turn: ${currentPlayer}`;
    if (isComputerTurn() && !gameOver) {
        setTimeout(makeComputerMove, 500);
    }
}

function isComputerTurn() {
    const bluePlayerType = document.querySelector('input[name="bluePlayerType"]:checked').value;
    const redPlayerType = document.querySelector('input[name="redPlayerType"]:checked').value;
    return (currentPlayer === 'blue' && bluePlayerType === 'computer') || 
           (currentPlayer === 'red' && redPlayerType === 'computer');
}

function isBothPlayersComputer() {
    const bluePlayerType = document.querySelector('input[name="bluePlayerType"]:checked').value;
    const redPlayerType = document.querySelector('input[name="redPlayerType"]:checked').value;
    return bluePlayerType === 'computer' && redPlayerType === 'computer';
}

function updateScore() {
    if (currentPlayer === 'blue') {
        blueScore++;
    } else {
        redScore++;
    }
    document.getElementById('currentTurn').textContent = `Blue Score: ${blueScore}, Red Score: ${redScore}`;
}

function endGame(winner) {
    gameOver = true;
    const winnerText = winner
        ? `${winner.charAt(0).toUpperCase() + winner.slice(1)} wins!`
        : 'It\'s a draw!';
    document.getElementById('winnerDisplay').textContent = winnerText;
}

function isBoardFull() {
    return board.every(row => row.every(cell => cell !== ''));
}

window.onload = startNewGame;
