import { Game } from './js/game.js';
import { setupJoystick, setupButton } from './js/joystick.js';
import { loadData, saveData, getStats, getLevelInfo, addStats } from './js/save.js';
import { getShopItems, buySkin, equipSkin, buyStatBoost, SHOP_ITEMS, STAT_ITEMS } from './js/shop.js';
import { getLeaderboard } from './js/leaderboard.js';
import { getInventory } from './js/inventory.js';
import { getSettings, setSetting, applySettings } from './js/settings.js';

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// KÍCH THƯỚC MÀN HÌNH NGANG
const W = 900;
const H = 500;
canvas.width = W;
canvas.height = H;

// ===== IPHONE FIX: Ngăn scroll và zoom =====
document.addEventListener('touchmove', (e) => {
    e.preventDefault();
}, { passive: false });

document.addEventListener('gesturestart', (e) => {
    e.preventDefault();
}, { passive: false });

document.addEventListener('gesturechange', (e) => {
    e.preventDefault();
}, { passive: false });

document.addEventListener('gestureend', (e) => {
    e.preventDefault();
}, { passive: false });

// DOM refs
const hpP1 = document.getElementById('hpP1');
const hpP2 = document.getElementById('hpP2');
const scoreP1 = document.getElementById('scoreP1');
const scoreP2 = document.getElementById('scoreP2');
const roundDisplay = document.getElementById('roundDisplay');
const winnerMsg = document.getElementById('winnerMsg');
const restartBtn = document.getElementById('restartBtn');
const menu = document.getElementById('menu');
const weaponDisplay = document.getElementById('weaponDisplay');
const controls = document.getElementById('controls');
const menuCoins = document.getElementById('menuCoins');
const menuLevel = document.getElementById('menuLevel');

const dom = { hpP1, hpP2, scoreP1, scoreP2, roundDisplay, winnerMsg, restartBtn, weaponDisplay };

// Game
const game = new Game(W, H, dom, ctx);

// Setup controls
setupJoystick('joyP1', 'knobP1', game.p1);
setupJoystick('joyP2', 'knobP2', game.p2);
setupButton('shootP1', game.p1, 'shoot');
setupButton('bombP1', game.p1, 'bomb');
setupButton('speedP1', game.p1, 'speed');
setupButton('weaponP1', game.p1, 'weapon');
setupButton('shootP2', game.p2, 'shoot');
setupButton('bombP2', game.p2, 'bomb');
setupButton('speedP2', game.p2, 'speed');
setupButton('weaponP2', game.p2, 'weapon');

// ===== UPDATE MENU COINS & LEVEL =====
function updateMenuUI() {
    const data = loadData();
    if (menuCoins) menuCoins.textContent = data.coins;
    if (menuLevel) menuLevel.textContent = data.level;
}

// ===== MENU EVENTS =====
document.getElementById('btnLocal').addEventListener('click', () => {
    game.start('local');
    menu.style.display = 'none';
    controls.style.display = 'flex';
    updateMenuUI();
});

document.getElementById('btnBot').addEventListener('click', () => {
    game.start('bot');
    menu.style.display = 'none';
    controls.style.display = 'flex';
    updateMenuUI();
});

document.getElementById('btnOnline').addEventListener('click', () => {
    alert('🌐 Chế độ Online đang phát triển!');
});

// ===== SHOP =====
document.getElementById('btnShop').addEventListener('click', () => {
    openShop();
});

document.getElementById('closeShop').addEventListener('click', () => {
    document.getElementById('shopPopup').style.display = 'none';
});

function openShop() {
    const popup = document.getElementById('shopPopup');
    popup.style.display = 'flex';
    renderShop();
}

