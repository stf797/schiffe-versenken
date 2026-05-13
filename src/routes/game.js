// @ts-nocheck
import { supabase } from '../lib/supabaseClient.js';

export function initBattleship() {
    /**
     * Battleship Game Logic - 1P and 2P Local Mode
     */

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

    let GRID_SIZE = 10;
    let aiDifficulty = 'medium'; // 'easy', 'medium', 'hard'

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

    class Ship {
        constructor(name, size) {
            this.name = name;
            this.size = size;
            this.hits = 0;
            this.cells = [];
        }
        hit() { this.hits++; }
        isSunk() { return this.hits >= this.size; }
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
            if (this.grid[row][col] === 'miss' || this.grid[row][col] === 'hit') return 'invalid';
            const target = this.grid[row][col];
            if (target !== null) {
                target.hit();
                this.grid[row][col] = 'hit';
                if (target.isSunk()) {
                    this.sunkenShips++;
                    return { status: 'sunk', ship: target };
                }
                return { status: 'hit', ship: target };
            } else {
                this.grid[row][col] = 'miss';
                this.misses.push({ row, col });
                return { status: 'miss', ship: null };
            }
        }

        receiveSonar(r, c) {
            const cells = [];
            const dirs = [[0, 0], [-1, 0], [1, 0], [0, -1], [0, 1]];
            for (let [dr, dc] of dirs) {
                const nr = r + dr, nc = c + dc;
                if (nr >= 0 && nr < GRID_SIZE && nc >= 0 && nc < GRID_SIZE) {
                    const hasShip = this.grid[nr][nc] instanceof Ship || this.grid[nr][nc] === 'hit';
                    cells.push({ r: nr, c: nc, hasShip });
                }
            }
            return cells;
        }

        receiveTorpedo(r, c) {
            if (this.grid[r][c] === 'miss' || this.grid[r][c] === 'hit') return 'invalid';
            const target = this.grid[r][c];
            if (target instanceof Ship) {
                const affectedCells = [];
                // Destroy the entire ship
                target.cells.forEach(cell => {
                    if (this.grid[cell.row][cell.col] !== 'hit') {
                        target.hit();
                        this.grid[cell.row][cell.col] = 'hit';
                    }
                    affectedCells.push({ r: cell.row, c: cell.col });
                });
                if (target.isSunk()) {
                    this.sunkenShips++;
                }
                return { status: 'destroyed', ship: target, cells: affectedCells };
            } else {
                this.grid[r][c] = 'miss';
                this.misses.push({ r, c });
                return { status: 'miss', ship: null, cells: [{ r, c }] };
            }
        }

        allShipsSunk() {
            return this.sunkenShips === SHIP_TYPES.length;
        }
    }

    const ui = {
        startScreen: document.getElementById('start-screen'),
        gameScreen: document.getElementById('game-screen'),
        passScreen: document.getElementById('pass-screen'),
        gameOverScreen: document.getElementById('game-over-screen'),

        startBtn1p: document.getElementById('start-btn-1p'),
        startBtn2p: document.getElementById('start-btn-2p'),
        passTitle: document.getElementById('pass-title'),
        passText: document.getElementById('pass-text'),
        passBtn: document.getElementById('pass-btn'),

        leftGrid: document.getElementById('player-grid'),
        rightGrid: document.getElementById('computer-grid'),
        leftPanelTitle: document.getElementById('left-panel-title'),
        rightPanelTitle: document.getElementById('right-panel-title'),

        messageText: document.getElementById('message-text'),
        setupControls: document.getElementById('setup-controls'),
        powerupControls: document.getElementById('powerup-controls'),
        rotateBtn: document.getElementById('rotate-btn'),
        currentShipText: document.getElementById('current-ship-to-place'),
        leftShipsBadge: document.getElementById('player-ships-left'),
        rightShipsBadge: document.getElementById('computer-ships-left'),
        rightOverlay: document.getElementById('computer-overlay'),

        btnSonar: document.getElementById('btn-sonar'),
        btnTorpedo: document.getElementById('btn-torpedo'),
        badgeSonar: document.getElementById('badge-sonar'),
        badgeTorpedo: document.getElementById('badge-torpedo'),

        gameOverTitle: document.getElementById('game-over-title'),
        gameOverText: document.getElementById('game-over-text'),
        playAgainBtn: document.getElementById('play-again-btn'),
        restartBtn: document.getElementById('restart-btn'),

        settingsScreen: document.getElementById('settings-screen'),
        settingsBtn: document.getElementById('settings-btn'),
        settingsSaveBtn: document.getElementById('settings-save-btn'),
        settingAiDifficulty: document.getElementById('setting-ai-difficulty'),
        settingGridSize: document.getElementById('setting-grid-size'),

        logoBtn: document.getElementById('header-logo-btn'),
        homeBtn: document.getElementById('home-btn'),
        profileBtn: document.getElementById('profile-btn'),
        
        authScreen: document.getElementById('auth-screen'),
        authTitle: document.getElementById('auth-title'),
        authError: document.getElementById('auth-error'),
        authEmail: document.getElementById('auth-email'),
        authPassword: document.getElementById('auth-password'),
        authSubmitBtn: document.getElementById('auth-submit-btn'),
        authToggleBtn: document.getElementById('auth-toggle-btn'),
        authCloseBtn: document.getElementById('auth-close-btn'),
        
        statsBtn: document.getElementById('stats-btn'),
        statsScreen: document.getElementById('stats-screen'),
        statsLoginMsg: document.getElementById('stats-login-msg'),
        statsGrid: document.getElementById('stats-grid'),
        statGames: document.getElementById('stat-games'),
        statWins: document.getElementById('stat-wins'),
        statLosses: document.getElementById('stat-losses'),
        statWinrate: document.getElementById('stat-winrate'),
        statPowerups: document.getElementById('stat-powerups'),
        statsCloseBtn: document.getElementById('stats-close-btn'),
        
        leaderboardBtn: document.getElementById('leaderboard-btn'),
        leaderboardScreen: document.getElementById('leaderboard-screen'),
        leaderboardLoading: document.getElementById('leaderboard-loading'),
        leaderboardEmpty: document.getElementById('leaderboard-empty'),
        leaderboardTableWrapper: document.getElementById('leaderboard-table-wrapper'),
        leaderboardTbody: document.getElementById('leaderboard-tbody'),
        leaderboardCloseBtn: document.getElementById('leaderboard-close-btn')
    };

    let gameMode = '1p'; // '1p' or '2p'
    let gameState = 'start'; // start, setup, playing, transition, gameover
    let activePlayer = 1; // 1 or 2
    let board1, board2;
    let currentShipIndex = 0;
    let isHorizontalPlacement = true;
    let aiPotentialTargets = [];

    const STARTING_POWERUPS = { sonar: 1, torpedo: 1 };
    let p1PowerUps = { ...STARTING_POWERUPS };
    let p2PowerUps = { ...STARTING_POWERUPS };
    let cpuPowerUps = { ...STARTING_POWERUPS };
    let activePowerUp = null; // null | 'sonar' | 'torpedo'

    let currentUser = null;
    let authMode = 'login'; // 'login' or 'signup'

    function getActiveBoard() { return activePlayer === 1 ? board1 : board2; }
    function getEnemyBoard() { return activePlayer === 1 ? board2 : board1; }

    function getActivePowerUps() {
        if (activePlayer === 1) return p1PowerUps;
        return gameMode === '2p' ? p2PowerUps : cpuPowerUps;
    }

    function initGame(mode) {
        initAudio();
        gameMode = mode;
        board1 = new Board(false);
        board2 = new Board(mode === '1p');

        if (mode === '1p') board2.placeShipsRandomly();

        aiPotentialTargets = [];
        activePlayer = 1;
        p1PowerUps = { ...STARTING_POWERUPS };
        p2PowerUps = { ...STARTING_POWERUPS };
        cpuPowerUps = { ...STARTING_POWERUPS };
        activePowerUp = null;
        gameState = 'setup';

        ui.startScreen.classList.remove('active');
        ui.gameOverScreen.classList.remove('active');
        ui.gameScreen.classList.add('active');

        setupMode();
    }

    function setupMode() {
        currentShipIndex = 0;
        isHorizontalPlacement = true;

        ui.leftGrid.innerHTML = '';
        ui.rightGrid.innerHTML = '';
        createGridElements(ui.leftGrid, true);
        createGridElements(ui.rightGrid, false);

        ui.rightOverlay.classList.add('active');
        ui.setupControls.classList.add('active');
        ui.rightGrid.classList.add('disabled');

        ui.leftShipsBadge.innerText = `${SHIP_TYPES.length} Ships`;
        ui.rightShipsBadge.innerText = `${SHIP_TYPES.length} Ships`;

        if (gameMode === '2p') {
            ui.leftPanelTitle.innerText = `Player ${activePlayer} Fleet`;
            ui.rightPanelTitle.innerText = `Player ${activePlayer === 1 ? 2 : 1} Fleet`;
            ui.messageText.innerText = `Player ${activePlayer}: Place your fleet!`;
        } else {
            ui.leftPanelTitle.innerText = 'Your Fleet';
            ui.rightPanelTitle.innerText = 'Enemy Fleet';
            ui.messageText.innerText = "Place your fleet!";
        }

        updateUI();
        renderLeftBoard();
    }

    function showPassScreen(title, text, callback) {
        ui.leftGrid.style.opacity = '0';
        ui.rightGrid.style.opacity = '0';
        ui.passTitle.innerText = title;
        ui.passText.innerHTML = text;
        ui.passScreen.classList.add('active');

        const handler = () => {
            ui.passScreen.classList.remove('active');
            ui.leftGrid.style.opacity = '1';
            ui.rightGrid.style.opacity = '1';
            ui.passBtn.removeEventListener('click', handler);
            if (callback) callback();
        };
        ui.passBtn.addEventListener('click', handler);
    }

    function updateUI() {
        if (gameState === 'setup') {
            if (currentShipIndex < SHIP_TYPES.length) {
                const ship = SHIP_TYPES[currentShipIndex];
                ui.currentShipText.innerText = `Placing: ${ship.name} (Size: ${ship.size})`;
            } else {
                if (gameMode === '2p' && activePlayer === 1) {
                    activePlayer = 2;
                    gameState = 'transition';
                    showPassScreen("Player 2's Turn", "Hand the device to Player 2 to place their ships.", () => {
                        gameState = 'setup';
                        setupMode();
                    });
                } else {
                    activePlayer = 1;
                    if (gameMode === '2p') {
                        gameState = 'transition';
                        showPassScreen("Battle Begins!", "Hand the device back to Player 1.<br>Prepare for combat!", () => {
                            startGameplay();
                        });
                    } else {
                        startGameplay();
                    }
                }
            }
        } else if (gameState === 'playing') {
            const powerUps = getActivePowerUps();
            ui.badgeSonar.innerText = powerUps.sonar;
            ui.badgeTorpedo.innerText = powerUps.torpedo;

            ui.btnSonar.disabled = powerUps.sonar <= 0;
            ui.btnTorpedo.disabled = powerUps.torpedo <= 0;

            ui.btnSonar.classList.toggle('armed', activePowerUp === 'sonar');
            ui.btnTorpedo.classList.toggle('armed', activePowerUp === 'torpedo');

            ui.rightGrid.classList.toggle('targeting-sonar', activePowerUp === 'sonar');
            ui.rightGrid.classList.toggle('targeting-torpedo', activePowerUp === 'torpedo');

            if (activePowerUp === 'sonar') ui.messageText.innerText = "Sonar Armed! Click an enemy cell to scan.";
            else if (activePowerUp === 'torpedo') ui.messageText.innerText = "Torpedo Armed! Click to fire.";
            else ui.messageText.innerText = "Commander, initiate the attack!";
        }
    }

    function createGridElements(container, isInteractive) {
        container.style.gridTemplateColumns = `repeat(${GRID_SIZE}, 1fr)`;
        container.style.gridTemplateRows = `repeat(${GRID_SIZE}, 1fr)`;
        for (let r = 0; r < GRID_SIZE; r++) {
            for (let c = 0; c < GRID_SIZE; c++) {
                const cell = document.createElement('div');
                cell.classList.add('cell');
                cell.dataset.r = r;
                cell.dataset.c = c;
                if (isInteractive) {
                    cell.addEventListener('mouseover', handleLeftCellHover);
                    cell.addEventListener('mouseout', handleLeftCellOut);
                    cell.addEventListener('click', handleLeftCellClick);
                } else {
                    cell.addEventListener('click', handleRightCellClick);
                }
                container.appendChild(cell);
            }
        }
    }

    function renderLeftBoard() {
        const board = getActiveBoard();
        for (let r = 0; r < GRID_SIZE; r++) {
            for (let c = 0; c < GRID_SIZE; c++) {
                const val = board.grid[r][c];
                const cellElem = ui.leftGrid.querySelector(`.cell[data-r="${r}"][data-c="${c}"]`);
                cellElem.className = 'cell';
                if (val === 'hit') cellElem.classList.add('hit');
                else if (val === 'miss') cellElem.classList.add('miss');
                else if (val instanceof Ship) cellElem.classList.add('ship');
            }
        }
        ui.leftShipsBadge.innerText = `${SHIP_TYPES.length - board.sunkenShips} Alive`;
    }

    function renderRightBoard() {
        const board = getEnemyBoard();
        for (let r = 0; r < GRID_SIZE; r++) {
            for (let c = 0; c < GRID_SIZE; c++) {
                const val = board.grid[r][c];
                const cellElem = ui.rightGrid.querySelector(`.cell[data-r="${r}"][data-c="${c}"]`);
                cellElem.className = 'cell';
                if (val === 'hit') cellElem.classList.add('hit');
                else if (val === 'miss') cellElem.classList.add('miss');
                // ships are hidden
            }
        }
        ui.rightShipsBadge.innerText = `${SHIP_TYPES.length - board.sunkenShips} Alive`;
    }

    function handleLeftCellHover(e) {
        if (gameState !== 'setup' || currentShipIndex >= SHIP_TYPES.length) return;
        const r = parseInt(e.target.dataset.r);
        const c = parseInt(e.target.dataset.c);
        const size = SHIP_TYPES[currentShipIndex].size;

        const board = getActiveBoard();
        const isValid = board.canPlaceShip(size, r, c, isHorizontalPlacement);
        const cls = isValid ? 'preview' : 'preview-invalid';

        for (let i = 0; i < size; i++) {
            let pr = isHorizontalPlacement ? r : r + i;
            let pc = isHorizontalPlacement ? c + i : c;
            if (pr < GRID_SIZE && pc < GRID_SIZE) {
                const cell = ui.leftGrid.querySelector(`.cell[data-r="${pr}"][data-c="${pc}"]`);
                if (cell) cell.classList.add(cls);
            }
        }
    }

    function handleLeftCellOut() {
        if (gameState !== 'setup') return;
        ui.leftGrid.querySelectorAll('.cell').forEach(c => c.classList.remove('preview', 'preview-invalid'));
    }

    function handleLeftCellClick(e) {
        if (gameState !== 'setup' || currentShipIndex >= SHIP_TYPES.length) return;
        const r = parseInt(e.target.dataset.r);
        const c = parseInt(e.target.dataset.c);
        const shipDef = SHIP_TYPES[currentShipIndex];

        const board = getActiveBoard();
        const ship = new Ship(shipDef.name, shipDef.size);
        if (board.placeShip(ship, r, c, isHorizontalPlacement)) {
            currentShipIndex++;
            handleLeftCellOut();
            renderLeftBoard();
            updateUI();
        } else {
            e.target.classList.add('preview-invalid');
            setTimeout(() => e.target.classList.remove('preview-invalid'), 200);
        }
    }

    function startGameplay() {
        gameState = 'playing';
        activePowerUp = null;
        ui.setupControls.classList.remove('active');
        ui.powerupControls.style.display = 'flex';
        ui.rightOverlay.classList.remove('active');
        ui.rightGrid.classList.remove('disabled');

        ui.leftPanelTitle.innerText = gameMode === '2p' ? `Player ${activePlayer}'s Fleet` : 'Your Fleet';
        ui.rightPanelTitle.innerText = gameMode === '2p' ? `Enemy (Player ${activePlayer === 1 ? 2 : 1})` : 'Enemy Fleet';

        renderLeftBoard();
        renderRightBoard();
        updateUI();
    }

    function handleRightCellClick(e) {
        if (gameState !== 'playing') return;
        const r = parseInt(e.target.dataset.r);
        const c = parseInt(e.target.dataset.c);

        const enemyBoard = getEnemyBoard();
        const cellElem = e.target;

        // --- SONAR POWER-UP ---
        if (activePowerUp === 'sonar') {
            const scanResults = enemyBoard.receiveSonar(r, c);
            scanResults.forEach(scan => {
                const ce = ui.rightGrid.querySelector(`.cell[data-r="${scan.r}"][data-c="${scan.c}"]`);
                if (ce) {
                    ce.classList.add(scan.hasShip ? 'sonar-reveal-ship' : 'sonar-reveal-empty');
                    setTimeout(() => {
                        ce.classList.remove('sonar-reveal-ship', 'sonar-reveal-empty');
                    }, 1500);
                }
            });
            playSound('miss'); // Sonar ping sound
            ui.messageText.innerText = "Sonar Ping Complete!";

            if (currentUser && gameMode === '1p') {
                supabase.rpc('increment_stat', { row_id: currentUser.id, col_name: 'powerups_used', amount: 1 }).then();
            }

            getActivePowerUps().sonar--;
            activePowerUp = null;
            updateUI();

            ui.rightGrid.classList.add('disabled');
            setTimeout(endTurnTransition, 1500);
            return;
        }

        // --- TORPEDO POWER-UP ---
        if (activePowerUp === 'torpedo') {
            const result = enemyBoard.receiveTorpedo(r, c);
            if (result === 'invalid') return;

            if (result.status === 'destroyed') {
                playSound('hit');
                result.cells.forEach(cell => {
                    const ce = ui.rightGrid.querySelector(`.cell[data-r="${cell.r}"][data-c="${cell.c}"]`);
                    if (ce) {
                        ce.classList.add('hit', 'torpedo-explosion');
                        setTimeout(() => ce.classList.remove('torpedo-explosion'), 600);
                    }
                });
                ui.messageText.innerText = `TORPEDO HIT! ${result.ship.name} Destroyed!`;
            } else {
                playSound('miss');
                cellElem.classList.add('miss');
                ui.messageText.innerText = "Torpedo Missed!";
            }

            if (currentUser && gameMode === '1p') {
                supabase.rpc('increment_stat', { row_id: currentUser.id, col_name: 'powerups_used', amount: 1 }).then();
            }

            getActivePowerUps().torpedo--;
            activePowerUp = null;
            updateUI();
            renderRightBoard();

            if (checkGameOver()) return;
            ui.rightGrid.classList.add('disabled');
            setTimeout(endTurnTransition, 1500);
            return;
        }

        // --- NORMAL ATTACK ---
        const result = enemyBoard.receiveAttack(r, c);
        if (result === 'invalid') return;

        if (result.status === 'hit') {
            playSound('hit');
            cellElem.classList.add('hit');
            ui.messageText.innerText = "Direct Hit!";
        } else if (result.status === 'sunk') {
            playSound('hit');
            cellElem.classList.add('hit');
            ui.messageText.innerText = `You sunk an enemy ${result.ship.name}!`;
        } else {
            playSound('miss');
            cellElem.classList.add('miss');
            ui.messageText.innerText = "Miss!";
        }

        renderRightBoard();
        if (checkGameOver()) return;

        ui.rightGrid.classList.add('disabled');
        setTimeout(endTurnTransition, 1000);
    }

    function endTurnTransition() {
        if (gameMode === '1p') {
            gameState = 'computer_turn';
            setTimeout(computerTurn, 500);
        } else {
            gameState = 'transition';
            showPassScreen(`Player ${activePlayer === 1 ? 2 : 1}'s Turn`, "Pass the device. Ready your cannons!", () => {
                activePlayer = activePlayer === 1 ? 2 : 1;
                startGameplay();
            });
        }
    }

    function getValidRandomTarget() {
        let r, c;
        do {
            r = Math.floor(Math.random() * GRID_SIZE);
            c = Math.floor(Math.random() * GRID_SIZE);
        } while (board1.grid[r][c] === 'hit' || board1.grid[r][c] === 'miss');
        return { r, c };
    }

    function computerTurn() {
        if (gameState !== 'computer_turn') return;

        let usedPowerUp = false;

        // --- HARD MODE CHEATING ---
        if (aiDifficulty === 'hard' && Math.random() < 0.8) {
            // Hard AI cheats and directly finds a ship 80% of the time if not already hunting
            if (aiPotentialTargets.length === 0) {
                let foundShip = false;
                for (let r = 0; r < GRID_SIZE && !foundShip; r++) {
                    for (let c = 0; c < GRID_SIZE && !foundShip; c++) {
                        const val = board1.grid[r][c];
                        if (val instanceof Ship && val !== 'hit') {
                            aiPotentialTargets.push({ r, c });
                            foundShip = true;
                        }
                    }
                }
            }
        }

        // --- EASY MODE IGNORANCE ---
        if (aiDifficulty === 'easy' && Math.random() < 0.2) {
            // Easy AI forgets its targets 20% of the time
            aiPotentialTargets = [];
        }

        // --- TORPEDO USAGE ---
        if (cpuPowerUps.torpedo > 0 && aiPotentialTargets.length > 0) {
            // Easy rarely uses torpedo
            if (aiDifficulty !== 'easy' || Math.random() < 0.3) {
                let validTargetFound = false;
                let target;
                while (aiPotentialTargets.length > 0 && !validTargetFound) {
                    target = aiPotentialTargets.pop();
                    const val = board1.grid[target.r][target.c];
                    if (val !== 'hit' && val !== 'miss') validTargetFound = true;
                }
                if (validTargetFound) {
                    const result = board1.receiveTorpedo(target.r, target.c);
                    cpuPowerUps.torpedo--;
                    usedPowerUp = true;

                    if (result.status === 'destroyed') {
                        playSound('hit');
                        ui.messageText.innerText = `Computer Torpedo Destroyed your ${result.ship.name}!`;
                        aiPotentialTargets = [];
                    } else {
                        playSound('miss');
                        ui.messageText.innerText = "Computer Torpedo Missed!";
                    }
                }
            }
        }

        // --- SONAR USAGE ---
        if (!usedPowerUp && cpuPowerUps.sonar > 0 && aiPotentialTargets.length === 0) {
            let sonarChance = aiDifficulty === 'easy' ? 0.05 : 0.3; // 5% Easy, 30% Med/Hard
            if (Math.random() < sonarChance) {
                const target = getValidRandomTarget();
                const scanResults = board1.receiveSonar(target.r, target.c);
                cpuPowerUps.sonar--;
                usedPowerUp = true;
                playSound('miss');
                ui.messageText.innerText = "Computer used Sonar!";

                scanResults.forEach(scan => {
                    if (scan.hasShip) {
                        const val = board1.grid[scan.r][scan.c];
                        if (val !== 'hit' && val !== 'miss') {
                            if (!aiPotentialTargets.find(t => t.r === scan.r && t.c === scan.c)) {
                                aiPotentialTargets.push({ r: scan.r, c: scan.c });
                            }
                        }
                    }
                });
            }
        }

        if (!usedPowerUp) {
            // Normal turn
            let target;
            if (aiPotentialTargets.length > 0) {
                let validTargetFound = false;
                while (aiPotentialTargets.length > 0 && !validTargetFound) {
                    target = aiPotentialTargets.pop();
                    const val = board1.grid[target.r][target.c];
                    if (val !== 'hit' && val !== 'miss') validTargetFound = true;
                }
                if (!validTargetFound) target = getValidRandomTarget();
            } else {
                target = getValidRandomTarget();
            }

            // Easy mode intentionally misses 15% of the time
            if (aiDifficulty === 'easy' && Math.random() < 0.15) {
                target = getValidRandomTarget(); // Picks random, might still hit, but ignores potential targets
            }

            const result = board1.receiveAttack(target.r, target.c);

            if (result.status === 'hit' || result.status === 'sunk') {
                playSound('hit');
                ui.messageText.innerText = "Computer Hit!";
                const dirs = [[-1, 0], [1, 0], [0, -1], [0, 1]];
                dirs.forEach(d => {
                    const nr = target.r + d[0];
                    const nc = target.c + d[1];
                    if (nr >= 0 && nr < GRID_SIZE && nc >= 0 && nc < GRID_SIZE) {
                        const val = board1.grid[nr][nc];
                        if (val !== 'hit' && val !== 'miss') {
                            if (!aiPotentialTargets.find(t => t.r === nr && t.c === nc)) {
                                aiPotentialTargets.push({ r: nr, c: nc });
                            }
                        }
                    }
                });
                if (result.status === 'sunk') {
                    ui.messageText.innerText = `Computer sunk your ${result.ship.name}!`;
                }
            } else {
                playSound('miss');
                ui.messageText.innerText = "Computer Missed!";
            }
        }

        renderLeftBoard();
        if (checkGameOver()) return;

        setTimeout(() => {
            gameState = 'playing';
            ui.rightGrid.classList.remove('disabled');
            updateUI(); // refresh powerups panel for human
        }, 1500);
    }

    function checkGameOver() {
        if (board2.allShipsSunk()) {
            gameState = 'gameover';
            playSound('win');
            ui.gameOverTitle.innerText = gameMode === '2p' ? "PLAYER 1 WINS!" : "VICTORY!";
            ui.gameOverTitle.style.background = "linear-gradient(135deg, #10b981, #3b82f6)";
            ui.gameOverTitle.style.webkitBackgroundClip = "text";
            ui.gameOverText.innerText = gameMode === '2p' ? "Player 2's fleet is destroyed." : "You annihilated the enemy fleet.";
            ui.gameOverScreen.classList.add('active');

            if (currentUser && gameMode === '1p') {
                supabase.rpc('increment_stat', { row_id: currentUser.id, col_name: 'played_games', amount: 1 }).then();
                supabase.rpc('increment_stat', { row_id: currentUser.id, col_name: 'wins', amount: 1 }).then();
            }
            return true;
        } else if (board1.allShipsSunk()) {
            gameState = 'gameover';
            playSound(gameMode === '2p' ? 'win' : 'lose');
            ui.gameOverTitle.innerText = gameMode === '2p' ? "PLAYER 2 WINS!" : "DEFEAT";
            ui.gameOverTitle.style.background = gameMode === '2p' ? "linear-gradient(135deg, #10b981, #3b82f6)" : "linear-gradient(135deg, #ef4444, #f97316)";
            ui.gameOverTitle.style.webkitBackgroundClip = "text";
            ui.gameOverText.innerText = gameMode === '2p' ? "Player 1's fleet is destroyed." : "The enemy destroyed your forces.";
            ui.gameOverScreen.classList.add('active');

            if (currentUser && gameMode === '1p') {
                supabase.rpc('increment_stat', { row_id: currentUser.id, col_name: 'played_games', amount: 1 }).then();
                supabase.rpc('increment_stat', { row_id: currentUser.id, col_name: 'losses', amount: 1 }).then();
            }
            return true;
        }
        return false;
    }

    function resetToMenu() {
        ui.gameScreen.classList.remove('active');
        ui.settingsScreen.classList.remove('active');
        ui.passScreen.classList.remove('active');
        ui.gameOverScreen.classList.remove('active');
        ui.startScreen.classList.add('active');
        gameState = 'start';
    }

    ui.startBtn1p.addEventListener('click', () => initGame('1p'));
    ui.startBtn2p.addEventListener('click', () => initGame('2p'));
    ui.restartBtn.addEventListener('click', resetToMenu);
    ui.playAgainBtn.addEventListener('click', resetToMenu);
    ui.rotateBtn.addEventListener('click', () => {
        isHorizontalPlacement = !isHorizontalPlacement;
        ui.rotateBtn.innerText = `Rotate: ${isHorizontalPlacement ? 'Horizontal' : 'Vertical'}`;
    });

    ui.settingsBtn.addEventListener('click', () => {
        ui.settingsScreen.classList.add('active');
    });

    ui.settingsSaveBtn.addEventListener('click', () => {
        aiDifficulty = ui.settingAiDifficulty.value;
        GRID_SIZE = parseInt(ui.settingGridSize.value);
        ui.settingsScreen.classList.remove('active');
    });

    ui.homeBtn.addEventListener('click', resetToMenu);
    if (ui.logoBtn) ui.logoBtn.addEventListener('click', resetToMenu);

    // --- AUTH LOGIC ---
    
    // Check active session on load
    supabase.auth.getSession().then(({ data: { session } }) => {
        currentUser = session?.user || null;
        updateProfileButton();
    });

    supabase.auth.onAuthStateChange((_event, session) => {
        currentUser = session?.user || null;
        updateProfileButton();
    });

    function updateProfileButton() {
        if (currentUser) {
            ui.profileBtn.innerHTML = `
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" x2="9" y1="12" y2="12"/></svg>
                Logout (${currentUser.email.split('@')[0]})
            `;
            ui.profileBtn.style.background = 'rgba(239, 68, 68, 0.2)'; // Red tint for logout
            ui.profileBtn.style.color = '#ef4444';
            ui.profileBtn.style.borderColor = '#ef4444';
        } else {
            ui.profileBtn.innerHTML = `
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                Login
            `;
            ui.profileBtn.style.background = '#00cc00';
            ui.profileBtn.style.color = '#000000';
            ui.profileBtn.style.borderColor = 'transparent';
        }
    }

    ui.profileBtn.addEventListener('click', async () => {
        if (currentUser) {
            // Logout
            await supabase.auth.signOut();
            alert('Logged out successfully.');
        } else {
            // Open Auth Modal
            ui.authScreen.classList.add('active');
            authMode = 'login';
            ui.authTitle.innerText = 'Login';
            ui.authSubmitBtn.innerText = 'Login';
            ui.authToggleBtn.innerText = 'Need an account? Sign up';
            ui.authError.style.display = 'none';
            ui.authEmail.value = '';
            ui.authPassword.value = '';
        }
    });

    ui.authCloseBtn.addEventListener('click', () => {
        ui.authScreen.classList.remove('active');
    });

    ui.authToggleBtn.addEventListener('click', () => {
        authMode = authMode === 'login' ? 'signup' : 'login';
        ui.authTitle.innerText = authMode === 'login' ? 'Login' : 'Create Account';
        ui.authSubmitBtn.innerText = authMode === 'login' ? 'Login' : 'Sign Up';
        ui.authToggleBtn.innerText = authMode === 'login' ? 'Need an account? Sign up' : 'Already have an account? Login';
        ui.authError.style.display = 'none';
    });

    ui.authSubmitBtn.addEventListener('click', async () => {
        const email = ui.authEmail.value;
        const password = ui.authPassword.value;
        ui.authError.style.display = 'none';

        if (!email || !password) {
            ui.authError.innerText = 'Please enter both email and password.';
            ui.authError.style.display = 'block';
            return;
        }

        ui.authSubmitBtn.innerText = 'Processing...';
        ui.authSubmitBtn.disabled = true;

        let result;
        if (authMode === 'login') {
            result = await supabase.auth.signInWithPassword({ email, password });
        } else {
            result = await supabase.auth.signUp({ email, password });
        }

        ui.authSubmitBtn.disabled = false;
        ui.authSubmitBtn.innerText = authMode === 'login' ? 'Login' : 'Sign Up';

        if (result.error) {
            ui.authError.innerText = result.error.message;
            ui.authError.style.display = 'block';
        } else {
            ui.authScreen.classList.remove('active');
            if (authMode === 'signup' && !result.data.session) {
                alert('Success! Please check your email for a confirmation link.');
            } else {
                alert('Welcome, Commander!');
            }
        }
    });

    // --- END AUTH LOGIC ---

    // --- STATS LOGIC ---
    
    ui.statsBtn.addEventListener('click', async () => {
        ui.statsScreen.classList.add('active');
        
        if (!currentUser) {
            ui.statsLoginMsg.style.display = 'block';
            ui.statsGrid.style.display = 'none';
        } else {
            ui.statsLoginMsg.style.display = 'none';
            ui.statsGrid.style.display = 'none'; // Hide temporarily while loading
            
            // Try to fetch stats
            const { data, error } = await supabase.from('player_stats').select('*').eq('user_id', currentUser.id).single();
            
            let stats = data;
            
            if (error || !data) {
                // Try creating a blank row for the user
                const { data: newData, error: insertError } = await supabase.from('player_stats').insert([{ user_id: currentUser.id }]).select().single();
                if (!insertError && newData) {
                    stats = newData;
                } else {
                    // Fallback to zeros if something fails
                    stats = { played_games: 0, wins: 0, losses: 0, powerups_used: 0 };
                }
            }

            ui.statGames.innerText = stats.played_games;
            ui.statWins.innerText = stats.wins;
            ui.statLosses.innerText = stats.losses;
            ui.statPowerups.innerText = stats.powerups_used;
            
            let winrate = 0;
            if (stats.played_games > 0) {
                winrate = Math.round((stats.wins / stats.played_games) * 100);
            }
            ui.statWinrate.innerText = `${winrate}%`;
            
            ui.statsGrid.style.display = 'grid';
        }
    });

    ui.statsCloseBtn.addEventListener('click', () => {
        ui.statsScreen.classList.remove('active');
    });

    // --- END STATS LOGIC ---

    // --- LEADERBOARD LOGIC ---

    async function fetchLeaderboard() {
        ui.leaderboardLoading.style.display = 'block';
        ui.leaderboardEmpty.style.display = 'none';
        ui.leaderboardTableWrapper.style.display = 'none';
        ui.leaderboardTbody.innerHTML = '';

        const { data, error } = await supabase.rpc('get_leaderboard', { limit_count: 50 });

        ui.leaderboardLoading.style.display = 'none';

        if (error || !data || data.length === 0) {
            ui.leaderboardEmpty.style.display = 'block';
            console.error('Leaderboard error:', error);
        } else {
            data.forEach((row) => {
                const tr = document.createElement('tr');
                if (currentUser && row.username === currentUser.email.split('@')[0]) {
                    tr.classList.add('leaderboard-row-current');
                }
                tr.innerHTML = `
                    <td class="leaderboard-rank">${row.rank}</td>
                    <td class="leaderboard-username">${row.username}</td>
                    <td>${row.wins}</td>
                    <td>${row.losses}</td>
                    <td class="leaderboard-winrate">${row.win_rate}%</td>
                `;
                ui.leaderboardTbody.appendChild(tr);
            });
            ui.leaderboardTableWrapper.style.display = 'block';
        }
    }

    ui.leaderboardBtn.addEventListener('click', () => {
        ui.leaderboardScreen.classList.add('active');
        fetchLeaderboard();
    });

    ui.leaderboardCloseBtn.addEventListener('click', () => {
        ui.leaderboardScreen.classList.remove('active');
    });

    // --- END LEADERBOARD LOGIC ---

    ui.btnSonar.addEventListener('click', () => {
        if (activePowerUp === 'sonar') activePowerUp = null;
        else activePowerUp = 'sonar';
        updateUI();
    });
    ui.btnTorpedo.addEventListener('click', () => {
        if (activePowerUp === 'torpedo') activePowerUp = null;
        else activePowerUp = 'torpedo';
        updateUI();
    });
}
