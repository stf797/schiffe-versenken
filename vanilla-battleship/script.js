/**
 * Battleship Game Logic
 */

// --- Audio Context for procedural sound effects ---
const AudioContext = window.AudioContext || window.webkitAudioContext;
let audioCtx;

function initAudio() {
    if (!audioCtx) {
        audioCtx = new AudioContext();
    }
    if (audioCtx.state === 'suspended') {
        audioCtx.resume();
    }
}

function playSound(type) {
    if (!audioCtx) return;
    
    const osc = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();
    
    osc.connect(gainNode);
    gainNode.connect(audioCtx.destination);
    
    const now = audioCtx.currentTime;
    
    if (type === 'hit') {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(150, now);
        osc.frequency.exponentialRampToValueAtTime(40, now + 0.3);
        gainNode.gain.setValueAtTime(0.5, now);
        gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
        osc.start(now);
        osc.stop(now + 0.3);
    } else if (type === 'miss') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(300, now);
        osc.frequency.exponentialRampToValueAtTime(200, now + 0.2);
        gainNode.gain.setValueAtTime(0.3, now);
        gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
        osc.start(now);
        osc.stop(now + 0.2);
    } else if (type === 'win') {
        osc.type = 'square';
        osc.frequency.setValueAtTime(400, now);
        osc.frequency.setValueAtTime(500, now + 0.1);
        osc.frequency.setValueAtTime(600, now + 0.2);
        gainNode.gain.setValueAtTime(0.3, now);
        gainNode.gain.linearRampToValueAtTime(0, now + 0.6);
        osc.start(now);
        osc.stop(now + 0.6);
    } else if (type === 'lose') {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(200, now);
        osc.frequency.linearRampToValueAtTime(100, now + 0.6);
        gainNode.gain.setValueAtTime(0.3, now);
        gainNode.gain.linearRampToValueAtTime(0, now + 0.6);
        osc.start(now);
        osc.stop(now + 0.6);
    }
}

// --- Game Constants & Configuration ---
const GRID_SIZE = 10;
const SHIP_TYPES = [
    { name: 'Carrier', size: 5 },
    { name: 'Battleship', size: 4 },
    { name: 'Battleship', size: 4 },
    { name: 'Cruiser', size: 3 },
    { name: 'Cruiser', size: 3 },
    { name: 'Cruiser', size: 3 },
    { name: 'Submarine', size: 3 },
    { name: 'Submarine', size: 3 },
    { name: 'Destroyer', size: 2 },
    { name: 'Destroyer', size: 2 }
];

// --- Classes ---
class Ship {
    constructor(name, size) {
        this.name = name;
        this.size = size;
        this.hits = 0;
        this.cells = [];
    }

    hit() {
        this.hits++;
    }

    isSunk() {
        return this.hits >= this.size;
    }
}

class Board {
    constructor(isComputer = false) {
        this.isComputer = isComputer;
        this.grid = Array(GRID_SIZE).fill(null).map(() => Array(GRID_SIZE).fill(null));
        this.ships = [];
        this.misses = [];
        this.sunkenShips = 0;
    }

    canPlaceShip(shipSize, row, col, isHorizontal) {
        if (isHorizontal) {
            if (col + shipSize > GRID_SIZE) return false;
            for (let i = 0; i < shipSize; i++) {
                if (this.grid[row][col + i] !== null) return false;
            }
        } else {
            if (row + shipSize > GRID_SIZE) return false;
            for (let i = 0; i < shipSize; i++) {
                if (this.grid[row + i][col] !== null) return false;
            }
        }
        return true;
    }

    placeShip(ship, row, col, isHorizontal) {
        if (!this.canPlaceShip(ship.size, row, col, isHorizontal)) return false;

        for (let i = 0; i < ship.size; i++) {
            if (isHorizontal) {
                this.grid[row][col + i] = ship;
                ship.cells.push({ row, col: col + i });
            } else {
                this.grid[row + i][col] = ship;
                ship.cells.push({ row: row + i, col });
            }
        }
        this.ships.push(ship);
        return true;
    }

