<script>
    import { onMount } from 'svelte';
    import { initBattleship } from './game.js';
    import './game.css';

    onMount(() => {
        initBattleship();
    });
</script>

<div id="app">
    <!-- Start Screen -->
    <div id="start-screen" class="screen active" style="position: relative; overflow: hidden;">
        <div class="glass-panel" style="z-index: 1;">
            <h1 class="game-title">BATTLESHIP</h1>
            <p class="subtitle">Tactical Naval Warfare</p>
            <div style="display:flex; gap:20px; justify-content:center; flex-wrap:wrap;">
                <button id="start-btn-1p" class="primary-btn">1 Player (vs CPU)</button>
                <button id="start-btn-2p" class="primary-btn" style="background: var(--ship-color);">2 Players (Local)</button>
            </div>
        </div>
    </div>

    <!-- Settings Screen -->
    <div id="settings-screen" class="modal">
        <div class="glass-panel modal-content" style="text-align: left;">
            <h2 class="game-title-small" style="margin-bottom: 20px; text-align: center;">Settings</h2>
            
            <div class="settings-group">
                <label>AI Difficulty</label>
                <select id="setting-ai-difficulty" class="settings-select">
                    <option value="easy">Easy</option>
                    <option value="medium" selected>Medium</option>
                    <option value="hard">Hard</option>
                </select>
            </div>

            <div class="settings-group">
                <label>Grid Size</label>
                <select id="setting-grid-size" class="settings-select">
                    <option value="8">8 x 8</option>
                    <option value="10" selected>10 x 10</option>
                    <option value="12">12 x 12</option>
                    <option value="15">15 x 15</option>
                    <option value="20">20 x 20</option>
                </select>
            </div>

            <div class="settings-group">
                <label>Tactical Power-ups</label>
                <select id="setting-powerups" class="settings-select">
                    <option value="enabled" selected>Enabled</option>
                    <option value="disabled">Disabled</option>
                </select>
            </div>

            <div style="text-align: center; margin-top: 30px;">
                <button id="settings-save-btn" class="primary-btn">Save & Close</button>
            </div>
        </div>
    </div>

    <!-- Pass Screen -->
    <div id="pass-screen" class="modal">
        <div class="glass-panel modal-content">
            <h2 id="pass-title" class="game-title-small" style="margin-bottom: 20px;">Pass Device</h2>
            <p id="pass-text" style="margin-bottom: 30px;">Hand the device to the next player.<br>Make sure they don't look at the screen!</p>
            <button id="pass-btn" class="primary-btn">I'm Ready</button>
        </div>
    </div>

    <!-- Auth Screen -->
    <div id="auth-screen" class="modal">
        <div class="glass-panel modal-content" style="text-align: left;">
            <h2 id="auth-title" class="game-title-small" style="margin-bottom: 20px; text-align: center;">Login</h2>
            
            <div id="auth-error" style="color: var(--hit-color); margin-bottom: 15px; text-align: center; display: none;"></div>

            <div class="settings-group">
                <label>Email</label>
                <input type="email" id="auth-email" class="settings-select" placeholder="commander@fleet.com" autocomplete="email" />
            </div>

            <div class="settings-group">
                <label>Password</label>
                <input type="password" id="auth-password" class="settings-select" placeholder="••••••••" autocomplete="current-password" />
            </div>

            <div style="text-align: center; margin-top: 30px; display: flex; flex-direction: column; gap: 10px;">
                <button id="auth-submit-btn" class="primary-btn">Login</button>
                <button id="auth-toggle-btn" class="secondary-btn" style="border: none;">Need an account? Sign up</button>
                <button id="auth-close-btn" class="secondary-btn" style="margin-top: 10px;">Cancel</button>
            </div>
        </div>
    </div>

    <!-- Stats Screen -->
    <div id="stats-screen" class="modal">
        <div class="glass-panel modal-content">
            <h2 class="game-title-small" style="margin-bottom: 20px;">Commander Stats</h2>
            
            <div id="stats-login-msg" style="margin-bottom: 20px; display: none;">
                <p>Please login to track your career statistics.</p>
            </div>

            <div id="stats-grid" class="stats-grid" style="display: none;">
                <div class="stat-box">
                    <span class="stat-value" id="stat-games">0</span>
                    <span class="stat-label">Games Played</span>
                </div>
                <div class="stat-box">
                    <span class="stat-value" id="stat-wins">0</span>
                    <span class="stat-label">Victories</span>
                </div>
                <div class="stat-box">
                    <span class="stat-value" id="stat-losses" style="color: var(--hit-color);">0</span>
                    <span class="stat-label">Defeats</span>
                </div>
                <div class="stat-box">
                    <span class="stat-value" id="stat-winrate" style="color: var(--powerup-active);">0%</span>
                    <span class="stat-label">Win Rate</span>
                </div>
                <div class="stat-box" style="grid-column: span 2;">
                    <span class="stat-value" id="stat-powerups">0</span>
                    <span class="stat-label">Power-Ups Deployed</span>
                </div>
            </div>

            <button id="stats-close-btn" class="secondary-btn" style="margin-top: 30px;">Close</button>
        </div>
    </div>

    <!-- Leaderboard Modal -->
    <div id="leaderboard-screen" class="modal">
        <div class="glass-panel modal-content leaderboard-modal">
            <h2 class="game-title-small" style="margin-bottom: 6px;">Global Rankings</h2>
            <p style="color: var(--text-muted); font-size: 0.85rem; margin-bottom: 20px;">Top Commanders Worldwide</p>

            <div id="leaderboard-loading" style="padding: 30px 0; color: var(--text-muted);">Loading rankings...</div>
            <div id="leaderboard-empty" style="padding: 30px 0; color: var(--text-muted); display: none;">No ranked commanders yet. Play a game to appear here!</div>

            <div id="leaderboard-table-wrapper" style="display: none; overflow-x: auto;">
                <table class="leaderboard-table">
                    <thead>
                        <tr>
                            <th>#</th>
                            <th>Commander</th>
                            <th>Wins</th>
                            <th>Losses</th>
                            <th>Win Rate</th>
                        </tr>
                    </thead>
                    <tbody id="leaderboard-tbody"></tbody>
                </table>
            </div>

            <button id="leaderboard-close-btn" class="secondary-btn" style="margin-top: 24px;">Close</button>
        </div>
    </div>

    <!-- Fleet Config Modal -->
    <div id="fleet-config-screen" class="modal">
        <div class="glass-panel modal-content" style="text-align: left; max-width: 500px;">
            <h2 class="game-title-small" style="margin-bottom: 20px; text-align: center;">Fleet Configuration</h2>
            
            <div style="display: flex; justify-content: space-around; margin-bottom: 15px; gap: 10px;">
                <div class="settings-group" style="display: flex; flex-direction: column; align-items: center; margin-bottom: 0;">
                    <label style="font-size: 0.9rem;">Carrier (5)</label>
                    <input type="number" id="config-carrier" class="settings-select" style="width: 60px; text-align: center; margin-top: 5px;" min="0" max="10" value="1">
                </div>
                <div class="settings-group" style="display: flex; flex-direction: column; align-items: center; margin-bottom: 0;">
                    <label style="font-size: 0.9rem;">Battleship (4)</label>
                    <input type="number" id="config-battleship" class="settings-select" style="width: 60px; text-align: center; margin-top: 5px;" min="0" max="10" value="2">
                </div>
                <div class="settings-group" style="display: flex; flex-direction: column; align-items: center; margin-bottom: 0;">
                    <label style="font-size: 0.9rem;">Cruiser (3)</label>
                    <input type="number" id="config-cruiser" class="settings-select" style="width: 60px; text-align: center; margin-top: 5px;" min="0" max="10" value="3">
                </div>
            </div>

            <div style="display: flex; justify-content: center; gap: 40px;">
                <div class="settings-group" style="display: flex; flex-direction: column; align-items: center; margin-bottom: 0;">
                    <label style="font-size: 0.9rem;">Submarine (3)</label>
                    <input type="number" id="config-submarine" class="settings-select" style="width: 60px; text-align: center; margin-top: 5px;" min="0" max="10" value="2">
                </div>
                <div class="settings-group" style="display: flex; flex-direction: column; align-items: center; margin-bottom: 0;">
                    <label style="font-size: 0.9rem;">Destroyer (2)</label>
                    <input type="number" id="config-destroyer" class="settings-select" style="width: 60px; text-align: center; margin-top: 5px;" min="0" max="10" value="2">
                </div>
            </div>

            <div style="text-align: center; margin-top: 30px;">
                <button id="fleet-config-save-btn" class="primary-btn">Save & Close</button>
            </div>
        </div>
    </div>

    <!-- Game Guide Modal -->
    <div id="guide-screen" class="modal">
        <div class="glass-panel modal-content" style="text-align: left; max-width: 600px; max-height: 80vh; overflow-y: auto;">
            <h2 class="game-title-small" style="margin-bottom: 20px; text-align: center;">Game Guide</h2>
            
            <h3 style="color: var(--powerup-active); margin-top: 20px;">The Fleet</h3>
            <ul style="color: var(--text-muted); font-size: 0.9rem; margin-bottom: 15px; padding-left: 20px;">
                <li><strong>Carrier:</strong> Size 5 - The backbone of your fleet.</li>
                <li><strong>Battleship:</strong> Size 4 - Heavy hitter, takes up considerable space.</li>
                <li><strong>Cruiser:</strong> Size 3 - A versatile mid-sized vessel.</li>
                <li><strong>Submarine:</strong> Size 3 - Stealthy and dangerous.</li>
                <li><strong>Destroyer:</strong> Size 2 - Small, maneuverable, hard to find.</li>
            </ul>

            <h3 style="color: var(--powerup-active); margin-top: 20px;">Place Your Fleet</h3>
            <p style="color: var(--text-muted); font-size: 0.9rem; margin-bottom: 15px;">Before the match begins, each player places all ships on their grid. Ships can be placed horizontally or vertically and cannot overlap or go outside the board.</p>

            <h3 style="color: var(--powerup-active); margin-top: 20px;">Hidden Fleets</h3>
            <p style="color: var(--text-muted); font-size: 0.9rem; margin-bottom: 15px;">Once placement is complete, fleets are automatically hidden. Players can use the Show / Hide Fleet button to temporarily reveal only their own ships.</p>

            <h3 style="color: var(--powerup-active); margin-top: 20px;">Taking Turns</h3>
            <p style="color: var(--text-muted); font-size: 0.9rem; margin-bottom: 15px;">Players attack by selecting a cell on the enemy grid:<br>
            <strong>Hit:</strong> A ship occupies the targeted cell.<br>
            <strong>Miss:</strong> No ship is present.<br>
            A cell cannot be attacked more than once.</p>

            <h3 style="color: var(--powerup-active); margin-top: 20px;">Sinking Ships</h3>
            <p style="color: var(--text-muted); font-size: 0.9rem; margin-bottom: 15px;">A ship is sunk when all of its cells have been hit. The game should clearly announce when a ship has been destroyed.</p>

            <h3 style="color: var(--powerup-active); margin-top: 20px;">Using Power-Ups</h3>
            <p style="color: var(--text-muted); font-size: 0.9rem; margin-bottom: 5px;"><strong>Radar (Sonar):</strong> Reveals whether ships are present in a cross-shaped 5-cell area without causing damage.</p>
            <p style="color: var(--text-muted); font-size: 0.9rem; margin-bottom: 15px;"><strong>Torpedo:</strong> If it hits any part of a ship, the entire ship is instantly destroyed.</p>

            <h3 style="color: var(--powerup-active); margin-top: 20px;">Winning the Game</h3>
            <p style="color: var(--text-muted); font-size: 0.9rem; margin-bottom: 15px;">The first player to destroy the opponent’s entire fleet wins the match.</p>

            <h3 style="color: var(--powerup-active); margin-top: 20px;">Fair Play Rules</h3>
            <ul style="color: var(--text-muted); font-size: 0.9rem; margin-bottom: 15px; padding-left: 20px;">
                <li>Players may only view their own fleet.</li>
                <li>Enemy ship locations remain hidden unless revealed through successful hits or power-ups.</li>
                <li>Ships cannot overlap during placement.</li>
                <li>Attacks outside the grid are invalid.</li>
            </ul>

            <div style="text-align: center; margin-top: 30px;">
                <button id="guide-close-btn" class="secondary-btn">Close Guide</button>
            </div>
        </div>
    </div>

    <!-- Game Screen -->
    <div id="game-screen" class="screen">
        <header>
            <h2 class="game-title-small">BATTLESHIP</h2>
            <div id="status-display" class="status-panel">
                <p id="message-text">Place your ships</p>
            </div>
            <button id="restart-btn" class="secondary-btn">Main Menu</button>
        </header>

        <div class="game-container">
            <!-- Left Side (Active Player) -->
            <div class="side-panel">
                <div class="panel-header">
                    <h3 id="left-panel-title">Your Fleet</h3>
                    <span id="player-ships-left" class="badge">10 Ships</span>
                </div>
                <div class="grid-wrapper">
                    <div id="player-grid" class="grid" style="transition: opacity 0.3s;"></div>
                </div>
                
                <div id="setup-controls" class="setup-controls active">
                    <p id="current-ship-to-place">Placing: Carrier (5)</p>
                    <button id="rotate-btn" class="secondary-btn">Rotate: Horizontal</button>
                </div>

                <div id="powerup-controls" class="setup-controls" style="display: none; flex-direction: column; gap: 10px;">
                    <p style="margin:0; font-weight:600; font-size:0.9rem; color:var(--text-color); opacity:0.8;">Tactical Abilities</p>
                    <div style="display:flex; gap:10px; justify-content:center;">
                        <button id="btn-sonar" class="secondary-btn powerup-btn" title="Scan a 5-cell cross pattern. Ends turn.">
                            Radar <span id="badge-sonar" class="badge">1</span>
                        </button>
                        <button id="btn-torpedo" class="secondary-btn powerup-btn" title="Instantly sink an entire ship if hit. Ends turn.">
                            Torpedo <span id="badge-torpedo" class="badge">1</span>
                        </button>
                    </div>
                </div>

                <div id="game-controls" class="setup-controls" style="display: none; margin-top: 10px;">
                    <button id="toggle-fleet-btn" class="secondary-btn" style="width: 100%;">Show Fleet</button>
                </div>
            </div>

            <!-- Right Side (Enemy) -->
            <div class="side-panel">
                <div class="panel-header">
                    <h3 id="right-panel-title">Enemy Fleet</h3>
                    <span id="computer-ships-left" class="badge">10 Ships</span>
                </div>
                <div class="grid-wrapper">
                    <div id="computer-grid" class="grid disabled" style="transition: opacity 0.3s;"></div>
                </div>
                <div class="overlay" id="computer-overlay">Awaiting Battle...</div>
            </div>
        </div>
    </div>
    
    <!-- Game Over Screen -->
    <div id="game-over-screen" class="modal">
        <div class="glass-panel modal-content">
            <h2 id="game-over-title">Victory!</h2>
            <p id="game-over-text">You sunk the enemy fleet.</p>
            <button id="play-again-btn" class="primary-btn">Main Menu</button>
        </div>
    </div>
</div>
