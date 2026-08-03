import { Game } from './js/game.js';
import { setupJoystick, setupButton } from './js/joystick.js';

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// KÍCH THƯỚC MÀN HÌNH NGANG (16:9)
const W = 900;
const H = 500;
canvas.width = W;
canvas.height = H;

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

// Menu
document.getElementById('btnLocal').addEventListener('click', () => {
    game.start('local');
    menu.style.display = 'none';
    controls.style.display = 'flex';
});

document.getElementById('btnBot').addEventListener('click', () => {
    game.start('bot');
    menu.style.display = 'none';
    controls.style.display = 'flex';
});

document.getElementById('btnOnline').addEventListener('click', () => {
    alert('🌐 Chế độ Online đang phát triển!');
});

// Restart
restartBtn.addEventListener('click', () => {
    game.restart();
});

// Keyboard
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

// Game loop
let lastTime = 0;
function gameLoop(time) {
    const dt = Math.min((time - lastTime) / 1000, 0.05);
    lastTime = time;
    game.update(dt);
    game.render();
    requestAnimationFrame(gameLoop);
}

requestAnimationFrame(gameLoop);