function renderShop() {
    const data = loadData();
    document.getElementById('shopCoins').textContent = data.coins;
    
    // Skin items
    const container = document.getElementById('shopItems');
    const items = getShopItems();
    container.innerHTML = '';
    
    for (const item of items) {
        const div = document.createElement('div');
        div.style.cssText = `
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 8px 12px;
            background: ${item.equipped ? 'rgba(78, 205, 196, 0.15)' : 'rgba(255,255,255,0.03)'};
            border-radius: 8px;
            border: 1px solid ${item.equipped ? 'rgba(78, 205, 196, 0.3)' : 'rgba(255,255,255,0.05)'};
        `;
        
        const nameSpan = document.createElement('span');
        nameSpan.style.cssText = `
            color: ${item.equipped ? '#4ecdc4' : '#fff'};
            font-size: 14px;
        `;
        nameSpan.textContent = `${item.owned ? '✅' : '⬜'} ${item.name} ${item.equipped ? '(Đang dùng)' : ''}`;
        
        const btn = document.createElement('button');
        btn.style.cssText = `
            background: ${item.owned ? 'rgba(78, 205, 196, 0.2)' : 'rgba(253, 203, 110, 0.2)'};
            border: 1px solid ${item.owned ? 'rgba(78, 205, 196, 0.3)' : 'rgba(253, 203, 110, 0.3)'};
            color: #fff;
            padding: 4px 12px;
            border-radius: 12px;
            cursor: pointer;
            font-size: 12px;
        `;
        
        if (item.owned) {
            btn.textContent = item.equipped ? '✅ Đang dùng' : '🔀 Đổi';
            btn.onclick = () => {
                if (!item.equipped) {
                    const result = equipSkin(item.skinId);
                    alert(result ? '✅ Đã đổi skin!' : '❌ Lỗi!');
                    renderShop();
                    updateMenuUI();
                }
            };
        } else {
            btn.textContent = `🪙 ${item.price}`;
            btn.onclick = () => {
                const result = buySkin(item.id);
                alert(result.message);
                if (result.success) {
                    renderShop();
                    updateMenuUI();
                }
            };
        }
        
        div.appendChild(nameSpan);
        div.appendChild(btn);
        container.appendChild(div);
    }
    
    // Stat items
    const statsContainer = document.getElementById('shopStats');
    statsContainer.innerHTML = '';
    
    for (const stat of STAT_ITEMS) {
        const currentVal = data.stats[stat.stat];
        const isMax = currentVal >= stat.max;
        
        const div = document.createElement('div');
        div.style.cssText = `
            display: flex;
            align-items: center;
            gap: 6px;
            background: rgba(255,255,255,0.03);
            padding: 4px 10px;
            border-radius: 12px;
            border: 1px solid rgba(255,255,255,0.05);
            font-size: 12px;
            color: #ccc;
        `;
        div.innerHTML = `
            <span>${stat.name}</span>
            <span style="color:#888;">(${currentVal}/${stat.max})</span>
            ${isMax ? '<span style="color:#4ecdc4;">✅ MAX</span>' : 
              `<button class="buy-stat-btn" data-id="${stat.id}" style="background:rgba(253,203,110,0.2);border:1px solid rgba(253,203,110,0.3);color:#fff;padding:2px 10px;border-radius:8px;cursor:pointer;font-size:11px;">🪙 ${stat.price}</button>`}
        `;
        statsContainer.appendChild(div);
    }
    
    // Event listeners cho stat buttons
    document.querySelectorAll('.buy-stat-btn').forEach(btn => {
        btn.onclick = () => {
            const result = buyStatBoost(btn.dataset.id);
            alert(result.message);
            if (result.success) {
                renderShop();
                updateMenuUI();
                // Cập nhật stats cho game
                game.applyStats();
            }
        };
    });
}

// ===== STATS =====
document.getElementById('btnStats').addEventListener('click', () => {
    openStats();
});

document.getElementById('closeStats').addEventListener('click', () => {
    document.getElementById('statsPopup').style.display = 'none';
});

function openStats() {
    const popup = document.getElementById('statsPopup');
    popup.style.display = 'flex';
    renderStats();
}

