import {
    PLAYER_WIDTH, PLAYER_HEIGHT, GRAVITY, JUMP_FORCE, SCREEN_HEIGHT, PLATFORM_HEIGHT, SCREEN_WIDTH
} from './constants';

/**
 * Representa um vetor 2D para posições e velocidades.
 */
export class Vector2D {
    constructor(x, y) { this.x = x; this.y = y; }
    add(other) { this.x += other.x; this.y += other.y; }
}

/**
 * Representa o jogador, controlando seu estado, ações e renderização.
 */
export class Player {
    constructor(stats) {
        // Posição e movimento
        this.position = new Vector2D(100, SCREEN_HEIGHT - 200);
        this.velocity = new Vector2D(0, 0);
        this.width = PLAYER_WIDTH; this.height = PLAYER_HEIGHT;
        this.isJumping = false; this.onGround = false;

        // Atributos do jogador baseados nos upgrades comprados
        this.maxHealth = stats.health;
        this.health = this.maxHealth;
        this.damage = stats.damage;
        this.attackCooldownDuration = stats.attackSpeed;
        this.blockChargesMax = stats.blockCharges;
        this.blockCharges = this.blockChargesMax;
        this.blockCooldownDuration = stats.blockCooldown;

        // Estados de combate e interação
        this.isAttacking = false; this.isBlocking = false; this.canBlock = true;
        this.blockCooldown = 0;
        this.blockReadyPulse = 0;
        this.attackBox = { x: 0, y: 0, width: 50, height: 50 }; // Considere tornar width/height constantes
        this.attackCooldown = 0;
        this.invincibilityFrames = 0;
        this.direction = 1;
    }

    applyGravity() {
        this.velocity.y += GRAVITY;
        this.onGround = false;
    }

    jump() {
        if (!this.isJumping && this.onGround && !this.isBlocking) {
            this.velocity.y = -JUMP_FORCE; this.isJumping = true;
        }
    }

    attack() {
        if (this.attackCooldown <= 0 && !this.isBlocking) {
            this.isAttacking = true; this.attackCooldown = this.attackCooldownDuration;
        }
    }

    takeDamage(amount) {
        if (this.invincibilityFrames > 0) return;

        if (this.isBlocking) {
            this.blockCharges--;
            if (this.blockCharges <= 0) {
                this.blockCooldown = this.blockCooldownDuration;
                this.canBlock = false;
                this.isBlocking = false;
            }
        } else {
            this.health -= amount;
            this.invincibilityFrames = 90; // Considere tornar uma constante
        }
    }

    heal(amount) {
        this.health = Math.min(this.maxHealth, this.health + amount);
    }

    update() {
        if (!this.isBlocking) {
            this.position.add(this.velocity);
        } else {
            this.position.y += this.velocity.y; // Permite movimento vertical ao bloquear
        }

        if (this.attackCooldown > 0) this.attackCooldown--;
        if (this.invincibilityFrames > 0) this.invincibilityFrames--;

        if (this.blockCooldown > 0) {
            this.blockCooldown--;
            if (this.blockCooldown <= 0) {
                this.canBlock = true;
                this.blockReadyPulse = 30; // Considere tornar uma constante
                this.blockCharges = this.blockChargesMax;
            }
        }

        if (this.blockReadyPulse > 0) this.blockReadyPulse--;

        if (!this.isBlocking && this.velocity.x !== 0) { this.direction = Math.sign(this.velocity.x); }

        this.attackBox.x = this.direction > 0 ? this.position.x + this.width : this.position.x - this.attackBox.width;
        this.attackBox.y = this.position.y;

        if (this.attackCooldown < this.attackCooldownDuration - 10) { // Ajuste para fim da animação de ataque
             this.isAttacking = false;
        }
    }

    handleCollision(platform) {
        const p = {
            left: this.position.x, right: this.position.x + this.width, top: this.position.y, bottom: this.position.y + this.height,
            prevTop: this.position.y - this.velocity.y, prevBottom: this.position.y + this.height - this.velocity.y,
            prevLeft: this.position.x - this.velocity.x, prevRight: this.position.x + this.width - this.velocity.x
        };
        const plat = { left: platform.x, right: platform.x + platform.width, top: platform.y, bottom: platform.y + platform.height };

        if (p.right > plat.left && p.left < plat.right) { // Check X overlap
            // Check for landing on top
            if (this.velocity.y >= 0 && p.bottom >= plat.top && p.prevBottom <= plat.top) {
                this.position.y = plat.top - this.height; this.velocity.y = 0; this.isJumping = false; this.onGround = true; return;
            }
            // Check for hitting head on bottom
            if (this.velocity.y < 0 && p.top <= plat.bottom && p.prevTop >= plat.bottom) {
                this.position.y = plat.bottom; this.velocity.y = 0; return;
            }
        }
        // Check for side collisions (only if there's Y overlap)
        if (p.bottom > plat.top && p.top < plat.bottom) {
            if (this.velocity.x > 0 && p.right > plat.left && p.prevRight <= plat.left) { this.position.x = plat.left - this.width; this.velocity.x = 0; return; }
            if (this.velocity.x < 0 && p.left < plat.right && p.prevLeft >= plat.right) { this.position.x = plat.right; this.velocity.x = 0; return; }
        }
    }

