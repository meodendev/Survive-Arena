import { WEAPONS } from './weapon.js';
import { checkCollision } from './map.js';

export class Player {
    constructor(id, x, y, color, side) {
        this.id = id;
        this.x = x;
        this.y = y;
        this.radius = 14;
        this.color = color;
        this.side = side;
        this.hp = 100;
        this.maxHp = 100;
        this.speed = 1.8;
        this.baseSpeed = 1.8;
        this.angle = 0;
        this.shootCooldown = 0;
        this.bombCooldown = 0;
        this.speedBoost = 0;
        this.shield = 0;
        this.alive = true;
        this.weapon = 'pistol';
        this.weapons = ['pistol'];
        this.weaponIndex = 0;
        this.input = { dx: 0, dy: 0, shoot: false, bomb: false, speed: false, weapon: false };
        this.isBot = false;
        this.botTimer = 0;
        this.botTarget = null;
        this.botState = 'idle'; // 'idle', 'chase', 'flee', 'loot'
        this.botStateTimer = 0;
    }
    
    getWeapon() {
        return WEAPONS[this.weapon] || WEAPONS.pistol;
    }
    
    switchWeapon() {
        if (this.weapons.length <= 1) return;
        this.weaponIndex = (this.weaponIndex + 1) % this.weapons.length;
        this.weapon = this.weapons[this.weaponIndex];
    }
    
    addWeapon(name) {
        if (!this.weapons.includes(name)) {
            this.weapons.push(name);
            this.weaponIndex = this.weapons.length - 1;
            this.weapon = name;
        }
    }
    
    update(dt, game) {
        if (!this.alive) return;
        
        // Cooldowns
        if (this.shootCooldown > 0) this.shootCooldown -= dt;
        if (this.bombCooldown > 0) this.bombCooldown -= dt;
        if (this.speedBoost > 0) {
            this.speedBoost -= dt;
            this.speed = this.baseSpeed * 1.7;
            if (this.speedBoost <= 0) this.speed = this.baseSpeed;
        }
        if (this.shield > 0) this.shield -= dt;
        
        // Bot AI
        if (this.isBot) {
            this.updateBot(dt, game);
        }
        
        // Di chuyển
        const len = Math.hypot(this.input.dx, this.input.dy);
        if (len > 0.1) {
            const normX = this.input.dx / len;
            const normY = this.input.dy / len;
            const newX = this.x + normX * this.speed * dt * 60;
            const newY = this.y + normY * this.speed * dt * 60;
            
            // Kiểm tra va chạm với vật cản
            if (!checkCollision(newX, this.y, this.radius, game.obstacles)) {
                this.x = newX;
            }
            if (!checkCollision(this.x, newY, this.radius, game.obstacles)) {
                this.y = newY;
            }
            this.angle = Math.atan2(normY, normX);
        }
        
        // Đổi súng
        if (this.input.weapon) {
            this.switchWeapon();
            this.input.weapon = false;
            if (this.id === 1) {
                game.dom.weaponDisplay.textContent = '🔫 ' + this.getWeapon().name;
            }
        }
        
        // Bắn
        if (this.input.shoot && this.shootCooldown <= 0) {
            this.shootCooldown = this.getWeapon().cooldown;
            return 'shoot';
        }
        
        // Bom
        if (this.input.bomb && this.bombCooldown <= 0) {
            this.bombCooldown = 3;
            return 'bomb';
        }
        
        // Tăng tốc
        if (this.input.speed && this.speedBoost <= 0) {
            this.speedBoost = 5;
            this.input.speed = false;
            return 'speed';
        }
        return null;
    }
    
