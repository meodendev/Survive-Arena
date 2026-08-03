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
        
        // Move
        const len = Math.hypot(this.input.dx, this.input.dy);
        if (len > 0.1) {
            const normX = this.input.dx / len;
            const normY = this.input.dy / len;
            const newX = this.x + normX * this.speed * dt * 60;
            const newY = this.y + normY * this.speed * dt * 60;
            if (!checkCollision(newX, this.y, this.radius, game.obstacles)) {
                this.x = newX;
            }
            if (!checkCollision(this.x, newY, this.radius, game.obstacles)) {
                this.y = newY;
            }
            this.angle = Math.atan2(normY, normX);
        }
        
        // Weapon switch
        if (this.input.weapon) {
            this.switchWeapon();
            this.input.weapon = false;
            if (this.id === 1) {
                game.dom.weaponDisplay.textContent = '🔫 ' + this.getWeapon().name;
            }
        }
        
        // Actions
        if (this.input.shoot && this.shootCooldown <= 0) {
            this.shootCooldown = this.getWeapon().cooldown;
            return 'shoot';
        }
        if (this.input.bomb && this.bombCooldown <= 0) {
            this.bombCooldown = 3;
            return 'bomb';
        }
        if (this.input.speed && this.speedBoost <= 0) {
            this.speedBoost = 5;
            this.input.speed = false;
            return 'speed';
        }
        return null;
    }
    
    updateBot(dt, game) {
        const target = game.players.find(p => p.id !== this.id && p.alive);
        if (!target) return;
        
        this.botTimer += dt;
        const dx = target.x - this.x;
        const dy = target.y - this.y;
        const dist = Math.hypot(dx, dy);
        
        // Move towards target
        if (dist > 30) {
            this.input.dx = dx / dist;
            this.input.dy = dy / dist;
        } else {
            // Random movement when close
            if (Math.random() < 0.02) {
                const angle = Math.random() * Math.PI * 2;
                this.input.dx = Math.cos(angle);
                this.input.dy = Math.sin(angle);
            }
        }
        this.angle = Math.atan2(dy, dx);
        
        // Shoot
        if (dist < 400 && Math.random() < 0.04) {
            this.input.shoot = true;
        } else {
            this.input.shoot = false;
        }
        
        // Bomb
        if (dist < 150 && Math.random() < 0.005) {
            this.input.bomb = true;
        } else {
            this.input.bomb = false;
        }
        
        // Speed boost
        if (this.speedBoost <= 0 && Math.random() < 0.002) {
            this.input.speed = true;
        }
        
        // Dodge bullets
        for (const b of game.bullets) {
            if (b.ownerId === this.id) continue;
            const d = Math.hypot(b.x - this.x, b.y - this.y);
            if (d < 100) {
                const angle = Math.atan2(this.y - b.y, this.x - b.x);
                this.input.dx = Math.cos(angle) * 0.5 + this.input.dx * 0.5;
                this.input.dy = Math.sin(angle) * 0.5 + this.input.dy * 0.5;
                const len = Math.hypot(this.input.dx, this.input.dy);
                if (len > 0) {
                    this.input.dx /= len;
                    this.input.dy /= len;
                }
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