    drawBlockCooldown(ctx, cameraX) {
        const indicatorX = this.position.x + this.width / 2 - cameraX;
        const indicatorY = this.position.y - 20;
        const radius = 8;

        if (this.blockCooldown <= 0 && this.blockReadyPulse <= 0 && this.canBlock) {
            for (let i = 0; i < this.blockCharges; i++) {
                ctx.beginPath();
                ctx.arc(indicatorX - (this.blockChargesMax * 6) / 2 + 6 + (i * 12), indicatorY, 4, 0, 2 * Math.PI);
                ctx.fillStyle = 'cyan';
                ctx.fill();
            }
            return;
        }

        ctx.beginPath(); ctx.arc(indicatorX, indicatorY, radius, 0, 2 * Math.PI); ctx.fillStyle = 'rgba(0, 0, 0, 0.7)'; ctx.fill();
        if (this.blockCooldown > 0) {
            const fillRatio = (this.blockCooldownDuration - this.blockCooldown) / this.blockCooldownDuration;
            ctx.beginPath(); ctx.moveTo(indicatorX, indicatorY);
            ctx.arc(indicatorX, indicatorY, radius, -Math.PI / 2, -Math.PI / 2 + (fillRatio * 2 * Math.PI)); ctx.lineTo(indicatorX, indicatorY);
            ctx.fillStyle = 'white'; ctx.fill();
        } else if (this.blockReadyPulse > 0) {
            const pulseRatio = this.blockReadyPulse / 30;
            const pulseRadius = radius * (1 + Math.sin(pulseRatio * Math.PI) * 0.4);
            ctx.beginPath(); ctx.arc(indicatorX, indicatorY, pulseRadius, 0, 2 * Math.PI);
            ctx.fillStyle = `rgba(255, 255, 255, ${pulseRatio})`; ctx.fill();
        }
    }

    draw(ctx, cameraX, _assets) { 
        ctx.save();
        ctx.fillStyle = (this.invincibilityFrames > 0 && Math.floor(this.invincibilityFrames / 6) % 2 === 0) ? '#ff4d4d' : '#4A4A4A';
        ctx.fillRect(this.position.x - cameraX, this.position.y, this.width, this.height);
        ctx.strokeStyle = '#2c2c2c'; ctx.lineWidth = 2; ctx.strokeRect(this.position.x - cameraX, this.position.y, this.width, this.height);
        ctx.restore();

        if (this.isBlocking) {
            ctx.fillStyle = '#37474F';
            const shieldX = this.direction > 0 ? this.position.x + this.width : this.position.x - 10;
            ctx.fillRect(shieldX - cameraX, this.position.y, 10, this.height);
            ctx.strokeStyle = '#263238'; ctx.strokeRect(shieldX - cameraX, this.position.y, 10, this.height);
        } else if (this.isAttacking) {
            ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
            ctx.fillRect(this.attackBox.x - cameraX, this.attackBox.y, this.attackBox.width, this.attackBox.height);
        }
        this.drawBlockCooldown(ctx, cameraX);
    }
}

