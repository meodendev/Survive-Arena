import { Player } from './player.js';
import { WEAPONS } from './weapon.js';
import { createMap, createBushes, spawnItems, checkCollision, rectCircleCollision } from './map.js';
import { updateUI, showWinner, showRoundWinner } from './ui.js';
import { spawnParticles } from './particle.js';

export const W = 420;
export const H = 746;

export const CONSTANTS = {
    PLAYER_RADIUS: 14,
    BULLET_RADIUS: 4,
    BOMB_RADIUS: 8,
    MAX_HP: 100,
    BULLET_DAMAGE: 10,
    BOMB_DAMAGE: 35,
    BOMB_BLAST_RADIUS: 80,
    BOMB_COOLDOWN: 3,
    MEDKIT_HEAL: 25,
    SPEED_DURATION: 5,
    ZONE_DAMAGE: 3,
    WIN_ROUNDS: 5,
    PLAYER_SPEED: 1.8,
    BULLET_SPEED: 6,
};

export class Game {
    constructor(width, height, dom, ctx) {
        this.W = width;
        this.H = height;
        this.dom = dom;
        this.ctx = ctx;
        
        // State
        this.players = [];
        this.bullets = [];
        this.bombs = [];
        this.items = [];
        this.particles = [];
        this.obstacles = [];
        this.bushes = [];
        this.zone = { x: width / 2, y: height / 2, radius: 280, targetRadius: 280, phase: 0 };
        this.round = 1;
        this.score1 = 0;
        this.score2 = 0;
        this.state = 'playing';
        this.winner = null;
        this.timer = 0;
        this.spawnTimer = 0;
        this.mode = 'local';
        this.running = false;
        
        // Create players
        this.p1 = new Player(1, 120, height / 2, '#ff6b6b', 'left');
        this.p2 = new Player(2, width - 120, height / 2, '#4ecdc4', 'right');
        this.p1.angle = 0;
        this.p2.angle = Math.PI;
        this.p1.weapons = ['pistol', 'shotgun', 'rifle', 'sniper', 'smg', 'ak'];
        this.p1.weapon = 'pistol';
        this.p2.weapons = ['pistol', 'shotgun', 'rifle', 'sniper', 'smg', 'ak'];
        this.p2.weapon = 'pistol';
    }
    
    start(mode) {
        this.mode = mode;
        this.running = true;
        if (mode === 'bot') {
            this.p2.isBot = true;
            this.p2.weapons = ['pistol', 'rifle', 'smg'];
            this.p2.weapon = 'pistol';
        }
        this.initRound();
    }
    
    initRound() {
        this.players = [];
        this.bullets = [];
        this.bombs = [];
        this.items = [];
        this.particles = [];
        this.obstacles = [];
        this.bushes = [];
        this.state = 'playing';
        this.winner = null;
        this.timer = 0;
        this.spawnTimer = 0;
        this.zone.radius = 280;
        this.zone.targetRadius = 280;
        this.zone.phase = 0;
        
        // Reset players
        this.p1.x = 120;
        this.p1.y = this.H / 2;
        this.p1.hp = CONSTANTS.MAX_HP;
        this.p1.alive = true;
        this.p1.shield = 0;
        this.p1.speedBoost = 0;
        this.p1.shootCooldown = 0;
        this.p1.bombCooldown = 0;
        this.p1.angle = 0;
        this.p1.input = { dx: 0, dy: 0, shoot: false, bomb: false, speed: false, weapon: false };
        
        this.p2.x = this.W - 120;
        this.p2.y = this.H / 2;
        this.p2.hp = CONSTANTS.MAX_HP;
        this.p2.alive = true;
        this.p2.shield = 0;
        this.p2.speedBoost = 0;
        this.p2.shootCooldown = 0;
        this.p2.bombCooldown = 0;
        this.p2.angle = Math.PI;
        this.p2.input = { dx: 0, dy: 0, shoot: false, bomb: false, speed: false, weapon: false };
        
        if (this.mode === 'bot') {
            this.p2.isBot = true;
        }
        
        this.players.push(this.p1, this.p2);
        this.obstacles = createMap(this.W, this.H);
        this.bushes = createBushes(this.W, this.H);
        spawnItems(this, 4);
        updateUI(this);
        this.dom.winnerMsg.style.display = 'none';
        this.dom.restartBtn.style.display = 'none';
        this.dom.weaponDisplay.textContent = '🔫 ' + this.p1.getWeapon().name;
        
        // Reset knobs
        document.getElementById('knobP1').style.transform = 'translate(-50%, -50%)';
        document.getElementById('knobP2').style.transform = 'translate(-50%, -50%)';
    }
    
