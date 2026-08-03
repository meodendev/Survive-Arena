export function createMap(W, H) {
    // W = 900, H = 500
    return [
        // ===== HÀNG TRÊN (Y = 50-90) =====
        { x: 80, y: 50, w: 40, h: 40, type: 'box' },
        { x: 180, y: 50, w: 40, h: 40, type: 'box' },
        { x: 280, y: 50, w: 40, h: 40, type: 'box' },
        { x: 380, y: 50, w: 40, h: 40, type: 'box' },
        { x: W - 420, y: 50, w: 40, h: 40, type: 'box' },
        { x: W - 320, y: 50, w: 40, h: 40, type: 'box' },
        { x: W - 220, y: 50, w: 40, h: 40, type: 'box' },
        { x: W - 120, y: 50, w: 40, h: 40, type: 'box' },
        
        // ===== HÀNG GIỮA TRÊN (Y = 160-200) =====
        { x: 60, y: 160, w: 50, h: 30, type: 'rock' },
        { x: 200, y: 160, w: 30, h: 55, type: 'wall' },
        { x: W / 2 - 20, y: 160, w: 40, h: 40, type: 'box' },
        { x: W - 230, y: 160, w: 30, h: 55, type: 'wall' },
        { x: W - 110, y: 160, w: 50, h: 30, type: 'rock' },
        
        // ===== HÀNG GIỮA DƯỚI (Y = 280-320) =====
        { x: 80, y: 280, w: 40, h: 40, type: 'box' },
        { x: 200, y: 280, w: 40, h: 40, type: 'box' },
        { x: W / 2 - 60, y: 280, w: 50, h: 30, type: 'rock' },
        { x: W / 2 + 10, y: 280, w: 50, h: 30, type: 'rock' },
        { x: W - 240, y: 280, w: 40, h: 40, type: 'box' },
        { x: W - 120, y: 280, w: 40, h: 40, type: 'box' },
        
        // ===== HÀNG DƯỚI (Y = 390-430) =====
        { x: 80, y: 390, w: 40, h: 40, type: 'box' },
        { x: 180, y: 390, w: 40, h: 40, type: 'box' },
        { x: 280, y: 390, w: 40, h: 40, type: 'box' },
        { x: 380, y: 390, w: 40, h: 40, type: 'box' },
        { x: W - 420, y: 390, w: 40, h: 40, type: 'box' },
        { x: W - 320, y: 390, w: 40, h: 40, type: 'box' },
        { x: W - 220, y: 390, w: 40, h: 40, type: 'box' },
        { x: W - 120, y: 390, w: 40, h: 40, type: 'box' },
        
        // ===== TƯỜNG BAO QUANH =====
        // Tường trái - phải
        { x: 30, y: 110, w: 20, h: 70, type: 'wall' },
        { x: W - 50, y: 110, w: 20, h: 70, type: 'wall' },
        { x: 30, y: 310, w: 20, h: 70, type: 'wall' },
        { x: W - 50, y: 310, w: 20, h: 70, type: 'wall' },
        
        // ===== ĐÁ LỚN =====
        { x: 150, y: 220, w: 60, h: 35, type: 'rock' },
        { x: W - 210, y: 220, w: 60, h: 35, type: 'rock' },
        
        // ===== CHƯỚNG NGẠI VẬT Ở GIỮA =====
        { x: W / 2 - 40, y: 360, w: 80, h: 20, type: 'rock' },
    ];
}

export function createBushes(W, H) {
    // W = 900, H = 500
    return [
        // Góc trái trên
        { x: 40, y: 20, w: 40, h: 25 },
        { x: 100, y: 15, w: 35, h: 20 },
        
        // Góc phải trên
        { x: W - 80, y: 20, w: 40, h: 25 },
        { x: W - 140, y: 15, w: 35, h: 20 },
        
        // Giữa trên
        { x: W / 2 - 50, y: 20, w: 100, h: 25 },
        
        // Góc trái dưới
        { x: 40, y: H - 45, w: 40, h: 25 },
        { x: 100, y: H - 40, w: 35, h: 20 },
        
        // Góc phải dưới
        { x: W - 80, y: H - 45, w: 40, h: 25 },
        { x: W - 140, y: H - 40, w: 35, h: 20 },
        
        // Giữa dưới
        { x: W / 2 - 50, y: H - 45, w: 100, h: 25 },
        
        // Hai bên
        { x: 10, y: 230, w: 25, h: 40 },
        { x: W - 35, y: 230, w: 25, h: 40 },
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
            
            // Không spawn gần người chơi
            for (const p of game.players) {
                if (Math.hypot(x - p.x, y - p.y) < 60) valid = false;
            }
            
            // Không spawn lên vật cản
            for (const o of game.obstacles) {
                if (x > o.x - 25 && x < o.x + o.w + 25 && y > o.y - 25 && y < o.y + o.h + 25) valid = false;
            }
            
            // Không spawn lên bụi cỏ
            for (const b of game.bushes) {
                if (x > b.x - 10 && x < b.x + b.w + 10 && y > b.y - 10 && y < b.y + b.h + 10) valid = false;
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
        // Kiểm tra va chạm giữa hình tròn và hình chữ nhật
        const nearX = Math.max(o.x, Math.min(x, o.x + o.w));
        const nearY = Math.max(o.y, Math.min(y, o.y + o.h));
        const dx = x - nearX;
        const dy = y - nearY;
        if ((dx * dx + dy * dy) < (radius * radius)) {
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
