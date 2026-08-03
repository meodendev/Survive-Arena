export function createMap(W, H) {
    return [
        { x: 150, y: 150, w: 35, h: 35, type: 'box' },
        { x: 235, y: 150, w: 35, h: 35, type: 'box' },
        { x: 150, y: 235, w: 35, h: 35, type: 'box' },
        { x: W - 185, y: 150, w: 35, h: 35, type: 'box' },
        { x: W - 270, y: 150, w: 35, h: 35, type: 'box' },
        { x: W - 185, y: 235, w: 35, h: 35, type: 'box' },
        { x: 90, y: 490, w: 50, h: 30, type: 'rock' },
        { x: W - 140, y: 490, w: 50, h: 30, type: 'rock' },
        { x: 190, y: 390, w: 25, h: 55, type: 'wall' },
        { x: W - 215, y: 390, w: 25, h: 55, type: 'wall' },
        { x: W / 2 - 18, y: 340, w: 36, h: 36, type: 'box' },
        { x: 80, y: 640, w: 40, h: 25, type: 'rock' },
        { x: W - 120, y: 640, w: 40, h: 25, type: 'rock' },
    ];
}

export function createBushes(W, H) {
    return [
        { x: 70, y: 290, w: 45, h: 28 },
        { x: W - 115, y: 290, w: 45, h: 28 },
        { x: 50, y: 570, w: 45, h: 28 },
        { x: W - 95, y: 570, w: 45, h: 28 },
        { x: W / 2 - 28, y: 250, w: 56, h: 28 },
        { x: W / 2 - 28, y: 560, w: 56, h: 28 },
    ];
}

export function spawnItems(game, count) {
    const types = ['medkit', 'speed', 'shield', 'shotgun', 'rifle', 'sniper', 'smg', 'ak'];
    for (let i = 0; i < count; i++) {
        const type = types[Math.floor(Math.random() * types.length)];
        let x, y, valid;
        let attempts = 0;
        do {
            x = 40 + Math.random() * (game.W - 80);
            y = 40 + Math.random() * (game.H - 80);
            valid = true;
            for (const p of game.players) {
                if (Math.hypot(x - p.x, y - p.y) < 60) valid = false;
            }
            for (const o of game.obstacles) {
                if (x > o.x - 30 && x < o.x + o.w + 30 && y > o.y - 30 && y < o.y + o.h + 30) valid = false;
            }
            attempts++;
        } while (!valid && attempts < 30);
        if (valid) {
            game.items.push({ x, y, type, radius: 12, timer: 0 });
        }
    }
}

export function checkCollision(x, y, radius, obstacles) {
    for (const o of obstacles) {
        const cx = o.x + o.w / 2;
        const cy = o.y + o.h / 2;
        const halfW = o.w / 2 + radius;
        const halfH = o.h / 2 + radius;
        const dx = Math.abs(x - cx);
        const dy = Math.abs(y - cy);
        if (dx < halfW && dy < halfH) {
            return true;
        }
    }
    return false;
}

export function rectCircleCollision(rx, ry, rw, rh, cx, cy, cr) {
    const nearX = Math.max(rx, Math.min(cx, rx + rw));
    const nearY = Math.max(ry, Math.min(cy, ry + rh));
    const dx = cx - nearX;
    const dy = cy - nearY;
    return (dx * dx + dy * dy) < (cr * cr);
}
