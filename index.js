import React, { useState, useEffect, useRef, useCallback } from 'react';

// =================================================================================
// ÍNDICE DO CÓDIGO DO JOGO
// =================================================================================
//
// 1.  CONFIGURAÇÕES GLOBAIS
//     - Constantes Globais do Jogo: Dimensões, física e jogabilidade.
//     - Configuração da Loja de Upgrades: Custos e atributos das melhorias.
//
// 2.  CLASSES DE ENTIDADES DO JOGO
//     - Vector2D: Classe utilitária para vetores 2D.
//     - Player: Classe principal do jogador, com toda a lógica de estado e ações.
//     - Platform: Classe para as plataformas do cenário.
//     - Enemy: Classe base para todos os inimigos.
//     - SkeletonMelee: Subclasse para o esqueleto com espada.
//     - SkeletonArcher: Subclasse para o esqueleto arqueiro.
//     - Arrow: Classe para os projéteis dos arqueiros.
//
// 3.  LÓGICA DO JOGO
//     - Geração Procedural: Função para criar novas partes do nível.
//
// 4.  COMPONENTES REACT (INTERFACE DO USUÁRIO)
//     - MainMenu: Componente da tela de menu principal.
//     - AboutScreen: Componente da tela "Sobre".
//     - ShopScreen: Componente da tela da "Forja das Almas" (loja).
//     - Game: Componente principal onde a jogabilidade acontece.
//     - GameOverScreen: Componente da tela de fim de jogo.
//     - App: Componente raiz que gerencia o estado geral e as telas do jogo.
//
// =================================================================================


// --- 1. CONFIGURAÇÕES GLOBAIS ---

// --- Constantes Globais do Jogo ---
const SCREEN_WIDTH = 800;
const SCREEN_HEIGHT = 600;
const PLAYER_WIDTH = 32;
const PLAYER_HEIGHT = 48;
const PLAYER_SPEED = 5;
const JUMP_FORCE = 15;
const GRAVITY = 0.7;

// Constantes para a geração procedural das plataformas
const PLATFORM_HEIGHT = 20;
const MIN_PLATFORM_WIDTH = 150;
const MAX_PLATFORM_WIDTH = 280;
const PLATFORM_START_Y = SCREEN_HEIGHT - 50;
const MIN_PLATFORM_GAP = 40;
const MAX_PLATFORM_GAP = 80;
const MIN_PLATFORM_Y_VAR = -40;
const MAX_PLATFORM_Y_VAR = 40;

const ENEMY_SPAWN_CHANCE = 0.7; // Chance base de um inimigo aparecer numa plataforma

// --- Configuração da Loja de Upgrades ---
const UPGRADES_CONFIG = {
    health: { base: 3, cost: 2500, costIncrease: 2.2, description: "Vida Máxima" },
    damage: { base: 1, cost: 5000, costIncrease: 2.5, description: "Dano da Espada" },
    attackSpeed: { base: 30, cost: 4000, costIncrease: 2.6, decrease: 2, min: 10, description: "Velocidade de Ataque" },
    blockCharges: { base: 1, cost: 2000, costIncrease: 2.8, description: "Resistência do Escudo" },
    blockCooldown: { base: 180, cost: 2000, costIncrease: 2.3, decrease: 15, min: 60, description: "Recarga do Escudo" }
};


// --- 2. CLASSES DE ENTIDADES DO JOGO ---

/**
 * Representa um vetor 2D para posições e velocidades.
 */
class Vector2D {
    constructor(x, y) { this.x = x; this.y = y; }
    add(other) { this.x += other.x; this.y += other.y; }
}

/**
 * Representa o jogador, controlando seu estado, ações e renderização.
 */
