import { loadData, saveData, addCoins, unlockSkin, selectSkin, addStats, getStats } from './save.js';

export const SHOP_ITEMS = {
    'skin_blue': { id: 'skin_blue', type: 'skin', name: 'Xanh dương', price: 100, skinId: 'blue' },
    'skin_green': { id: 'skin_green', type: 'skin', name: 'Xanh lá', price: 150, skinId: 'green' },
    'skin_purple': { id: 'skin_purple', type: 'skin', name: 'Tím', price: 200, skinId: 'purple' },
    'skin_gold': { id: 'skin_gold', type: 'skin', name: 'Vàng', price: 300, skinId: 'gold' },
    'skin_red': { id: 'skin_red', type: 'skin', name: 'Đỏ đậm', price: 250, skinId: 'red' },
    'skin_dark': { id: 'skin_dark', type: 'skin', name: 'Đen', price: 400, skinId: 'dark' },
    'skin_pink': { id: 'skin_pink', type: 'skin', name: 'Hồng', price: 350, skinId: 'pink' },
};

export const STAT_ITEMS = [
    { id: 'hp_boost', name: 'HP +10', price: 50, stat: 'hp', amount: 10, max: 200 },
    { id: 'damage_boost', name: 'Sát thương +2', price: 80, stat: 'damage', amount: 2, max: 30 },
    { id: 'speed_boost', name: 'Tốc độ +0.1', price: 60, stat: 'speed', amount: 0.1, max: 3.0 },
    { id: 'bomb_boost', name: 'Bom +5 dmg', price: 70, stat: 'bombDamage', amount: 5, max: 80 },
];

export function getShopItems() {
    const data = loadData();
    const items = [];
    for (const [id, item] of Object.entries(SHOP_ITEMS)) {
        const owned = data.unlockedSkins.includes(item.skinId);
        const equipped = data.currentSkin === item.skinId;
        items.push({ ...item, owned, equipped });
    }
    return items;
}

export function buySkin(itemId) {
    const data = loadData();
    const item = SHOP_ITEMS[itemId];
    if (!item) return { success: false, message: 'Không tìm thấy!' };
    if (data.coins < item.price) return { success: false, message: 'Không đủ xu!' };
    if (data.unlockedSkins.includes(item.skinId)) {
        return { success: false, message: 'Đã sở hữu!' };
    }
    data.coins -= item.price;
    data.unlockedSkins.push(item.skinId);
    if (data.unlockedSkins.length === 1) {
        data.currentSkin = item.skinId;
    }
    saveData(data);
    return { success: true, message: `Đã mua ${item.name}!` };
}

export function buyStatBoost(statId) {
    const data = loadData();
    const item = STAT_ITEMS.find(s => s.id === statId);
    if (!item) return { success: false, message: 'Không tìm thấy!' };
    if (data.coins < item.price) return { success: false, message: 'Không đủ xu!' };
    if (data.stats[item.stat] >= item.max) {
        return { success: false, message: 'Đã đạt giới hạn!' };
    }
    data.coins -= item.price;
    data.stats[item.stat] = Math.min(item.max, data.stats[item.stat] + item.amount);
    saveData(data);
    return { success: true, message: `Đã nâng cấp ${item.name}!` };
}

export function equipSkin(skinId) {
    return selectSkin(skinId);
}
