let boardSize = 8;
let currentPlayer = 'blue';
let board = [];
let gameOver = false;
let blueScore = 0;
let redScore = 0;
let gameMode = 'simple'; // Default game mode is 'simple'
let canvas, ctx;

// Start a new game
function startNewGame() {
    boardSize = parseInt(document.getElementById('boardSize').value);
    board = Array(boardSize).fill().map(() => Array(boardSize).fill(''));
    currentPlayer = 'blue';
    gameOver = false;
    blueScore = 0;
    redScore = 0;
    gameMode = document.querySelector('input[name="gameMode"]:checked').value; // Get game mode
    document.getElementById('winnerDisplay').textContent = '';

    // Set up canvas and draw the board
    setupCanvas();
    drawBoard();
}

// Setup the canvas for drawing
function setupCanvas() {
    const boardContainer = document.getElementById('gameBoard');
    boardContainer.innerHTML = '';  // Clear existing content

    const table = document.createElement('table');
    table.style.borderCollapse = 'collapse';
    for (let i = 0; i < boardSize; i++) {
        const row = document.createElement('tr');
        for (let j = 0; j < boardSize; j++) {
            const cell = document.createElement('td');
            cell.style.width = '50px';
            cell.style.height = '50px';
            cell.style.border = '1px solid black';
            cell.style.textAlign = 'center';
            cell.style.fontSize = '24px';
            cell.style.cursor = 'pointer';
            cell.dataset.row = i;
            cell.dataset.col = j;
            cell.addEventListener('click', handleCellClick);
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
        canvas.style.pointerEvents = 'none';  // Allow clicks through the canvas
        ctx = canvas.getContext('2d');
        boardContainer.appendChild(canvas);
    } else {
        ctx.clearRect(0, 0, canvas.width, canvas.height); // Clear previous drawings
    }
}

// Draw the board
function drawBoard() {
    const table = document.querySelector('table');
    for (let i = 0; i < boardSize; i++) {
        for (let j = 0; j < boardSize; j++) {
            const cell = table.rows[i].cells[j];
            cell.textContent = board[i][j];
        }
    }
}

// Handle cell click event
function handleCellClick(event) {
    const row = parseInt(event.target.dataset.row);
    const col = parseInt(event.target.dataset.col);

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

// Switch the current player
function switchPlayer() {
    currentPlayer = currentPlayer === 'blue' ? 'red' : 'blue';
}

// Check if the board is full
function isBoardFull() {
    return board.every(row => row.every(cell => cell !== ''));
}

// End the game and display the winner
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
