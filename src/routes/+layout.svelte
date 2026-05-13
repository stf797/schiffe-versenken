<script lang="ts">
	import './layout.css';
	import favicon from '$lib/assets/favicon.svg';

	let { children } = $props();
</script>

<svelte:head><link rel="icon" href={favicon} /></svelte:head>

<div class="global-header">
    <div class="header-left">
        <!-- Battleship Side-Profile Icon -->
        <svg xmlns="http://www.w3.org/2000/svg" width="100" height="24" viewBox="0 0 100 24" fill="none" stroke="#00cc00" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="filter: drop-shadow(0 0 8px rgba(0, 204, 0, 0.6)); margin-right: 20px;">
            <path d="M5 18h90l-10-5H15l-10 5z" />
            <path d="M30 13v-4h40v4" />
            <path d="M40 9V5h8v4" />
            <path d="M60 9V6h6v3" />
            <path d="M44 5V1" />
            <path d="M42 3h4" />
            <path d="M63 6V2" />
            <path d="M30 11H15" />
            <path d="M70 11h15" />
            <path d="M50 13V9" />
            <path d="M55 13V9" />
        </svg>
        <button id="home-btn" class="header-btn" title="Home">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
            Home
        </button>
    </div>
    <div class="header-right">
        <button id="leaderboard-btn" class="header-btn" title="Leaderboard">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M8 6L21 6"/><path d="M8 12L21 12"/><path d="M8 18L21 18"/><circle cx="3" cy="6" r="1" fill="currentColor"/><circle cx="3" cy="12" r="1" fill="currentColor"/><circle cx="3" cy="18" r="1" fill="currentColor"/></svg>
            Leaderboard
        </button>
        <button id="stats-btn" class="header-btn" title="Stats">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>
            Stats
        </button>
        <button id="settings-btn" class="header-btn" title="Settings">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
            Settings
        </button>
        <button id="profile-btn" class="header-profile-btn">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
            Login
        </button>
    </div>
</div>

<main class="main-content">
    {@render children()}
</main>

<style>
    .global-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 15px 40px;
        background: rgba(0, 15, 0, 0.85);
        backdrop-filter: blur(10px);
        -webkit-backdrop-filter: blur(10px);
        border-bottom: 1px solid rgba(0, 255, 0, 0.2);
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        z-index: 1000;
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.6);
    }
    
    .header-right {
        display: flex;
        gap: 20px;
        align-items: center;
    }

    .header-left {
        display: flex;
        align-items: center;
        gap: 10px;
    }

    .header-btn {
        display: flex;
        align-items: center;
        gap: 8px;
        color: #00cc00;
        font-weight: 600;
        font-size: 1rem;
        background: none;
        border: none;
        cursor: pointer;
        transition: all 0.2s ease;
        padding: 8px 12px;
        border-radius: 8px;
    }

    .header-btn:hover {
        color: #00ff00;
        background: rgba(0, 255, 0, 0.1);
        text-shadow: 0 0 8px rgba(0, 255, 0, 0.4);
    }

    .header-profile-btn {
        display: flex;
        align-items: center;
        gap: 8px;
        color: #000000;
        font-weight: 600;
        font-size: 1rem;
        background: #00cc00;
        border: none;
        cursor: pointer;
        padding: 8px 20px;
        border-radius: 20px;
        transition: all 0.2s ease;
        box-shadow: 0 2px 10px rgba(0, 255, 0, 0.2);
    }

    .header-profile-btn:hover {
        background: #00ff00;
        transform: translateY(-2px);
        box-shadow: 0 4px 15px rgba(0, 255, 0, 0.4);
    }
    
    .main-content {
        padding-top: 80px;
        min-height: 100vh;
        display: flex;
        flex-direction: column;
    }
</style>
