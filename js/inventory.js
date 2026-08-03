import { loadData } from './save.js';

export function getInventory() {
    const data = loadData();
    return {
        coins: data.coins,
        level: data.level,
        exp: data.exp,
        expToNext: data.expToNext,
        statPoints: data.statPoints,
        stats: data.stats,
        currentSkin: data.currentSkin,
        unlockedSkins: data.unlockedSkins,
        totalKills: data.totalKills,
        totalMatches: data.totalMatches,
        totalWins: data.totalWins,
    };
}