    placeShipsRandomly() {
        for (const type of SHIP_TYPES) {
            const ship = new Ship(type.name, type.size);
            let placed = false;
            while (!placed) {
                const row = Math.floor(Math.random() * GRID_SIZE);
                const col = Math.floor(Math.random() * GRID_SIZE);
                const isHorizontal = Math.random() > 0.5;
                placed = this.placeShip(ship, row, col, isHorizontal);
            }
        }
    }

    receiveAttack(row, col) {
        if (this.grid[row][col] === 'miss' || this.grid[row][col] === 'hit') {
            return 'invalid'; // Already attacked here
        }

        const target = this.grid[row][col];
        if (target !== null) {
            // Hit a ship
            target.hit();
            this.grid[row][col] = 'hit';
            if (target.isSunk()) {
                this.sunkenShips++;
                return { status: 'sunk', ship: target };
            }
            return { status: 'hit', ship: target };
        } else {
            // Miss
            this.grid[row][col] = 'miss';
            this.misses.push({ row, col });
            return { status: 'miss', ship: null };
        }
    }

    allShipsSunk() {
        return this.sunkenShips === SHIP_TYPES.length;
    }
}

// --- Game State & UI Controller ---
const ui = {
    startScreen: document.getElementById('start-screen'),
    gameScreen: document.getElementById('game-screen'),
    gameOverScreen: document.getElementById('game-over-screen'),
    playerGrid: document.getElementById('player-grid'),
    computerGrid: document.getElementById('computer-grid'),
    messageText: document.getElementById('message-text'),
    setupControls: document.getElementById('setup-controls'),
    rotateBtn: document.getElementById('rotate-btn'),
    currentShipText: document.getElementById('current-ship-to-place'),
    playerShipsBadge: document.getElementById('player-ships-left'),
    computerShipsBadge: document.getElementById('computer-ships-left'),
    computerOverlay: document.getElementById('computer-overlay'),
    gameOverTitle: document.getElementById('game-over-title'),
    gameOverText: document.getElementById('game-over-text')
};

let gameState = 'start'; // start, setup, playing, gameover
let playerBoard;
let computerBoard;
let currentShipIndex = 0;
let isHorizontalPlacement = true;

// Computer AI state
let aiPotentialTargets = [];

function initGame() {
    playerBoard = new Board(false);
    computerBoard = new Board(true);
    computerBoard.placeShipsRandomly();
    
    currentShipIndex = 0;
    isHorizontalPlacement = true;
    aiPotentialTargets = [];
    gameState = 'setup';
    
    updateUI();
    createGridElements(ui.playerGrid, true);
    createGridElements(ui.computerGrid, false);
    
    ui.messageText.innerText = "Place your fleet!";
    ui.computerOverlay.classList.add('active');
    ui.setupControls.classList.add('active');
    ui.computerGrid.classList.add('disabled');
    
    ui.playerShipsBadge.innerText = `${SHIP_TYPES.length} Ships`;
    ui.computerShipsBadge.innerText = `${SHIP_TYPES.length} Ships`;
}

function updateUI() {
    if (gameState === 'setup') {
        if (currentShipIndex < SHIP_TYPES.length) {
            const ship = SHIP_TYPES[currentShipIndex];
            ui.currentShipText.innerText = `Placing: ${ship.name} (Size: ${ship.size})`;
        } else {
            startGameplay();
        }
    }
}

function createGridElements(container, isPlayer) {
    container.innerHTML = '';
    for (let r = 0; r < GRID_SIZE; r++) {
        for (let c = 0; c < GRID_SIZE; c++) {
            const cell = document.createElement('div');
            cell.classList.add('cell');
            cell.dataset.r = r;
            cell.dataset.c = c;
            
            if (isPlayer) {
                cell.addEventListener('mouseover', handlePlayerCellHover);
                cell.addEventListener('mouseout', handlePlayerCellOut);
                cell.addEventListener('click', handlePlayerCellClick);
            } else {
                cell.addEventListener('click', handleComputerCellClick);
            }
            container.appendChild(cell);
        }
    }
}