    restart() {
        if (this.state === 'matchEnd') {
            this.score1 = 0;
            this.score2 = 0;
            this.round = 1;
        } else {
            this.round++;
        }
        this.initRound();
        this.dom.winnerMsg.style.display = 'none';
        this.dom.restartBtn.style.display = 'none';
    }
    
    update(dt) {
        if (!this.running || this.state === 'roundEnd' || this.state === 'matchEnd') return;
        
        this.timer += dt;
        
        // Zone
        if (this.timer > 30 && this.zone.phase === 0) {
            this.zone.phase = 1;
            this.zone.targetRadius = 120;
        }
        if (this.zone.phase === 1) {
            const shrink = 0.4 * dt * 60;
            if (this.zone.radius > this.zone.targetRadius) {
                this.zone.radius = Math.max(this.zone.targetRadius, this.zone.radius - shrink);
            } else {
                this.zone.phase = 2;
            }
            for (const p of this.players) {
                if (!p.alive) continue;
                const dist = Math.hypot(p.x - this.zone.x, p.y - this.zone.y);
                if (dist > this.zone.radius) {
                    p.takeDamage(CONSTANTS.ZONE_DAMAGE * dt);
                    if (!p.alive) this.checkRoundEnd();
                }
            }
        }
        
        // Spawn items
        this.spawnTimer += dt;
        if (this.spawnTimer > 8 && this.items.length < 12) {
            spawnItems(this, 2);
            this.spawnTimer = 0;
        }
        
        // Update players
        for (const p of this.players) {
            if (!p.alive) continue;
            const action = p.update(dt, this);
            if (action === 'shoot') this.shootBullet(p);
            else if (action === 'bomb') this.throwBomb(p);
            
            // Zone damage
            const dist = Math.hypot(p.x - this.zone.x, p.y - this.zone.y);
            if (dist > this.zone.radius) {
                p.takeDamage(CONSTANTS.ZONE_DAMAGE * dt);
                if (!p.alive) this.checkRoundEnd();
            }
            
            // Player collision
            for (const other of this.players) {
                if (other === p || !other.alive) continue;
                const d = Math.hypot(p.x - other.x, p.y - other.y);
                const minDist = p.radius + other.radius;
                if (d < minDist && d > 0) {
                    const angle = Math.atan2(p.y - other.y, p.x - other.x);
                    const overlap = (minDist - d) / 2;
                    p.x += Math.cos(angle) * overlap;
                    p.y += Math.sin(angle) * overlap;
                    other.x -= Math.cos(angle) * overlap;
                    other.y -= Math.sin(angle) * overlap;
                }
            }
        }
        
        // Update bullets
        for (let i = this.bullets.length - 1; i >= 0; i--) {
            const b = this.bullets[i];
            b.x += b.vx * dt * 60;
            b.y += b.vy * dt * 60;
            b.life -= dt;
            if (b.life <= 0 || b.x < 0 || b.x > this.W || b.y < 0 || b.y > this.H) {
                this.bullets.splice(i, 1);
                continue;
            }
            let hitObs = false;
            for (const o of this.obstacles) {
                if (b.x > o.x && b.x < o.x + o.w && b.y > o.y && b.y < o.y + o.h) {
                    if (b.pierce) {
                        spawnParticles(this, b.x, b.y, '#888', 3);
                    } else {
                        hitObs = true;
                        spawnParticles(this, b.x, b.y, '#888', 6);
                        break;
                    }
                }
            }
            if (hitObs) { this.bullets.splice(i, 1); continue; }
            for (const p of this.players) {
                if (!p.alive || p.id === b.ownerId) continue;
                if (Math.hypot(b.x - p.x, b.y - p.y) < p.radius + CONSTANTS.BULLET_RADIUS) {
                    p.takeDamage(b.damage || CONSTANTS.BULLET_DAMAGE);
                    spawnParticles(this, b.x, b.y, '#ff0', 10);
                    if (!b.pierce) {
                        this.bullets.splice(i, 1);
                    }
                    if (!p.alive) this.checkRoundEnd();
                    break;
                }
            }
        }
        
        // Update bombs
        for (let i = this.bombs.length - 1; i >= 0; i--) {
            const b = this.bombs[i];
            b.x += b.vx * dt * 60;
            b.y += b.vy * dt * 60;
            
            // Bomb collision with obstacles
            for (const o of this.obstacles) {
                if (rectCircleCollision(o.x, o.y, o.w, o.h, b.x, b.y, b.radius)) {
                    b.vx = 0;
                    b.vy = 0;
                    break;
                }
            }
            
            b.timer -= dt;
            if (b.timer <= 0) {
                this.explodeBomb(b);
                this.bombs.splice(i, 1);
            }
        }
        
        // Items
        for (let i = this.items.length - 1; i >= 0; i--) {
            const item = this.items[i];
            item.timer += dt;
            for (const p of this.players) {
                if (!p.alive) continue;
                if (Math.hypot(item.x - p.x, item.y - p.y) < p.radius + item.radius) {
                    this.applyItem(p, item);
                    spawnParticles(this, item.x, item.y, '#0f0', 8);
                    this.items.splice(i, 1);
                    break;
                }
            }
        }
        
        // Update particles
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const pt = this.particles[i];
            pt.x += pt.vx * dt * 60;
            pt.y += pt.vy * dt * 60;
            pt.vx *= 0.97;
            pt.vy *= 0.97;
            pt.life -= dt;
            if (pt.life <= 0) this.particles.splice(i, 1);
        }
        