function renderStats() {
    const data = loadData();
    const content = document.getElementById('statsContent');
    content.innerHTML = `
        <div style="display:grid; grid-template-columns:1fr 1fr; gap:4px 16px;">
            <span>🏆 Thắng:</span><span style="color:#fdcb6e;">${data.totalWins}</span>
            <span>💀 Kill:</span><span style="color:#ff6b6b;">${data.totalKills}</span>
            <span>🎮 Trận:</span><span style="color:#4ecdc4;">${data.totalMatches}</span>
            <span>🪙 Xu:</span><span style="color:#fdcb6e;">${data.coins}</span>
            <span>⭐ Level:</span><span style="color:#a29bfe;">${data.level}</span>
            <span>✨ Điểm nâng cấp:</span><span style="color:#ff6b6b;">${data.statPoints}</span>
            <span>❤️ HP:</span><span style="color:#ff6b6b;">${data.stats.hp}</span>
            <span>🔫 Sát thương:</span><span style="color:#ff8833;">${data.stats.damage}</span>
            <span>⚡ Tốc độ:</span><span style="color:#4ecdc4;">${data.stats.speed.toFixed(1)}</span>
            <span>💣 Bom:</span><span style="color:#ff8800;">${data.stats.bombDamage}</span>
            <span>🎨 Skin:</span><span style="color:#a29bfe;">${data.currentSkin}</span>
            <span>📈 EXP:</span><span style="color:#55efc4;">${Math.round(data.exp)}/${data.expToNext}</span>
        </div>
        ${data.statPoints > 0 ? `<div style="margin-top:12px; text-align:center; color:#fdcb6e;">✨ Bạn có ${data.statPoints} điểm nâng cấp! Nhấn "Nâng cấp" ở menu.</div>` : ''}
    `;
}

// ===== LEADERBOARD =====
document.getElementById('btnLeaderboard').addEventListener('click', () => {
    openLeaderboard();
});

document.getElementById('closeLeaderboard').addEventListener('click', () => {
    document.getElementById('leaderboardPopup').style.display = 'none';
});

function openLeaderboard() {
    const popup = document.getElementById('leaderboardPopup');
    popup.style.display = 'flex';
    renderLeaderboard();
}

function renderLeaderboard() {
    const lb = getLeaderboard();
    const content = document.getElementById('leaderboardContent');
    
    if (lb.length === 0) {
        content.innerHTML = '<div style="text-align:center; color:#666; padding:20px;">Chưa có dữ liệu! Hãy chơi vài trận.</div>';
        return;
    }
    
    let html = '<div style="display:grid; grid-template-columns:30px 1fr 50px 50px; gap:4px; font-weight:bold; color:#888; font-size:11px; border-bottom:1px solid rgba(255,255,255,0.05); padding-bottom:6px;">';
    html += '<span>#</span><span>Tên</span><span>Kill</span><span>Level</span>';
    html += '</div>';
    
    lb.forEach((e, i) => {
        const isTop = i === 0;
        const isSecond = i === 1;
        const isThird = i === 2;
        let color = '#fff';
        let medal = '';
        if (isTop) { color = '#fdcb6e'; medal = '🥇'; }
        else if (isSecond) { color = '#b0b0b0'; medal = '🥈'; }
        else if (isThird) { color = '#cd7f32'; medal = '🥉'; }
        
        html += `<div style="display:grid; grid-template-columns:30px 1fr 50px 50px; gap:4px; padding:4px 0; border-bottom:1px solid rgba(255,255,255,0.03); color:${color}; font-size:13px;">`;
        html += `<span>${medal || i+1}</span>`;
        html += `<span>${e.name || 'Player'}</span>`;
        html += `<span>${e.kills}</span>`;
        html += `<span>${e.level || 1}</span>`;
        html += '</div>';
    });
    
    content.innerHTML = html;
}

// ===== SETTINGS =====
document.getElementById('btnSettings').addEventListener('click', () => {
    openSettings();
});