function renderPlayerBoard() {
    for (let r = 0; r < GRID_SIZE; r++) {
        for (let c = 0; c < GRID_SIZE; c++) {
            const val = playerBoard.grid[r][c];
            const cellElem = ui.playerGrid.querySelector(`.cell[data-r="${r}"][data-c="${c}"]`);
            cellElem.className = 'cell'; // reset
            if (val === 'hit') cellElem.classList.add('hit');
            else if (val === 'miss') cellElem.classList.add('miss');
            else if (val instanceof Ship) cellElem.classList.add('ship');
        }
    }
    ui.playerShipsBadge.innerText = `${SHIP_TYPES.length - playerBoard.sunkenShips} Alive`;
}

function renderComputerBoard() {
    for (let r = 0; r < GRID_SIZE; r++) {
        for (let c = 0; c < GRID_SIZE; c++) {
            const val = computerBoard.grid[r][c];
            const cellElem = ui.computerGrid.querySelector(`.cell[data-r="${r}"][data-c="${c}"]`);
            cellElem.className = 'cell'; // reset
            if (val === 'hit') cellElem.classList.add('hit');
            else if (val === 'miss') cellElem.classList.add('miss');
            // Do not show ships
        }
    }
    ui.computerShipsBadge.innerText = `${SHIP_TYPES.length - computerBoard.sunkenShips} Alive`;
}

function handlePlayerCellHover(e) {
    if (gameState !== 'setup' || currentShipIndex >= SHIP_TYPES.length) return;
    
    const r = parseInt(e.target.dataset.r);
    const c = parseInt(e.target.dataset.c);
    const size = SHIP_TYPES[currentShipIndex].size;
    
    const isValid = playerBoard.canPlaceShip(size, r, c, isHorizontalPlacement);
    const cls = isValid ? 'preview' : 'preview-invalid';
    
    for (let i = 0; i < size; i++) {
        let pr = isHorizontalPlacement ? r : r + i;
        let pc = isHorizontalPlacement ? c + i : c;
        if (pr < GRID_SIZE && pc < GRID_SIZE) {
            const cell = ui.playerGrid.querySelector(`.cell[data-r="${pr}"][data-c="${pc}"]`);
            if(cell) cell.classList.add(cls);
        }
    }
}

function handlePlayerCellOut(e) {
    if (gameState !== 'setup') return;
    document.querySelectorAll('.cell').forEach(c => {
        c.classList.remove('preview', 'preview-invalid');
    });
}

function handlePlayerCellClick(e) {
    if (gameState !== 'setup' || currentShipIndex >= SHIP_TYPES.length) return;
    
    const r = parseInt(e.target.dataset.r);
    const c = parseInt(e.target.dataset.c);
    const shipDef = SHIP_TYPES[currentShipIndex];
    
    const ship = new Ship(shipDef.name, shipDef.size);
    if (playerBoard.placeShip(ship, r, c, isHorizontalPlacement)) {
        currentShipIndex++;
        handlePlayerCellOut(); // clear preview
        renderPlayerBoard();
        updateUI();
    } else {
        // Invalid placement feedback
        e.target.classList.add('preview-invalid');
        setTimeout(() => e.target.classList.remove('preview-invalid'), 200);
    }
}

function startGameplay() {
    gameState = 'playing';
    ui.setupControls.classList.remove('active');
    ui.computerOverlay.classList.remove('active');
    ui.computerGrid.classList.remove('disabled');
    ui.messageText.innerText = "Commander, initiate the attack!";
}

function handleComputerCellClick(e) {
    if (gameState !== 'playing') return;
    
    const r = parseInt(e.target.dataset.r);
    const c = parseInt(e.target.dataset.c);
    
    const result = computerBoard.receiveAttack(r, c);
    if (result === 'invalid') return; // clicked already attacked cell
    
    // Process attack
    const cellElem = e.target;
    if (result.status === 'hit') {
        playSound('hit');
        cellElem.classList.add('hit');
        ui.messageText.innerText = "Direct Hit!";
    } else if (result.status === 'sunk') {
        playSound('hit');
        cellElem.classList.add('hit');
        ui.messageText.innerText = `You sunk the enemy's ${result.ship.name}!`;
    } else {
        playSound('miss');
        cellElem.classList.add('miss');
        ui.messageText.innerText = "Miss!";
    }
    
    renderComputerBoard();
    checkGameOver();
    
    if (gameState === 'playing') {
        // Computer's turn
        gameState = 'computer_turn';
        ui.computerGrid.classList.add('disabled');
        setTimeout(computerTurn, 800); // delay for realism
    }
}

