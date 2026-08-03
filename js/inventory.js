import { loadData } from './save.js';

const LEADERBOARD_KEY = 'survive_arena_leaderboard';
const MAX_ENTRIES = 10;

export function getLeaderboard() {
    try {
        const raw = localStorage.getItem(LEADERBOARD_KEY);
        if (!raw) return [];
        return JSON.parse(raw);
    } catch (e) {
        return [];
    }
}

export function addLeaderboardEntry(name, kills, damage, round, mode) {
    const data = loadData();
    const entry = {
        name: name || 'Player',
        kills: kills || 0,
        damage: damage || 0,
        round: round || 1,
        mode: mode || 'local',
        date: new Date().toISOString(),
        level: data.level,
        skin: data.currentSkin,
    };
    
    let leaderboard = getLeaderboard();
    leaderboard.push(entry);
    leaderboard.sort((a, b) => b.kills - a.kills || b.damage - a.damage);
    if (leaderboard.length > MAX_ENTRIES) {
        leaderboard = leaderboard.slice(0, MAX_ENTRIES);
    }
    
    try {
        localStorage.setItem(LEADERBOARD_KEY, JSON.stringify(leaderboard));
    } catch (e) {
        console.warn('Lỗi save leaderboard:', e);
    }
}
