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