function getValidRandomTarget() {
    let r, c;
    do {
        r = Math.floor(Math.random() * GRID_SIZE);
        c = Math.floor(Math.random() * GRID_SIZE);
    } while (playerBoard.grid[r][c] === 'hit' || playerBoard.grid[r][c] === 'miss');
    return { r, c };
}

function computerTurn() {
    if (gameState !== 'computer_turn') return;
    
    let target;
    
    // Smart Targeting AI
    if (aiPotentialTargets.length > 0) {
        // Find a valid potential target
        let validTargetFound = false;
        while (aiPotentialTargets.length > 0 && !validTargetFound) {
            target = aiPotentialTargets.pop();
            const val = playerBoard.grid[target.r][target.c];
            if (val !== 'hit' && val !== 'miss') {
                validTargetFound = true;
            }
        }
        if (!validTargetFound) {
            target = getValidRandomTarget();
        }
    } else {
        target = getValidRandomTarget();
    }
    
    const result = playerBoard.receiveAttack(target.r, target.c);
    
    if (result.status === 'hit' || result.status === 'sunk') {
        playSound('hit');
        ui.messageText.innerText = "Computer Hit!";
        
        // Add adjacent cells to potential targets
        const dirs = [[-1, 0], [1, 0], [0, -1], [0, 1]];
        dirs.forEach(d => {
            const nr = target.r + d[0];
            const nc = target.c + d[1];
            if (nr >= 0 && nr < GRID_SIZE && nc >= 0 && nc < GRID_SIZE) {
                const val = playerBoard.grid[nr][nc];
                if (val !== 'hit' && val !== 'miss') {
                    // Check if not already in array
                    if (!aiPotentialTargets.find(t => t.r === nr && t.c === nc)) {
                        aiPotentialTargets.push({ r: nr, c: nc });
                    }
                }
            }
        });
        
        if (result.status === 'sunk') {
            ui.messageText.innerText = `Computer sunk your ${result.ship.name}!`;
            // Optional: AI could clear targets if it thinks the ship is sunk, 
            // but keeping them handles adjacent ships.
        }
    } else {
        playSound('miss');
        ui.messageText.innerText = "Computer Missed!";
    }
    
    renderPlayerBoard();
    checkGameOver();
    
    if (gameState === 'computer_turn') {
        gameState = 'playing';
        ui.computerGrid.classList.remove('disabled');
    }
}

function checkGameOver() {
    if (computerBoard.allShipsSunk()) {
        gameState = 'gameover';
        playSound('win');
        ui.gameOverTitle.innerText = "VICTORY!";
        ui.gameOverTitle.style.background = "linear-gradient(135deg, #10b981, #3b82f6)";
        ui.gameOverTitle.style.webkitBackgroundClip = "text";
        ui.gameOverText.innerText = "You annihilated the enemy fleet.";
        ui.gameOverScreen.classList.add('active');
    } else if (playerBoard.allShipsSunk()) {
        gameState = 'gameover';
        playSound('lose');
        ui.gameOverTitle.innerText = "DEFEAT";
        ui.gameOverTitle.style.background = "linear-gradient(135deg, #ef4444, #f97316)";
        ui.gameOverTitle.style.webkitBackgroundClip = "text";
        ui.gameOverText.innerText = "The enemy destroyed your forces.";
        ui.gameOverScreen.classList.add('active');
    }
}

// --- Event Listeners ---
document.getElementById('start-btn').addEventListener('click', () => {
    initAudio();
    ui.startScreen.classList.remove('active');
    ui.gameScreen.classList.add('active');
    initGame();
});

document.getElementById('restart-btn').addEventListener('click', () => {
    initGame();
});

document.getElementById('play-again-btn').addEventListener('click', () => {
    ui.gameOverScreen.classList.remove('active');
    initGame();
});

ui.rotateBtn.addEventListener('click', () => {
    isHorizontalPlacement = !isHorizontalPlacement;
    ui.rotateBtn.innerText = `Rotate: ${isHorizontalPlacement ? 'Horizontal' : 'Vertical'}`;
});