export class Platform {
    constructor(x, y, width) { this.x = x; this.y = y; this.width = width; this.height = PLATFORM_HEIGHT; }
     draw(ctx, cameraX, assets) {
        const screenX = this.x - cameraX;
        const platformTexture = assets?.platform;

        // Desenha a parte de cima da plataforma com textura
        if (platformTexture && assets.loaded) {
            ctx.save();
            const pattern = ctx.createPattern(platformTexture, 'repeat');
            ctx.fillStyle = pattern;
            ctx.translate(screenX, this.y);
            ctx.fillRect(0, 0, this.width, this.height);
            ctx.restore();
        } else {
            // Fallback caso a textura não carregue para a plataforma
            ctx.fillStyle = '#616161';
            ctx.fillRect(screenX, this.y, this.width, this.height);
        }

        // Desenha a "terra" embaixo da plataforma com textura e escurecida
        if (platformTexture && assets.loaded) {
            ctx.save();
            const pattern = ctx.createPattern(platformTexture, 'repeat');
            ctx.fillStyle = pattern;
            // Desenha a textura para a parte da terra
            ctx.translate(screenX, this.y + this.height);
            ctx.fillRect(0, 0, this.width, SCREEN_HEIGHT - (this.y + this.height));
            ctx.restore();

            // Aplica uma camada escura semi-transparente para escurecer a textura
            ctx.fillStyle = 'rgba(0, 0, 0, 0.6)'; // Ajuste a opacidade (0.0 a 1.0) para a escuridão desejada
            ctx.fillRect(screenX, this.y + this.height, this.width, SCREEN_HEIGHT - (this.y + this.height));
        } else {
            // Fallback para a terra se a textura não carregar
            ctx.fillStyle = '#01010d';
            ctx.fillRect(screenX, this.y + this.height, this.width, SCREEN_HEIGHT - (this.y + this.height));
        }
        // Desenha uma linha escura para separar a plataforma da terra
        ctx.strokeStyle = '#3E2723'; ctx.lineWidth = 3; ctx.beginPath();
        ctx.moveTo(screenX, this.y + this.height - 1.5);
        ctx.lineTo(screenX + this.width, this.y + this.height - 1.5); ctx.stroke();
    }
}

export class Enemy {
    constructor(x, y) {
        this.position = new Vector2D(x, y - 40); this.width = 35; this.height = 40;
        this.health = 1; this.maxHealth = 1; this.hitCooldown = 0;
    }
    drawHealthBar(ctx, cameraX) {
        const barWidth = 5; const totalBarWidth = this.maxHealth * (barWidth + 2);
        const barX = this.position.x - cameraX + (this.width / 2) - (totalBarWidth / 2);
        const barY = this.position.y - 15;
        for (let i = 0; i < this.maxHealth; i++) {
            ctx.fillStyle = i < this.health ? '#e53e3e' : '#555';
            ctx.fillRect(barX + i * (barWidth + 2), barY, barWidth, barWidth);
        }
    }
    update(_projectiles, _player) { if (this.hitCooldown > 0) this.hitCooldown--; }
    draw(ctx, cameraX, _assets) { this.drawHealthBar(ctx, cameraX); }
}

export class SkeletonMelee extends Enemy {
    constructor(x, y, pX, pW, dL = 1) {
        super(x, y);
        this.health = 2 + Math.floor(dL / 3);
        this.maxHealth = this.health;
        this.patrolStart = pX + 10;
        this.patrolEnd = pX + pW - this.width - 10;
        this.speed = 0.5 + (dL - 1) * 0.07;
        this.direction = -1; // -1 for left, 1 for right
        this.damage = 1 * dL;

        // --- Animation Properties ---
        this.currentAnimation = 'walk'; // 'walk', 'attack', 'hurt', 'death'
        this.currentFrame = 0;
        this.frameCounter = 0;
        this.animationSpeed = 10; // Frames to show each sprite frame (lower is faster)

        // --- Attack Properties ---
        this.attackRange = 60; // Distância para iniciar o ataque
        this.attackBox = { x: 0, y: 0, width: 50, height: this.height };
        this.isAttacking = false;
        this.attackCooldown = 0;
        this.attackFrame = 0;
        // Duração do cooldown de ataque em ticks. A animação de ataque tem 25 ticks (5 frames * 5 ticks/frame).
        // Um valor maior adiciona uma pausa antes do próximo ataque.
        this.attackDuration = 60;
    }

    attack() {
        if (this.attackCooldown <= 0) {
            this.isAttacking = true;
            this.attackCooldown = this.attackDuration;
            this.currentFrame = 0; // Start attack animation from first frame
            this.currentAnimation = 'attack';
        }
    }

    takeDamage(amount) {
        super.takeDamage(amount); // Call parent method for health reduction
        if (this.health <= 0) {
            this.currentAnimation = 'death';
            this.currentFrame = 0;
        } else {
            this.currentAnimation = 'hurt';
            this.currentFrame = 0;
        }
    }