document.getElementById('closeSettings').addEventListener('click', () => {
    document.getElementById('settingsPopup').style.display = 'none';
});

function openSettings() {
    const popup = document.getElementById('settingsPopup');
    popup.style.display = 'flex';
    renderSettings();
}

function renderSettings() {
    const settings = getSettings();
    const content = document.getElementById('settingsContent');
    
    content.innerHTML = `
        <div style="display:flex; flex-direction:column; gap:8px;">
            <div style="display:flex; align-items:center; justify-content:space-between;">
                <span>🔊 Âm thanh</span>
                <input type="range" min="0" max="1" step="0.1" value="${settings.soundVolume}" 
                       onchange="window.setSetting('soundVolume', parseFloat(this.value))" 
                       style="width:60%; accent-color:#4ecdc4;">
                <span style="color:#888; font-size:12px; min-width:30px;">${Math.round(settings.soundVolume * 100)}%</span>
            </div>
            <div style="display:flex; align-items:center; justify-content:space-between;">
                <span>🎵 Nhạc nền</span>
                <input type="range" min="0" max="1" step="0.1" value="${settings.musicVolume}" 
                       onchange="window.setSetting('musicVolume', parseFloat(this.value))" 
                       style="width:60%; accent-color:#4ecdc4;">
                <span style="color:#888; font-size:12px; min-width:30px;">${Math.round(settings.musicVolume * 100)}%</span>
            </div>
            <div style="display:flex; align-items:center; justify-content:space-between;">
                <span>📏 Joystick</span>
                <input type="range" min="0.5" max="1.5" step="0.1" value="${settings.joystickSize || 1}" 
                       onchange="window.setSetting('joystickSize', parseFloat(this.value))" 
                       style="width:60%; accent-color:#4ecdc4;">
                <span style="color:#888; font-size:12px; min-width:30px;">${Math.round((settings.joystickSize || 1) * 100)}%</span>
            </div>
            <div style="display:flex; align-items:center; justify-content:space-between;">
                <span>📳 Rung</span>
                <label style="position:relative; display:inline-block; width:50px; height:26px;">
                    <input type="checkbox" ${settings.vibration ? 'checked' : ''} 
                           onchange="window.setSetting('vibration', this.checked)"
                           style="opacity:0; width:0; height:0;">
                    <span style="position:absolute; cursor:pointer; top:0; left:0; right:0; bottom:0; background:${settings.vibration ? '#4ecdc4' : '#555'}; border-radius:26px; transition:0.3s;">
                        <span style="position:absolute; content:''; height:20px; width:20px; left:3px; bottom:3px; background:#fff; border-radius:50%; transition:0.3s; transform:${settings.vibration ? 'translateX(24px)' : 'none'};"></span>
                    </span>
                </label>
            </div>
            <div style="margin-top:8px; padding-top:8px; border-top:1px solid rgba(255,255,255,0.05);">
                <button onclick="localStorage.clear(); alert('Đã xóa dữ liệu!'); location.reload();" 
                        style="background:rgba(255,50,50,0.2); border:1px solid rgba(255,50,50,0.3); color:#ff6b6b; padding:6px 16px; border-radius:8px; cursor:pointer; font-size:13px;">
                    🗑️ Xóa dữ liệu
                </button>
                <button onclick="window.applySettings(); alert('Đã áp dụng!');" 
                        style="background:rgba(78,205,196,0.2); border:1px solid rgba(78,205,196,0.3); color:#4ecdc4; padding:6px 16px; border-radius:8px; cursor:pointer; font-size:13px; margin-left:8px;">
                    🔄 Áp dụng
                </button>
            </div>
        </div>
    `;
}

// ===== UPGRADE POPUP =====
document.getElementById('btnUpgrade')?.addEventListener('click', () => {
    openUpgrade();
});

document.getElementById('closeUpgrade').addEventListener('click', () => {
    document.getElementById('upgradePopup').style.display = 'none';
});