    updateBot(dt, game) {
        this.botTimer += dt;
        this.botStateTimer += dt;
        
        // Tìm mục tiêu (người chơi thật)
        const target = game.players.find(p => p.id !== this.id && p.alive && !p.isBot);
        if (!target) {
            // Nếu không có target, tìm bot khác hoặc di chuyển ngẫu nhiên
            this.input.dx = Math.sin(this.botTimer * 0.5);
            this.input.dy = Math.cos(this.botTimer * 0.7);
            return;
        }
        
        const dx = target.x - this.x;
        const dy = target.y - this.y;
        const dist = Math.hypot(dx, dy);
        
        // Đổi trạng thái
        if (this.botStateTimer > 2 + Math.random() * 3) {
            const states = ['chase', 'chase', 'chase', 'flee', 'loot'];
            this.botState = states[Math.floor(Math.random() * states.length)];
            this.botStateTimer = 0;
        }
        
        // Xử lý theo trạng thái
        switch (this.botState) {
            case 'chase':
                if (dist > 30) {
                    this.input.dx = dx / dist;
                    this.input.dy = dy / dist;
                } else {
                    // Né tránh khi quá gần
                    const angle = Math.atan2(dy, dx) + (Math.random() - 0.5) * 1.5;
                    this.input.dx = Math.cos(angle);
                    this.input.dy = Math.sin(angle);
                }
                this.angle = Math.atan2(dy, dx);
                break;
                
            case 'flee':
                if (dist < 300) {
                    this.input.dx = -dx / dist;
                    this.input.dy = -dy / dist;
                } else {
                    this.input.dx = Math.sin(this.botTimer * 0.3);
                    this.input.dy = Math.cos(this.botTimer * 0.4);
                }
                this.angle = Math.atan2(dy, dx);
                break;
                
            case 'loot':
                // Tìm vật phẩm gần nhất
                let nearestItem = null;
                let nearestDist = Infinity;
                for (const item of game.items) {
                    const d = Math.hypot(item.x - this.x, item.y - this.y);
                    if (d < nearestDist) {
                        nearestDist = d;
                        nearestItem = item;
                    }
                }
                if (nearestItem && nearestDist < 200) {
                    const ix = nearestItem.x - this.x;
                    const iy = nearestItem.y - this.y;
                    const ilen = Math.hypot(ix, iy);
                    if (ilen > 10) {
                        this.input.dx = ix / ilen;
                        this.input.dy = iy / ilen;
                    }
                } else {
                    this.input.dx = Math.sin(this.botTimer * 0.5);
                    this.input.dy = Math.cos(this.botTimer * 0.7);
                }
                this.angle = Math.atan2(dy, dx);
                break;
                
            default:
                this.input.dx = Math.sin(this.botTimer * 0.5);
                this.input.dy = Math.cos(this.botTimer * 0.7);
        }
        
        // Bắn
        if (dist < 400 && Math.random() < 0.04 + (1 - dist / 400) * 0.03) {
            this.input.shoot = true;
            // Aim prediction
            if (target) {
                const predX = target.x + target.speed * 0.2;
                const predY = target.y + target.speed * 0.2;
                this.angle = Math.atan2(predY - this.y, predX - this.x);
            }
        } else {
            this.input.shoot = false;
        }
        
        // Bom
        if (dist < 150 && Math.random() < 0.005) {
            this.input.bomb = true;
        } else {
            this.input.bomb = false;
        }
        
        // Tăng tốc
        if (this.speedBoost <= 0 && Math.random() < 0.002) {
            this.input.speed = true;
        }
        
        // Né đạn
        let danger = false;
        for (const b of game.bullets) {
            if (b.ownerId === this.id) continue;
            const d = Math.hypot(b.x - this.x, b.y - this.y);
            if (d < 100) {
                danger = true;
                const angle = Math.atan2(this.y - b.y, this.x - b.x);
                // Kết hợp với hướng di chuyển hiện tại
                this.input.dx = Math.cos(angle) * 0.7 + this.input.dx * 0.3;
                this.input.dy = Math.sin(angle) * 0.7 + this.input.dy * 0.3;
                const len = Math.hypot(this.input.dx, this.input.dy);
                if (len > 0) {
                    this.input.dx /= len;
                    this.input.dy /= len;
                }
                break;
            }
        }
        
        // Tránh bo
        const zoneDist = Math.hypot(this.x - game.zone.x, this.y - game.zone.y);
        if (zoneDist > game.zone.radius * 0.7) {
            const angle = Math.atan2(game.zone.y - this.y, game.zone.x - this.x);
            this.input.dx = Math.cos(angle) * 0.5 + this.input.dx * 0.5;
            this.input.dy = Math.sin(angle) * 0.5 + this.input.dy * 0.5;
            const len = Math.hypot(this.input.dx, this.input.dy);
            if (len > 0) {
                this.input.dx /= len;
                this.input.dy /= len;
            }
        }
    }
    
    takeDamage(dmg) {
        if (this.shield > 0) {
            this.shield = 0;
            return;
        }
        this.hp = Math.max(0, this.hp - dmg);
        if (this.hp <= 0) {
            this.hp = 0;
            this.alive = false;
        }
    }
}
