// ===== LƯU DỮ LIỆU BẰNG localStorage =====

const SAVE_KEY = 'survive_arena_data';

export function getDefaultData() {
    return {
        coins: 0,
        totalKills: 0,
        totalMatches: 0,
        totalWins: 0,
        unlockedSkins: ['default'],
        currentSkin: 'default',
        level: 1,
        exp: 0,
        expToNext: 100,
        stats: {
            hp: 100,
            damage: 10,
            speed: 1.8,
            bombDamage: 35,
        },
        statPoints: 0,
        settings: {
            soundVolume: 1.0,
            musicVolume: 0.5,
            vibration: true,
            joystickSize: 1.0,
        }
    };
}

export function loadData() {
    try {
        const raw = localStorage.getItem(SAVE_KEY);
        if (!raw) {
            const defaultData = getDefaultData();
            saveData(defaultData);
            return defaultData;
        }
        const data = JSON.parse(raw);
        const defaultData = getDefaultData();
        for (const key in defaultData) {
            if (!(key in data)) {
                data[key] = defaultData[key];
            }
        }
        return data;
    } catch (e) {
        return getDefaultData();
    }
}

export function saveData(data) {
    try {
        localStorage.setItem(SAVE_KEY, JSON.stringify(data));
        return true;
    } catch (e) {
        return false;
    }
}

export function addCoins(amount) {
    const data = loadData();
    data.coins += amount;
    saveData(data);
    return data.coins;
}

export function addExp(amount) {
    const data = loadData();
    data.exp += amount;
    let leveled = false;
    while (data.exp >= data.expToNext) {
        data.exp -= data.expToNext;
        data.level++;
        data.expToNext = Math.floor(data.expToNext * 1.3);
        data.statPoints++;
        data.stats.hp += 5;
        leveled = true;
    }
    saveData(data);
    return { ...data, leveled };
}

export function addStats(type, amount) {
    const data = loadData();
    if (data.statPoints <= 0) return false;
    const maxStats = {
        hp: 200,
        damage: 30,
        speed: 3.0,
        bombDamage: 80,
    };
    if (data.stats[type] >= maxStats[type]) return false;
    data.stats[type] = Math.min(maxStats[type], data.stats[type] + amount);
    data.statPoints--;
    saveData(data);
    return true;
}

export function unlockSkin(skinId) {
    const data = loadData();
    if (data.unlockedSkins.includes(skinId)) return false;
    data.unlockedSkins.push(skinId);
    saveData(data);
    return true;
}

export function selectSkin(skinId) {
    const data = loadData();
    if (!data.unlockedSkins.includes(skinId)) return false;
    data.currentSkin = skinId;
    saveData(data);
    return true;
}

export function getSkinColor(skinId) {
    const skins = {
        default: '#ff6b6b',
        blue: '#4ecdc4',
        green: '#55efc4',
        purple: '#a29bfe',
        gold: '#fdcb6e',
        red: '#e17055',
        dark: '#2d3436',
        pink: '#fd79a8',
    };
    return skins[skinId] || skins.default;
}

export function getStats() {
    const data = loadData();
    return data.stats;
}

export function getLevelInfo() {
    const data = loadData();
    return {
        level: data.level,
        exp: data.exp,
        expToNext: data.expToNext,
        statPoints: data.statPoints,
    };
}