class Player {
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
        this.attackBox = { x: 0, y: 0, width: 50, height: 50 }; 
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
            this.invincibilityFrames = 90; 
        }
    }

    heal(amount) {
        this.health = Math.min(this.maxHealth, this.health + amount);
    }

    update() {
        if (!this.isBlocking) { this.position.add(this.velocity);
        } else { this.position.y += this.velocity.y; }

        if (this.attackCooldown > 0) this.attackCooldown--;
        if (this.invincibilityFrames > 0) this.invincibilityFrames--;
        
        if (this.blockCooldown > 0) {
            this.blockCooldown--;
            if (this.blockCooldown <= 0) {
                this.canBlock = true;
                this.blockReadyPulse = 30; 
                this.blockCharges = this.blockChargesMax;
            }
        }
        
        if (this.blockReadyPulse > 0) this.blockReadyPulse--;
        
        if (!this.isBlocking && this.velocity.x !== 0) { this.direction = Math.sign(this.velocity.x); }

        this.attackBox.x = this.direction > 0 ? this.position.x + this.width : this.position.x - this.attackBox.width;
        this.attackBox.y = this.position.y;
        
        if (this.attackCooldown < 20) { this.isAttacking = false; }
    }
    
    handleCollision(platform) {
        const p = { left: this.position.x, right: this.position.x + this.width, top: this.position.y, bottom: this.position.y + this.height,
            prevTop: this.position.y - this.velocity.y, prevBottom: this.position.y + this.height - this.velocity.y,
            prevLeft: this.position.x - this.velocity.x, prevRight: this.position.x + this.width - this.velocity.x
        };
        const plat = { left: platform.x, right: platform.x + platform.width, top: platform.y, bottom: platform.y + platform.height };

        if (p.right > plat.left && p.left < plat.right) {
            if (this.velocity.y >= 0 && p.bottom >= plat.top && p.prevBottom <= plat.top) {
                this.position.y = plat.top - this.height; this.velocity.y = 0; this.isJumping = false; this.onGround = true; return;
            }
            if (this.velocity.y < 0 && p.top <= plat.bottom && p.prevTop >= plat.bottom) {
                this.position.y = plat.bottom; this.velocity.y = 0; return;
            }
        }
        if (p.bottom > plat.top) {
            if (this.velocity.x > 0 && p.right > plat.left && p.prevRight <= plat.left) { this.position.x = plat.left - this.width; this.velocity.x = 0; return; }
            if (this.velocity.x < 0 && p.left < plat.right && p.prevLeft >= plat.right) { this.position.x = plat.right; this.velocity.x = 0; return; }
        }
    }
    
    drawBlockCooldown(ctx, cameraX) {
        const indicatorX = this.position.x + this.width / 2 - cameraX;
        const indicatorY = this.position.y - 20;
        const radius = 8;
        
        if (this.blockCooldown <= 0 && this.blockReadyPulse <= 0 && this.canBlock) {
             for(let i = 0; i < this.blockCharges; i++) {
                ctx.beginPath();
                ctx.arc(indicatorX - (this.blockChargesMax * 6) / 2 + 6 + (i * 12), indicatorY, 4, 0, 2*Math.PI);
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

    draw(ctx, cameraX, assets) {
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

class Platform {
    constructor(x, y, width) { this.x = x; this.y = y; this.width = width; this.height = PLATFORM_HEIGHT; }
    draw(ctx, cameraX, assets) {
        ctx.fillStyle = '#616161'; ctx.fillRect(this.x - cameraX, this.y, this.width, this.height);
        ctx.strokeStyle = '#3E2723'; ctx.lineWidth = 3; ctx.beginPath();
        ctx.moveTo(this.x - cameraX, this.y + this.height - 1.5);
        ctx.lineTo(this.x - cameraX + this.width, this.y + this.height - 1.5); ctx.stroke();
        ctx.fillStyle = '#424242';
        ctx.fillRect(this.x - cameraX, this.y + this.height, this.width, SCREEN_HEIGHT - (this.y + this.height));
    }
}

class Enemy {
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
    update(projectiles, player) { if(this.hitCooldown > 0) this.hitCooldown--; }
    draw(ctx, cameraX, assets) { this.drawHealthBar(ctx, cameraX); }
}

class SkeletonMelee extends Enemy {
    constructor(x, y, pX, pW, dL = 1) { super(x, y); this.health = 2 + Math.floor(dL / 3); this.maxHealth = this.health;
        this.patrolStart = pX + 10; this.patrolEnd = pX + pW - this.width - 10; this.speed = 0.5 + (dL - 1) * 0.07; this.direction = -1;
    }
    update(projectiles, player) { super.update(projectiles, player); this.position.x += this.speed * this.direction;
        if (this.position.x <= this.patrolStart && this.direction < 0) this.direction = 1;
        else if (this.position.x + this.width >= this.patrolEnd && this.direction > 0) this.direction = -1;
    }
    draw(ctx, cX, assets) {
        ctx.fillStyle = '#E0E0E0'; ctx.fillRect(this.position.x - cX, this.position.y, this.width, this.height);
        ctx.fillStyle = '#BDBDBD'; ctx.fillRect(this.position.x - cX + (this.direction > 0 ? this.width : -15), this.position.y + 10, 15, 5);
        ctx.fillStyle = '#795548'; ctx.fillRect(this.position.x - cX + (this.direction < 0 ? this.width : -5), this.position.y + 5, 5, 30);
        super.draw(ctx, cX, assets);
    }
}

class SkeletonArcher extends Enemy {
    constructor(x, y, dL = 1) { super(x, y); const mH = 2 + Math.floor(dL / 3); this.health = Math.max(1, Math.round(mH / 2));
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

class Arrow {
    constructor(x, y, d) { this.position = new Vector2D(x, y); this.velocity = new Vector2D(6 * d, 0); this.width = 15; this.height = 3; }
    update() { this.position.add(this.velocity); }
    draw(ctx, cX) { ctx.fillStyle = '#F5F5F5'; ctx.fillRect(this.position.x - cX, this.position.y, this.width, this.height); }
}

// --- 3. LÓGICA DO JOGO ---

/** Gera um novo pedaço do nível com plataformas e, possivelmente, inimigos. */
const generateLevelChunk = (lastX, lastY, difficultyLevel) => {
    const newPlatforms = []; const newEnemies = [];
    const gap = MIN_PLATFORM_GAP + Math.random() * (MAX_PLATFORM_GAP - MIN_PLATFORM_GAP); const newX = lastX + gap;
    const yV = MIN_PLATFORM_Y_VAR + Math.random() * (MAX_PLATFORM_Y_VAR - MIN_PLATFORM_Y_VAR);
    let newY = lastY + yV; if (newY > SCREEN_HEIGHT - 40) newY = SCREEN_HEIGHT - 40; if (newY < 250) newY = 250;
    const newWidth = MIN_PLATFORM_WIDTH + Math.random() * (MAX_PLATFORM_WIDTH - MIN_PLATFORM_WIDTH);
    const newPlatform = new Platform(newX, newY, newWidth); newPlatforms.push(newPlatform);
    const spawnChance = Math.min(ENEMY_SPAWN_CHANCE + (difficultyLevel - 1) * 0.05, 0.95);
    if (Math.random() < spawnChance && newWidth > 180) {
        const eX = newPlatform.x + newPlatform.width / 2; const eY = newPlatform.y;
        if (Math.random() < 0.5) newEnemies.push(new SkeletonMelee(eX, eY, newPlatform.x, newWidth, difficultyLevel));
        else newEnemies.push(new SkeletonArcher(eX, eY, difficultyLevel));
    }
    return { newPlatforms, newEnemies };
};

// --- 4. COMPONENTES REACT (INTERFACE DO USUÁRIO) ---

/** Componente da tela de menu principal. */
const MainMenu = ({ onStart, onAbout, onShop }) => (
    <div className="w-full h-full bg-gray-900 flex flex-col justify-center items-center text-white p-8 border-4 border-gray-700 relative">
        <div className="flex flex-col items-center">
            <h1 className="text-6xl font-cinzel font-bold mb-10 text-red-700 drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)]">mar..... io?</h1>
            <button onClick={onStart} className="font-cinzel bg-gray-700 hover:bg-red-800 border-2 border-gray-500 hover:border-red-600 text-gray-200 font-bold py-3 px-8 rounded-sm text-2xl shadow-lg transition-all duration-300">
                Iniciar Jornada
            </button>
            <button onClick={onShop} className="mt-5 font-cinzel bg-gray-800 hover:bg-gray-700 border border-gray-600 hover:border-gray-500 text-gray-400 font-bold py-2 px-6 rounded-sm text-xl shadow-md transition-all duration-300">
                Forja das Almas
            </button>
        </div>
        <button onClick={onAbout} className="absolute bottom-4 left-4 font-cinzel bg-gray-800 hover:bg-gray-700 border border-gray-600 hover:border-gray-500 text-gray-400 font-bold py-1 px-3 rounded-sm text-sm shadow-md transition-all duration-300">
            Sobre
        </button>
    </div>
);

/** Componente da tela "Sobre". */
const AboutScreen = ({ onBack }) => (
    <div className="w-full h-full bg-gray-900 flex flex-col justify-center items-center text-white p-8 border-4 border-gray-700">
        <h1 className="text-4xl font-cinzel font-bold mb-6 text-gray-300">Sobre a Obra</h1>
        <div className="text-lg bg-black bg-opacity-30 p-6 border border-gray-700 rounded-sm w-full max-w-lg">
            <p className="mb-4 text-center text-gray-400">Este jogo foi forjado nas chamas da disciplina.</p>
            <p className="font-bold text-center text-xl mb-4 text-gray-300">Os Ferreiros:</p>
            <ul className="list-none text-center space-y-3 font-cinzel text-gray-400">
                <li className="fading-name" style={{ animationDelay: '0s' }}>Mateus Natan Maoski</li>
                <li className="fading-name" style={{ animationDelay: '0.2s' }}>Afonso Henrique de Christo Muller</li>
                <li className="fading-name" style={{ animationDelay: '0.4s' }}>João Pedro Cardoso de Liz</li>
            </ul>
        </div>
        <button onClick={onBack} className="mt-8 font-cinzel bg-gray-700 hover:bg-gray-600 border border-gray-600 text-gray-300 font-bold py-2 px-6 rounded-sm shadow-lg">Retornar</button>
    </div>
);

/** Componente da loja de upgrades. */
const ShopScreen = ({ onBack, onRestartGame, hasPlayedOnce, totalSouls, upgrades, purchaseUpgrade }) => {
    const getUpgradeCost = (key) => Math.floor(UPGRADES_CONFIG[key].cost * Math.pow(UPGRADES_CONFIG[key].costIncrease, upgrades[key]));

    return (
        <div className="w-full h-full bg-gray-900 flex flex-col items-center text-white p-6 border-4 border-gray-700 font-cinzel">
            <h1 className="text-4xl font-bold mb-4 text-gray-300">Forja das Almas</h1>
            <p className="text-xl text-yellow-400 mb-6">Almas: {totalSouls}</p>

            <div className="w-full max-w-lg flex-grow overflow-y-auto pr-4 space-y-4">
                {Object.keys(upgrades).map(key => {
                    const cost = getUpgradeCost(key);
                    const config = UPGRADES_CONFIG[key];
                    return (
                        <div key={key} className="bg-black bg-opacity-30 p-4 border border-gray-700 rounded-sm flex justify-between items-center">
                            <div>
                                <p className="text-lg text-gray-200">{config.description} (Nível {upgrades[key] + 1})</p>
                                <p className="text-sm text-yellow-500">Custo: {cost} almas</p>
                            </div>
                            <button onClick={() => purchaseUpgrade(key)} disabled={totalSouls < cost} className="ml-4 flex-shrink-0 bg-gray-700 hover:bg-red-800 disabled:bg-gray-800 disabled:text-gray-500 disabled:cursor-not-allowed border-2 border-gray-500 text-gray-200 font-bold py-2 px-4 rounded-sm transition-all">
                                Melhorar
                            </button>
                        </div>
                    )
                })}
            </div>
            
            <div className="flex space-x-4 mt-auto pt-6">
                 <button onClick={onBack} className="font-cinzel bg-gray-700 hover:bg-gray-600 border border-gray-600 text-gray-300 font-bold py-2 px-6 rounded-sm shadow-lg">
                    Retornar ao Menu
                </button>
                <button onClick={onRestartGame} className="font-cinzel bg-red-800 hover:bg-red-700 border-2 border-red-600 text-gray-200 font-bold py-2 px-6 rounded-sm text-2xl shadow-lg transition-all">
                    {hasPlayedOnce ? "Renascer" : "Iniciar Jornada"}
                </button>
            </div>
        </div>
    );
};


/** Componente principal onde a jogabilidade acontece. */
const Game = ({ playerStats, onGameOver }) => {
    const canvasRef = useRef(null);
    const playerRef = useRef(new Player(playerStats));
    const assetsRef = useRef(null);
    
    const { initialPlatforms, initialEnemies } = React.useMemo(() => {
        const platforms = [ new Platform(50, PLATFORM_START_Y, 300), new Platform(500, PLATFORM_START_Y - 20, 250), new Platform(850, PLATFORM_START_Y - 40, 200), ];
        const enemies = [ new SkeletonMelee(550, platforms[1].y, platforms[1].x, platforms[1].width, 1), new SkeletonArcher(950, platforms[2].y, 1), ];
        return { initialPlatforms: platforms, initialEnemies: enemies };
    }, []);

    const platformsRef = useRef(initialPlatforms);
    const enemiesRef = useRef(initialEnemies);
    const projectilesRef = useRef([]);
    const keysPressedRef = useRef({});
    const cameraXRef = useRef(0);
    const scoreRef = useRef(0);
    const lastWalkScoreX = useRef(0);
    const difficultyLevelRef = useRef(1);
    
    const gameLoop = useCallback((ctx) => {
        const player = playerRef.current;
        const keys = keysPressedRef.current;
        
        player.velocity.x = 0;
        if (!player.isBlocking) {
            if (keys['ArrowLeft'] || keys['a']) player.velocity.x = -PLAYER_SPEED;
            if (keys['ArrowRight'] || keys['d']) player.velocity.x = PLAYER_SPEED;
        }
        player.applyGravity(); player.update();
        platformsRef.current.forEach(p => player.handleCollision(p));
        enemiesRef.current.forEach(e => e.update(projectilesRef.current, player));
        projectilesRef.current.forEach(p => p.update());
        
        if (player.isAttacking) {
            enemiesRef.current.forEach((enemy) => {
                if (enemy.hitCooldown === 0 &&
                    player.attackBox.x < enemy.position.x + enemy.width && player.attackBox.x + player.attackBox.width > enemy.position.x &&
                    player.attackBox.y < enemy.position.y + enemy.height && player.attackBox.height + player.attackBox.y > enemy.position.y) {
                    enemy.health -= player.damage; 
                    enemy.hitCooldown = 30;
                }
            });
        }
        
        enemiesRef.current.forEach((enemy) => {
             if (player.position.x < enemy.position.x + enemy.width && player.position.x + player.width > enemy.position.x &&
                 player.position.y < enemy.position.y + enemy.height && player.position.y + player.height > enemy.position.y) {
                 player.takeDamage(1);
             }
        });
        projectilesRef.current.forEach((proj, index) => {
            if (player.position.x < proj.position.x + proj.width && player.position.x + player.width > proj.position.x &&
                player.position.y < proj.position.y + proj.height && player.position.y + player.height > proj.position.y) {
                player.takeDamage(1); projectilesRef.current.splice(index, 1);
            }
        });

        let enemiesKilledThisFrame = 0;
        enemiesRef.current = enemiesRef.current.filter(e => {
            if (e.health <= 0) { enemiesKilledThisFrame++; return false; }
            return true;
        });
        if (enemiesKilledThisFrame > 0) {
            player.heal(enemiesKilledThisFrame);
            scoreRef.current += enemiesKilledThisFrame * 100;
        }

        cameraXRef.current = player.position.x - SCREEN_WIDTH / 3;
        
        difficultyLevelRef.current = Math.floor(scoreRef.current / 750) + 1;

        const walkPointsThisFrame = Math.floor(player.position.x / 80) - Math.floor(lastWalkScoreX.current / 80);
        if(walkPointsThisFrame > 0) { scoreRef.current += walkPointsThisFrame; }
        lastWalkScoreX.current = player.position.x;
        
        const lastPlatform = platformsRef.current[platformsRef.current.length - 1];
        if (lastPlatform && player.position.x > lastPlatform.x - SCREEN_WIDTH) {
            const { newPlatforms, newEnemies } = generateLevelChunk(lastPlatform.x + lastPlatform.width, lastPlatform.y, difficultyLevelRef.current);
            platformsRef.current.push(...newPlatforms);
            enemiesRef.current.push(...newEnemies);
        }
        platformsRef.current = platformsRef.current.filter(p => p.x + p.width > cameraXRef.current);
        enemiesRef.current = enemiesRef.current.filter(e => e.position.x + e.width > cameraXRef.current);
        projectilesRef.current = projectilesRef.current.filter(p => p.position.x + p.width > cameraXRef.current && p.position.x < cameraXRef.current + SCREEN_WIDTH);

        if (player.position.y > SCREEN_HEIGHT + player.height) player.takeDamage(50);
        if (player.health <= 0) { onGameOver(scoreRef.current); return; }
        
        const bgGradient = ctx.createLinearGradient(0, 0, 0, SCREEN_HEIGHT);
        bgGradient.addColorStop(0, '#0a0a0a'); bgGradient.addColorStop(0.6, '#222034'); bgGradient.addColorStop(1, '#444264');
        ctx.fillStyle = bgGradient; ctx.fillRect(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT);
        
        platformsRef.current.forEach(p => p.draw(ctx, cameraXRef.current, assetsRef.current));
        enemiesRef.current.forEach(e => e.draw(ctx, cameraXRef.current, assetsRef.current));
        projectilesRef.current.forEach(p => p.draw(ctx, cameraXRef.current, assetsRef.current));
        player.draw(ctx, cameraXRef.current, assetsRef.current);
        
        ctx.font = 'bold 24px "Cinzel"'; ctx.textAlign = 'left'; ctx.shadowColor = 'black';
        ctx.shadowBlur = 4; ctx.fillStyle = '#D1D1D1';
        ctx.fillText(`Almas: ${scoreRef.current}`, 20, 40);
        for (let i = 0; i < player.maxHealth; i++) {
            ctx.fillStyle = i < player.health ? '#e53e3e' : '#718096';
            ctx.fillRect(SCREEN_WIDTH - 120 + (i * 25), 20, 20, 20);
        }
        ctx.shadowBlur = 0;

        requestAnimationFrame(() => gameLoop(ctx));
    }, [onGameOver, initialPlatforms, initialEnemies]);

    useEffect(() => {
        const canvas = canvasRef.current; const ctx = canvas.getContext('2d');
        let animationFrameId;
        const handleKeyDown = (e) => { keysPressedRef.current[e.key] = true; if (e.key === ' ' || e.key === 'ArrowUp' || e.key === 'w' ) { e.preventDefault(); playerRef.current.jump(); } };
        const handleKeyUp = (e) => { keysPressedRef.current[e.key] = false; };
        const handleMouseDown = (e) => { if (e.button === 0) { playerRef.current.attack(); } else if (e.button === 2) { if (playerRef.current.canBlock) { playerRef.current.isBlocking = true; } } };
        const handleMouseUp = (e) => { if (e.button === 2) { playerRef.current.isBlocking = false; } };
        const handleContextMenu = (e) => e.preventDefault();
        window.addEventListener('keydown', handleKeyDown); window.addEventListener('keyup', handleKeyUp);
        window.addEventListener('mousedown', handleMouseDown); window.addEventListener('mouseup', handleMouseUp);
        window.addEventListener('contextmenu', handleContextMenu);
        animationFrameId = requestAnimationFrame(() => gameLoop(ctx));
        return () => {
            window.removeEventListener('keydown', handleKeyDown); window.removeEventListener('keyup', handleKeyUp);
            window.removeEventListener('mousedown', handleMouseDown); window.removeEventListener('mouseup', handleMouseUp);
            window.removeEventListener('contextmenu', handleContextMenu); cancelAnimationFrame(animationFrameId);
        };
    }, [gameLoop]);

    return <canvas ref={canvasRef} width={SCREEN_WIDTH} height={SCREEN_HEIGHT} />;
};

/** Componente da tela de fim de jogo. */
const GameOverScreen = ({ score, onGoToMenu, onGoToShop, onRestartGame }) => (
    <div className="w-full h-full bg-black bg-opacity-80 flex flex-col justify-center items-center text-white p-8">
        <h1 className="text-7xl font-cinzel font-bold text-red-700 mb-4 drop-shadow-[0_0_8px_rgba(255,0,0,0.7)]">VOCÊ MORREU</h1>
        <div className="h-16 flex items-center justify-center">
             <p className="text-2xl text-center italic text-gray-300 font-cinzel">sua alma se esvai...</p>
        </div>
        <p className="text-xl mt-4 mb-8 font-cinzel text-gray-400">Você coletou {score} almas.</p>
        <div className="flex flex-col space-y-4">
             <button onClick={onRestartGame} className="font-cinzel bg-red-800 hover:bg-red-700 border-2 border-red-600 text-gray-200 font-bold py-3 px-8 rounded-sm text-2xl shadow-lg transition-all">
                Renascer
            </button>
            <button onClick={onGoToShop} className="font-cinzel bg-gray-700 hover:bg-gray-600 border-2 border-gray-500 text-gray-200 font-bold py-2 px-6 rounded-sm text-xl shadow-lg transition-all">
                Forja das Almas
            </button>
            <button onClick={onGoToMenu} className="font-cinzel bg-gray-800 hover:bg-gray-700 border-2 border-gray-600 text-gray-300 font-bold py-2 px-6 rounded-sm text-lg shadow-lg transition-all">
                Retornar ao Menu
            </button>
        </div>
    </div>
);

/** Componente raiz que gerencia o estado geral e as telas do jogo. */
export default function App() {
    const [gameState, setGameState] = useState('menu');
    const [totalSouls, setTotalSouls] = useState(0);
    const [upgrades, setUpgrades] = useState({ health: 0, damage: 0, attackSpeed: 0, blockCharges: 0, blockCooldown: 0 });
    const [playerStats, setPlayerStats] = useState({});
    const [hasPlayedOnce, setHasPlayedOnce] = useState(false);
    
    // --- Comentários para implementação de música ---
    // const menuAudioRef = useRef(null);
    // const gameAudioRef = useRef(null);

    useEffect(() => {
        const newStats = {
            health: UPGRADES_CONFIG.health.base + upgrades.health,
            damage: UPGRADES_CONFIG.damage.base + upgrades.damage,
            attackSpeed: Math.max(UPGRADES_CONFIG.attackSpeed.min, UPGRADES_CONFIG.attackSpeed.base - (upgrades.attackSpeed * UPGRADES_CONFIG.attackSpeed.decrease)),
            blockCharges: UPGRADES_CONFIG.blockCharges.base + upgrades.blockCharges,
            blockCooldown: Math.max(UPGRADES_CONFIG.blockCooldown.min, UPGRADES_CONFIG.blockCooldown.base - (upgrades.blockCooldown * UPGRADES_CONFIG.blockCooldown.decrease)),
        };
        setPlayerStats(newStats);
    }, [upgrades]);
    
    /*
    // --- Comentário para controle de música ---
    useEffect(() => {
        const menuAudio = menuAudioRef.current;
        const gameAudio = gameAudioRef.current;

        if (menuAudio) menuAudio.pause();
        if (gameAudio) gameAudio.pause();

        switch (gameState) {
            case 'playing':
                gameAudio?.play().catch(e => console.error("Erro ao tocar música do jogo:", e));
                break;
            case 'shop':
            case 'menu':
            case 'about':
            case 'gameOver':
                menuAudio?.play().catch(e => console.error("Erro ao tocar música do menu:", e));
                break;
            default:
                break;
        }
    }, [gameState]);
    */

    const handlePurchaseUpgrade = (key) => {
        const cost = Math.floor(UPGRADES_CONFIG[key].cost * Math.pow(UPGRADES_CONFIG[key].costIncrease, upgrades[key]));
        if (totalSouls >= cost) {
            setTotalSouls(prev => prev - cost);
            setUpgrades(prev => ({...prev, [key]: prev[key] + 1}));
        }
    };
    
    const handleStartGame = () => {
        setHasPlayedOnce(true);
        setGameState('playing');
    };

    const handleGameOver = (earnedSouls) => {
        setTotalSouls(prev => prev + earnedSouls);
        setGameState('gameOver');
    }
    
    const renderGameState = () => {
        switch (gameState) {
            case 'playing': return <Game playerStats={playerStats} onGameOver={handleGameOver} />;
            case 'shop': return <ShopScreen onBack={() => setGameState('menu')} onRestartGame={handleStartGame} hasPlayedOnce={hasPlayedOnce} totalSouls={totalSouls} upgrades={upgrades} purchaseUpgrade={handlePurchaseUpgrade} />;
            case 'about': return <AboutScreen onBack={() => setGameState('menu')} />;
            case 'gameOver': return <GameOverScreen score={totalSouls} onGoToMenu={() => setGameState('menu')} onGoToShop={() => setGameState('shop')} onRestartGame={handleStartGame} />
            default: return <MainMenu onStart={handleStartGame} onAbout={() => setGameState('about')} onShop={() => setGameState('shop')} />;
        }
    };

    return (
        <div className="bg-black flex justify-center items-center min-h-screen">
            {/* // --- elementos de áudio ---
            <audio ref={menuAudioRef} src="URL_DA_MUSICA_DO_MENU.mp3" loop />
            <audio ref={gameAudioRef} src="URL_DA_MUSICA_DO_JOGO.mp3" loop />
            */}
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@400;700&display=swap');
                .font-cinzel { font-family: 'Cinzel', serif; }
                @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
                .fading-name { display: inline-block; animation: fadeIn 3s ease-in-out infinite alternate; padding: 2px; opacity: 0; }
            `}</style>
            <div style={{ width: SCREEN_WIDTH, height: SCREEN_HEIGHT }} className="relative bg-gray-900 shadow-2xl shadow-red-900/40">
               {renderGameState()}
            </div>
        </div>
    );
}