function openUpgrade() {
    const popup = document.getElementById('upgradePopup');
    popup.style.display = 'flex';
    renderUpgrade();
}

function renderUpgrade() {
    const data = loadData();
    document.getElementById('upgradePoints').textContent = data.statPoints;
    const container = document.getElementById('upgradeOptions');
    container.innerHTML = '';
    
    if (data.statPoints <= 0) {
        container.innerHTML = '<div style="color:#888; text-align:center; padding:12px;">Không có điểm nâng cấp! Chơi để lên level.</div>';
        return;
    }
    
    const options = [
        { stat: 'hp', label: '❤️ HP +10', max: 200 },
        { stat: 'damage', label: '🔫 Sát thương +2', max: 30 },
        { stat: 'speed', label: '⚡ Tốc độ +0.1', max: 3.0 },
        { stat: 'bombDamage', label: '💣 Bom +5', max: 80 },
    ];
    
    for (const opt of options) {
        const isMax = data.stats[opt.stat] >= opt.max;
        const div = document.createElement('div');
        div.style.cssText = `
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 8px 12px;
            background: rgba(255,255,255,0.03);
            border-radius: 8px;
            border: 1px solid rgba(255,255,255,0.05);
        `;
        
        const span = document.createElement('span');
        span.style.color = '#ccc';
        span.textContent = `${opt.label} (${data.stats[opt.stat]}/${opt.max})`;
        
        const btn = document.createElement('button');
        btn.style.cssText = `
            background: ${isMax ? 'rgba(78,205,196,0.1)' : 'rgba(255,107,107,0.2)'};
            border: 1px solid ${isMax ? 'rgba(78,205,196,0.2)' : 'rgba(255,107,107,0.3)'};
            color: ${isMax ? '#4ecdc4' : '#fff'};
            padding: 4px 16px;
            border-radius: 12px;
            cursor: ${isMax ? 'default' : 'pointer'};
            font-size: 12px;
        `;
        btn.textContent = isMax ? '✅ MAX' : '⬆ Nâng cấp';
        if (!isMax) {
            btn.onclick = () => {
                const result = addStats(opt.stat, opt.stat === 'hp' ? 10 : opt.stat === 'damage' ? 2 : opt.stat === 'speed' ? 0.1 : 5);
                if (result) {
                    alert('✅ Đã nâng cấp!');
                    renderUpgrade();
                    updateMenuUI();
                    game.applyStats();
                } else {
                    alert('❌ Không thể nâng cấp!');
                }
            };
        }
        
        div.appendChild(span);
        div.appendChild(btn);
        container.appendChild(div);
    }
}

// ===== RESTART =====
restartBtn.addEventListener('click', () => {
    game.restart();
});

// ===== KEYBOARD =====
const keys = {};
document.addEventListener('keydown', (e) => {
    const key = e.key;
    keys[key] = true;
    if (key === ' ' || key === 'Space' || key === 'Enter') {
        e.preventDefault();
    }
    game.handleKeyDown(key, keys);
});

document.addEventListener('keyup', (e) => {
    const key = e.key;
    keys[key] = false;
    game.handleKeyUp(key, keys);
});

// ===== WINDOW FUNCTIONS =====
window.setSetting = setSetting;
window.applySettings = applySettings;
window.updateMenuUI = updateMenuUI;

// ===== GAME LOOP =====
let lastTime = 0;
function gameLoop(time) {
    const dt = Math.min((time - lastTime) / 1000, 0.05);
    lastTime = time;
    game.update(dt);
    game.render();
    requestAnimationFrame(gameLoop);
}

// ===== INIT =====
updateMenuUI();
applySettings();
requestAnimationFrame(gameLoop);

console.log('🎮 Survive Arena loaded!');
console.log('📊 Dữ liệu:', loadData());
console.log('🛒 Cửa hàng:', getShopItems());
console.log('🏆 Bảng xếp hạng:', getLeaderboard());