    update(projectiles, player) {
        super.update(projectiles, player); // Handles hitCooldown

        if (this.attackCooldown > 0) this.attackCooldown--;

        // Handle animation state transitions
        if (this.health <= 0) {
            // Already in death animation, no further state changes
        } else if (this.hitCooldown > 0) {
            if (this.currentAnimation !== 'hurt') {
                this.currentAnimation = 'hurt';
                this.currentFrame = 0;
            }
        } else if (this.isAttacking) {
            // Attack animation is managed by attackCooldown
            if (this.attackCooldown <= 0) {
                this.isAttacking = false;
                this.currentAnimation = 'walk'; // Return to walk after attack
            }
        } else {
            // Default to walk animation if not attacking, hurt, or dead
            if (this.currentAnimation !== 'walk') {
                this.currentAnimation = 'walk';
                this.currentFrame = 0;
            }
            // Movement logic
            const dx = (player.position.x + player.width / 2) - (this.position.x + this.width / 2);
            const dy = Math.abs((player.position.y + player.height / 2) - (this.position.y + this.height / 2));
            const distance = Math.abs(dx);

            if (distance < this.attackRange && dy < this.height) {
                this.direction = Math.sign(dx);
                this.attack();
            } else {
                this.position.x += this.speed * this.direction;
                if (this.position.x <= this.patrolStart && this.direction < 0) this.direction = 1;
                else if (this.position.x + this.width >= this.patrolEnd && this.direction > 0) this.direction = -1;
            }
        }

        // Update attack box position
        this.attackBox.x = this.direction > 0 ? this.position.x + this.width : this.position.x - this.attackBox.width;
        this.attackBox.y = this.position.y;
    }

    draw(ctx, cX, assets) {
        const screenX = this.position.x - cX;
        const screenY = this.position.y;

        let currentSpriteSheet;
        let totalFrames;
        let frameWidth;
        let frameHeight;
        let loop = true;

        if (this.currentAnimation === 'death') {
            currentSpriteSheet = assets.skeletonMeleeDeath;
            frameWidth = 21;
            frameHeight = 15;
            totalFrames = 7;
            loop = false; 
        } else if (this.currentAnimation === 'hurt') {
            currentSpriteSheet = assets.skeletonMeleeHurt;
            frameWidth = 13.1;
            frameHeight = 14;
            totalFrames = 3;
            loop = false;
        } else if (this.currentAnimation === 'attack') {            
            currentSpriteSheet = assets.skeletonMeleeAttack;
            frameWidth = 22; 
            frameHeight = 17;
            totalFrames = 5;
            loop = false;
        } else { // 'walk'
            currentSpriteSheet = assets.skeletonMeleeWalk;
            frameWidth = 13.1;
            frameHeight = 14;
            totalFrames = 7;
        }

        this.frameCounter++;
        if (this.frameCounter >= this.animationSpeed) {
            this.currentFrame = (this.currentFrame + 1) % totalFrames;
            this.frameCounter = 0;
        }

        const sourceX = this.currentFrame * frameWidth;

        ctx.save();

        if (this.direction < 0) { // Facing left, flip horizontally
            ctx.translate(screenX + this.width, screenY);
            ctx.scale(-1, 1);
            ctx.drawImage(
                currentSpriteSheet,
                sourceX,
                0,
                frameWidth,
                frameHeight,
                0, // Draw at 0,0 after translation
                0,
                this.width, // Scale to enemy width
                this.height // Scale to enemy height
            );
        } else { // Facing right
            ctx.drawImage(
                currentSpriteSheet,
                sourceX,
                0,
                frameWidth,
                frameHeight,
                screenX,
                screenY,
                this.width,
                this.height
            );
        }

        ctx.restore();

        super.draw(ctx, cX, assets);
    }
}

export class SkeletonArcher extends Enemy {
    constructor(x, y, dL = 1) {
        super(x, y); const mH = 2 + Math.floor(dL / 3); this.health = Math.max(1, Math.round(mH / 2));
        this.maxHealth = this.health; this.shootCooldownTime = 180 - Math.min((dL - 1) * 10, 100);
        this.shootCooldown = Math.random() * 50 + this.shootCooldownTime;
    }
    update(projectiles, player) {
        super.update(projectiles, player);
        this.shootCooldown--;
        const playerDistance = Math.abs(player.position.x - this.position.x);
        const directionToPlayer = Math.sign(player.position.x - this.position.x);
        if (this.shootCooldown <= 0 && playerDistance < SCREEN_WIDTH / 1.5) {
            projectiles.push(new Arrow(this.position.x, this.position.y + 15, directionToPlayer));
            this.shootCooldown = this.shootCooldownTime;
        }
    }
    draw(ctx, cX, assets) {
        ctx.fillStyle = '#E0E0E0'; ctx.fillRect(this.position.x - cX, this.position.y, this.width, this.height);
        ctx.fillStyle = '#8D6E63'; ctx.fillRect(this.position.x - cX - 5, this.position.y, 5, this.height);
        super.draw(ctx, cX, assets);
    }
}

export class Arrow {
    constructor(x, y, d) { this.position = new Vector2D(x, y); this.velocity = new Vector2D(6 * d, 0); this.width = 15; this.height = 3; }
    update() { this.position.add(this.velocity); }
    draw(ctx, cX) { ctx.fillStyle = '#F5F5F5'; ctx.fillRect(this.position.x - cX, this.position.y, this.width, this.height); }
}