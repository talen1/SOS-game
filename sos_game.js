// Global variables
let boardSize = 8;
let currentPlayer = 'blue';
let board = [];
let gameOver = false;
let blueScore = 0;
let redScore = 0;
let gameMode = 'simple';
let ctx;
let gameHistory = []; // For recording moves
let isRecording = false; // To enable/disable recording

function startNewGame() {
    boardSize = parseInt(document.getElementById('boardSize').value);
    board = Array(boardSize).fill().map(() => Array(boardSize).fill(''));
    currentPlayer = 'blue';
    gameOver = false;
    blueScore = 0;
    redScore = 0;
    isRecording = document.getElementById('recordGame').checked;
    gameHistory = []; // Reset game history

    document.getElementById('winnerDisplay').textContent = '';
    document.getElementById('currentTurn').textContent = `Current turn: ${currentPlayer}`;
    document.getElementById('saveGameButton').disabled = true; // Disable save button until the game ends

    setupCanvas();
    drawBoard();

    if (isBothPlayersComputer()) {
        setTimeout(playComputerVsComputer, 500);
    }
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
    if (gameOver || isComputerTurn()) return;

    const row = parseInt(event.target.dataset.row);
    const col = parseInt(event.target.dataset.col);

    if (board[row][col] !== '') return;

    const piece = currentPlayer === 'blue'
        ? document.querySelector('input[name="bluePiece"]:checked').value
        : document.querySelector('input[name="redPiece"]:checked').value;

    board[row][col] = piece;
    if (isRecording) {
        gameHistory.push({ player: currentPlayer, row, col, piece }); // Record move
    }

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
            updateScore(); // Player continues turn if SOS is formed
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
            : document.querySelector('input[name="redPiece"]:checked').value;

        board[row][col] = piece;
        if (isRecording) {
            gameHistory.push({ player: currentPlayer, row, col, piece });
        }

        drawBoard();

        const sosFormed = checkForSOS(row, col);

        if (gameMode === 'simple') {
            if (sosFormed) {
                endGame(currentPlayer);
                return;
            }
            if (isBoardFull()) {
                endGame(null);
                return;
            }
        } else if (gameMode === 'general') {
            if (sosFormed) {
                updateScore(); // Computer continues turn if SOS is formed
            } else {
                switchPlayer();
            }
        }

        if (!gameOver && !sosFormed) {
            switchPlayer();
        }

        if (!gameOver && isComputerTurn()) {
            setTimeout(makeComputerMove, 500);
        }
    }
}

// LLM-powered computer move function
async function makeComputerMoveWithLLM() {
    if (gameOver) return;

    try {
        const boardState = {
            board: board,
            currentPlayer: currentPlayer,
            bluePiece: document.querySelector('input[name="bluePiece"]:checked').value,
            redPiece: document.querySelector('input[name="redPiece"]:checked').value,
            gameMode: gameMode
        };

        const prompt = `Given this board state, suggest the best move for player "${currentPlayer}".\n\n${JSON.stringify(boardState)}`;

        const response = await fetch('https://api.openai.com/v1/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer YOUR_API_KEY`
            },
            body: JSON.stringify({
                model: 'text-davinci-003',
                prompt: prompt,
                max_tokens: 100
            })
        });

        const data = await response.json();
        const move = JSON.parse(data.choices[0].text.trim());

        const { row, col, piece } = move;
        if (board[row][col] === '') {
            board[row][col] = piece;

            if (isRecording) {
                gameHistory.push({ player: currentPlayer, row, col, piece });
            }

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
                setTimeout(makeComputerMoveWithLLM, 500);
            }
        }
    } catch (error) {
        console.error('Error during LLM move generation:', error);
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
    const useLLM = (bluePlayerType === 'computer' && currentPlayer === 'blue') ||
                   (redPlayerType === 'computer' && currentPlayer === 'red');

    if (useLLM) {
        makeComputerMoveWithLLM();
        return true;
    }
    return false;
}

function isBothPlayersComputer() {
    const bluePlayerType = document.querySelector('input[name="bluePlayerType"]:checked').value;
    const redPlayerType = document.querySelector('input[name="redPlayerType"]:checked').value;
    return bluePlayerType === 'computer' && redPlayerType === 'computer';
}

function playComputerVsComputer() {
    if (!gameOver) {
        makeComputerMoveWithLLM();
        if (!gameOver) {
            setTimeout(playComputerVsComputer, 500);
        }
    }
}

function checkForSOS(row, col) {
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
            boardState: board.map(row => [...row]),
            mode: gameMode
        });
        document.getElementById('saveGameButton').disabled = false;
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

function importGame() {
    const fileInput = document.getElementById('importGame');
    const file = fileInput.files[0];

    if (!file) {
        alert('Please select a file to import.');
        return;
    }

    const reader = new FileReader();
    reader.onload = function (e) {
        try {
            const gameData = JSON.parse(e.target.result);

            if (!validateGameData(gameData)) {
                alert('Invalid game file format.');
                return;
            }

            boardSize = gameData.boardSize;
            gameMode = gameData.gameMode;
            blueScore = gameData.blueScore || 0;
            redScore = gameData.redScore || 0;
            board = Array(boardSize).fill().map(() => Array(boardSize).fill(''));
            currentPlayer = 'blue';
            gameOver = false;

            setupCanvas();
            drawBoard();

            replayMoves(gameData.moves);

        } catch (error) {
            console.error('Error importing game:', error);
            alert('Failed to import game.');
        }
    };

    reader.readAsText(file);
}

function validateGameData(gameData) {
    return gameData &&
        typeof gameData.boardSize === 'number' &&
        Array.isArray(gameData.moves) &&
        typeof gameData.gameMode === 'string' &&
        (gameData.gameMode === 'simple' || gameData.gameMode === 'general');
}

function replayMoves(moves) {
    for (let i = 0; i < moves.length; i++) {
        const move = moves[i];
        const { player, row, col, piece } = move;

        board[row][col] = piece;

        drawBoard();

        if (i < moves.length - 1) {
            setTimeout(() => {}, 500);
        }
    }

    document.getElementById('currentTurn').textContent = `Game Imported: ${gameMode.toUpperCase()} Mode`;
}

window.onload = startNewGame;