        updateUI(this);
    }
    
    shootBullet(player) {
        const weapon = player.getWeapon();
        const angle = player.angle;
        const count = weapon.bullets || 1;
        for (let i = 0; i < count; i++) {
            const spread = (Math.random() - 0.5) * (weapon.spread || 0.05);
            const a = angle + spread;
            this.bullets.push({
                x: player.x + Math.cos(a) * 22,
                y: player.y + Math.sin(a) * 22,
                vx: Math.cos(a) * (weapon.speed || CONSTANTS.BULLET_SPEED),
                vy: Math.sin(a) * (weapon.speed || CONSTANTS.BULLET_SPEED),
                radius: CONSTANTS.BULLET_RADIUS,
                ownerId: player.id,
                life: (weapon.range || 400) / (weapon.speed || CONSTANTS.BULLET_SPEED) / 60,
                damage: weapon.damage || CONSTANTS.BULLET_DAMAGE,
                pierce: weapon.pierce || false,
            });
        }
        spawnParticles(this, player.x + Math.cos(angle) * 22, player.y + Math.sin(angle) * 22, '#ffa500', 4);
    }
    
    throwBomb(player) {
        const angle = player.angle;
        this.bombs.push({
            x: player.x + Math.cos(angle) * 30,
            y: player.y + Math.sin(angle) * 30,
            radius: CONSTANTS.BOMB_RADIUS,
            ownerId: player.id,
            timer: 1.2,
            vx: Math.cos(angle) * 1.5,
            vy: Math.sin(angle) * 1.5,
        });
    }
    
    explodeBomb(bomb) {
        for (const p of this.players) {
            if (!p.alive) continue;
            const dist = Math.hypot(bomb.x - p.x, bomb.y - p.y);
            if (dist < CONSTANTS.BOMB_BLAST_RADIUS) {
                const dmg = CONSTANTS.BOMB_DAMAGE * (1 - dist / CONSTANTS.BOMB_BLAST_RADIUS);
                p.takeDamage(Math.round(dmg));
                if (!p.alive) this.checkRoundEnd();
            }
        }
        spawnParticles(this, bomb.x, bomb.y, '#ff6600', 30);
        spawnParticles(this, bomb.x, bomb.y, '#ff4400', 20);
        for (let i = this.obstacles.length - 1; i >= 0; i--) {
            const o = this.obstacles[i];
            const cx = o.x + o.w / 2, cy = o.y + o.h / 2;
            if (Math.hypot(bomb.x - cx, bomb.y - cy) < CONSTANTS.BOMB_BLAST_RADIUS * 0.6) {
                spawnParticles(this, cx, cy, '#8B7355', 10);
                this.obstacles.splice(i, 1);
            }
        }
    }
    
    applyItem(player, item) {
        const weaponMap = {
            shotgun: 'shotgun',
            rifle: 'rifle',
            sniper: 'sniper',
            smg: 'smg',
            ak: 'ak'
        };
        if (weaponMap[item.type]) {
            player.addWeapon(weaponMap[item.type]);
            return;
        }
        switch (item.type) {
            case 'medkit':
                player.hp = Math.min(player.maxHp, player.hp + CONSTANTS.MEDKIT_HEAL);
                break;
            case 'speed':
                player.speedBoost = CONSTANTS.SPEED_DURATION;
                break;
            case 'shield':
                player.shield = 3;
                break;
        }
    }
    
    checkRoundEnd() {
        const alive = this.players.filter(p => p.alive);
        if (alive.length === 1) {
            this.state = 'roundEnd';
            this.winner = alive[0];
            if (this.winner.id === 1) this.score1++;
            else this.score2++;
            if (this.score1 >= CONSTANTS.WIN_ROUNDS || this.score2 >= CONSTANTS.WIN_ROUNDS) {
                this.state = 'matchEnd';
                showWinner(this);
            } else {
                showRoundWinner(this);
            }
            updateUI(this);
        }
    }
    
    handleKeyDown(key, keys) {
        const p1 = this.p1;
        const p2 = this.p2;
        if (!this.running) return;
        
        // P1: WASD
        let dx1 = 0, dy1 = 0;
        if (keys['w'] || keys['W']) dy1 = -1;
        if (keys['s'] || keys['S']) dy1 = 1;
        if (keys['a'] || keys['A']) dx1 = -1;
        if (keys['d'] || keys['D']) dx1 = 1;
        const len1 = Math.hypot(dx1, dy1);
        if (len1 > 0) {
            p1.input.dx = dx1 / len1;
            p1.input.dy = dy1 / len1;
        }
        if (key === ' ' || key === 'Space') {
            e.preventDefault();
            p1.input.shoot = true;
        }
        if (key === 'q' || key === 'Q') p1.input.bomb = true;
        if (key === 'e' || key === 'E') {
            p1.input.weapon = true;
            setTimeout(() => p1.input.weapon = false, 100);
        }
        
        // P2: Arrow keys
        let dx2 = 0, dy2 = 0;
        if (keys['ArrowUp']) dy2 = -1;
        if (keys['ArrowDown']) dy2 = 1;
        if (keys['ArrowLeft']) dx2 = -1;
        if (keys['ArrowRight']) dx2 = 1;
        const len2 = Math.hypot(dx2, dy2);
        if (len2 > 0) {
            p2.input.dx = dx2 / len2;
            p2.input.dy = dy2 / len2;
        }
        if (key === 'Enter') {
            e.preventDefault();
            p2.input.shoot = true;
        }
        if (key === '.') p2.input.bomb = true;
        if (key === '/') {
            p2.input.weapon = true;
            setTimeout(() => p2.input.weapon = false, 100);
        }
    }
    
    handleKeyUp(key, keys) {
        const p1 = this.p1;
        const p2 = this.p2;
        if (!this.running) return;
        
        if (key === ' ' || key === 'Space') p1.input.shoot = false;
        if (key === 'q' || key === 'Q') p1.input.bomb = false;
        if (key === 'Enter') p2.input.shoot = false;
        if (key === '.') p2.input.bomb = false;
        
        // Update WASD
        let dx1 = 0, dy1 = 0;
        if (keys['w'] || keys['W']) dy1 = -1;
        if (keys['s'] || keys['S']) dy1 = 1;
        if (keys['a'] || keys['A']) dx1 = -1;
        if (keys['d'] || keys['D']) dx1 = 1;
        const len1 = Math.hypot(dx1, dy1);
        if (len1 > 0) {
            p1.input.dx = dx1 / len1;
            p1.input.dy = dy1 / len1;
        } else {
            p1.input.dx = 0;
            p1.input.dy = 0;
        }
        
        let dx2 = 0, dy2 = 0;
        if (keys['ArrowUp']) dy2 = -1;
        if (keys['ArrowDown']) dy2 = 1;
        if (keys['ArrowLeft']) dx2 = -1;
        if (keys['ArrowRight']) dx2 = 1;
        const len2 = Math.hypot(dx2, dy2);
        if (len2 > 0) {
            p2.input.dx = dx2 / len2;
            p2.input.dy = dy2 / len2;
        } else {
            p2.input.dx = 0;
            p2.input.dy = 0;
        }
    }
    
    render() {
        const ctx = this.ctx;
        const W = this.W;
        const H = this.H;
        
        ctx.clearRect(0, 0, W, H);
        
        // Background
        const grad = ctx.createRadialGradient(W / 2, H / 2, 50, W / 2, H / 2, 400);
        grad.addColorStop(0, '#3a5a7a');
        grad.addColorStop(1, '#1a2a3a');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, W, H);
        
        // Zone
        ctx.save();
        ctx.beginPath();
        ctx.arc(this.zone.x, this.zone.y, this.zone.radius, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(0, 255, 100, 0.05)';
        ctx.fill();
        ctx.strokeStyle = 'rgba(0, 255, 100, 0.3)';
        ctx.lineWidth = 2;
        ctx.setLineDash([6, 8]);
        ctx.stroke();
        ctx.restore();
        
        // Bushes
        for (const b of this.bushes) {
            ctx.fillStyle = 'rgba(40, 120, 40, 0.5)';
            ctx.beginPath();
            ctx.ellipse(b.x + b.w / 2, b.y + b.h / 2, b.w / 2, b.h / 2, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = 'rgba(50, 140, 50, 0.3)';
            ctx.beginPath();
            ctx.ellipse(b.x + b.w / 3, b.y + b.h / 3, b.w / 3, b.h / 3, 0, 0, Math.PI * 2);
            ctx.fill();
        }
        
        // Obstacles
        for (const o of this.obstacles) {
            if (o.type === 'box') {
                ctx.fillStyle = '#8B7D6B';
                ctx.shadowColor = 'rgba(0,0,0,0.3)';
                ctx.shadowBlur = 8;
                ctx.fillRect(o.x, o.y, o.w, o.h);
                ctx.shadowBlur = 0;
                ctx.strokeStyle = '#6B5D4B';
                ctx.lineWidth = 1;
                ctx.strokeRect(o.x, o.y, o.w, o.h);
            } else if (o.type === 'rock') {
                ctx.fillStyle = '#7A7A7A';
                ctx.shadowBlur = 8;
                ctx.shadowColor = 'rgba(0,0,0,0.3)';
                ctx.beginPath();
                ctx.ellipse(o.x + o.w / 2, o.y + o.h / 2, o.w / 2, o.h / 2, 0, 0, Math.PI * 2);
                ctx.fill();
                ctx.shadowBlur = 0;
            } else if (o.type === 'wall') {
                ctx.fillStyle = '#6B7B8D';
                ctx.shadowBlur = 8;
                ctx.shadowColor = 'rgba(0,0,0,0.3)';
                ctx.fillRect(o.x, o.y, o.w, o.h);
                ctx.shadowBlur = 0;
                ctx.strokeStyle = '#4A5A6D';
                ctx.lineWidth = 1;
                ctx.strokeRect(o.x, o.y, o.w, o.h);
            }
        }
        
        // Items
        for (const item of this.items) {
            ctx.shadowColor = 'rgba(255,255,255,0.2)';
            ctx.shadowBlur = 10;
            ctx.beginPath();
            ctx.arc(item.x, item.y, item.radius, 0, Math.PI * 2);
            let color = '#fff';
            let symbol = '?';
            switch (item.type) {
                case 'medkit': color = '#ff3366'; symbol = '❤️'; break;
                case 'speed': color = '#33ddff'; symbol = '⚡'; break;
                case 'shield': color = '#66ff99'; symbol = '🛡'; break;
                case 'shotgun': color = '#ff8833'; symbol = '🔫'; break;
                case 'rifle': color = '#33ff88'; symbol = '🔫'; break;
                case 'sniper': color = '#ff33ff'; symbol = '🔫'; break;
                case 'smg': color = '#33ddff'; symbol = '🔫'; break;
                case 'ak': color = '#ff6633'; symbol = '🔫'; break;
            }
            ctx.fillStyle = color + '44';
            ctx.fill();
            ctx.shadowBlur = 0;
            ctx.fillStyle = color;
            ctx.font = '16px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(symbol, item.x, item.y + 1);
            ctx.strokeStyle = color + '66';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(item.x, item.y, item.radius + 3 + Math.sin(item.timer * 2) * 2, 0, Math.PI * 2);
            ctx.stroke();
        }
        
        // Bombs
        for (const b of this.bombs) {
            const pulse = 1 + Math.sin(b.timer * 15) * 0.1;
            ctx.shadowColor = '#ff4400';
            ctx.shadowBlur = 20;
            ctx.beginPath();
            ctx.arc(b.x, b.y, b.radius * pulse, 0, Math.PI * 2);
            ctx.fillStyle = '#ff4400';
            ctx.fill();
            ctx.shadowBlur = 0;
            ctx.fillStyle = '#ff8800';
            ctx.font = '14px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('💣', b.x, b.y + 1);
            if (b.timer < 0.5) {
                ctx.strokeStyle = `rgba(255, 68, 0, ${0.5 - b.timer})`;
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.arc(b.x, b.y, CONSTANTS.BOMB_BLAST_RADIUS * (1 - b.timer / 0.5) * 0.5, 0, Math.PI * 2);
                ctx.stroke();
            }
        }
        
        // Bullets
        for (const b of this.bullets) {
            ctx.shadowColor = '#ffaa00';
            ctx.shadowBlur = 12;
            ctx.beginPath();
            ctx.arc(b.x, b.y, b.radius, 0, Math.PI * 2);
            ctx.fillStyle = b.pierce ? '#ff33ff' : '#ffdd44';
            ctx.fill();
            ctx.shadowBlur = 0;
            if (b.pierce) {
                ctx.strokeStyle = 'rgba(255, 51, 255, 0.5)';
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.arc(b.x, b.y, b.radius + 3, 0, Math.PI * 2);
                ctx.stroke();
            }
        }
        
        // Players
        for (const p of this.players) {
            if (!p.alive) continue;
            const isP1 = p.id === 1;
            ctx.shadowColor = 'rgba(0,0,0,0.3)';
            ctx.shadowBlur = 15;
            
            const grad2 = ctx.createRadialGradient(p.x - 4, p.y - 4, 2, p.x, p.y, p.radius);
            grad2.addColorStop(0, isP1 ? '#ff8a8a' : '#6ee0d8');
            grad2.addColorStop(1, p.color);
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
            ctx.fillStyle = grad2;
            ctx.fill();
            ctx.shadowBlur = 0;
            ctx.strokeStyle = isP1 ? '#cc3333' : '#2aa89e';
            ctx.lineWidth = 2;
            ctx.stroke();
            
            // Eyes
            const eyeX = p.x + Math.cos(p.angle) * 8;
            const eyeY = p.y + Math.sin(p.angle) * 8;
            ctx.fillStyle = '#fff';
            ctx.beginPath();
            ctx.arc(eyeX - Math.sin(p.angle) * 5, eyeY + Math.cos(p.angle) * 5, 5, 0, Math.PI * 2);
            ctx.fill();
            ctx.beginPath();
            ctx.arc(eyeX + Math.sin(p.angle) * 5, eyeY + Math.cos(p.angle) * 5, 5, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#222';
            ctx.beginPath();
            ctx.arc(eyeX - Math.sin(p.angle) * 5 + Math.cos(p.angle) * 2, eyeY + Math.cos(p.angle) * 5 + Math.sin(p.angle) * 2, 2.5, 0, Math.PI * 2);
            ctx.fill();
            ctx.beginPath();
            ctx.arc(eyeX + Math.sin(p.angle) * 5 + Math.cos(p.angle) * 2, eyeY + Math.cos(p.angle) * 5 + Math.sin(p.angle) * 2, 2.5, 0, Math.PI * 2);
            ctx.fill();
            
            // Bot label
            if (p.isBot) {
                ctx.fillStyle = 'rgba(255,255,255,0.3)';
                ctx.font = '8px Arial';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'top';
                ctx.fillText('🤖', p.x, p.y + p.radius + 4);
            }
            
            // Shield
            if (p.shield > 0) {
                ctx.strokeStyle = `rgba(100, 255, 150, ${0.3 + Math.sin(this.timer * 8) * 0.1})`;
                ctx.lineWidth = 3;
                ctx.setLineDash([4, 6]);
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.radius + 8, 0, Math.PI * 2);
                ctx.stroke();
                ctx.setLineDash([]);
            }
            if (p.speedBoost > 0) {
                ctx.strokeStyle = `rgba(50, 220, 255, ${0.2 + Math.sin(this.timer * 10) * 0.1})`;
                ctx.lineWidth = 4;
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.radius + 14, 0, Math.PI * 2);
                ctx.stroke();
            }
            
            // Name
            ctx.fillStyle = '#fff';
            ctx.font = '9px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'bottom';
            ctx.shadowColor = 'rgba(0,0,0,0.8)';
            ctx.shadowBlur = 6;
            const label = isP1 ? 'P1' : (p.isBot ? '🤖 Bot' : 'P2');
            ctx.fillText(label, p.x, p.y - p.radius - 6);
            ctx.shadowBlur = 0;
            
            // HP bar
            const hpW = 28;
            const hpH = 3;
            const hpX = p.x - hpW / 2;
            const hpY = p.y - p.radius - 14;
            ctx.fillStyle = 'rgba(0,0,0,0.5)';
            ctx.fillRect(hpX, hpY, hpW, hpH);
            ctx.fillStyle = isP1 ? '#ff4444' : '#44aaff';
            ctx.fillRect(hpX, hpY, hpW * (p.hp / p.maxHp), hpH);
        }
        
        // Particles
        for (const pt of this.particles) {
            const alpha = Math.max(0, pt.life / pt.maxLife);
            ctx.globalAlpha = alpha;
            ctx.fillStyle = pt.color;
            ctx.beginPath();
            ctx.arc(pt.x, pt.y, pt.radius * alpha, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.globalAlpha = 1;
    }
}
