export function createMap(W, H) {
    return [
        // Hàng trên
        { x: 100, y: 80, w: 40, h: 40, type: 'box' },
        { x: 200, y: 80, w: 40, h: 40, type: 'box' },
        { x: 300, y: 80, w: 40, h: 40, type: 'box' },
        { x: W - 140, y: 80, w: 40, h: 40, type: 'box' },
        { x: W - 240, y: 80, w: 40, h: 40, type: 'box' },
        { x: W - 340, y: 80, w: 40, h: 40, type: 'box' },
        
        // Hàng giữa
        { x: W / 2 - 20, y: 200, w: 40, h: 40, type: 'box' },
        { x: 80, y: 200, w: 50, h: 30, type: 'rock' },
        { x: W - 130, y: 200, w: 50, h: 30, type: 'rock' },
        
        // Tường
        { x: 160, y: 320, w: 25, h: 60, type: 'wall' },
        { x: W - 185, y: 320, w: 25, h: 60, type: 'wall' },
        
        // Hàng dưới
        { x: 100, y: 400, w: 40, h: 40, type: 'box' },
        { x: 200, y: 400, w: 40, h: 40, type: 'box' },
        { x: W - 140, y: 400, w: 40, h: 40, type: 'box' },
        { x: W - 240, y: 400, w: 40, h: 40, type: 'box' },
        
        // Đá
        { x: W / 2 - 80, y: 380, w: 60, h: 30, type: 'rock' },
        { x: W / 2 + 20, y: 380, w: 60, h: 30, type: 'rock' },
    ];
}

export function createBushes(W, H) {
    return [
        { x: 60, y: 140, w: 50, h: 28 },
        { x: W - 110, y: 140, w: 50, h: 28 },
        { x: 60, y: 360, w: 50, h: 28 },
        { x: W - 110, y: 360, w: 50, h: 28 },
        { x: W / 2 - 40, y: 140, w: 80, h: 28 },
        { x: W / 2 - 40, y: 360, w: 80, h: 28 },
    ];
}

export function spawnItems(game, count) {
    const types = ['medkit', 'speed', 'shield', 'shotgun', 'rifle', 'sniper', 'smg', 'ak'];
    for (let i = 0; i < count; i++) {
        const type = types[Math.floor(Math.random() * types.length)];
        let x, y, valid;
        let attempts = 0;
        do {
            x = 50 + Math.random() * (game.W - 100);
            y = 50 + Math.random() * (game.H - 100);
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
