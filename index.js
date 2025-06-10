import React, { useState, useEffect, useRef, useCallback } from 'react';

// --- Constantes do Jogo ---
const SCREEN_WIDTH = 800;
const SCREEN_HEIGHT = 600;
const PLAYER_WIDTH = 32;
const PLAYER_HEIGHT = 48;
const PLAYER_SPEED = 5;
const JUMP_FORCE = 15;
const GRAVITY = 0.7;
const PLAYER_STARTING_HEALTH = 3;
const BLOCK_COOLDOWN_DURATION = 180;
const BLOCK_PULSE_DURATION = 30;

const PLATFORM_HEIGHT = 20;
const MIN_PLATFORM_WIDTH = 150;
const MAX_PLATFORM_WIDTH = 280;
const PLATFORM_START_Y = SCREEN_HEIGHT - 50;
const MIN_PLATFORM_GAP = 40;
const MAX_PLATFORM_GAP = 80;
const MIN_PLATFORM_Y_VAR = -40;
const MAX_PLATFORM_Y_VAR = 40;

const ENEMY_SPAWN_CHANCE = 0.7;

// --- Organização em Classes ---

class Vector2D {
    constructor(x, y) { this.x = x; this.y = y; }
    add(other) { this.x += other.x; this.y += other.y; }
}

// --- CLASSE DO JOGADOR ---
class Player {
    constructor() {
        this.position = new Vector2D(100, SCREEN_HEIGHT - 200);
        this.velocity = new Vector2D(0, 0);
        this.width = PLAYER_WIDTH;
        this.height = PLAYER_HEIGHT;
        this.isJumping = false;
        this.onGround = false;
        this.health = PLAYER_STARTING_HEALTH;
        this.maxHealth = PLAYER_STARTING_HEALTH;
        this.isAttacking = false;
        this.isBlocking = false;
        this.canBlock = true;
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
            this.velocity.y = -JUMP_FORCE;
            this.isJumping = true;
        }
    }
    
    attack() {
        if (this.attackCooldown <= 0 && !this.isBlocking) {
            this.isAttacking = true;
            this.attackCooldown = 30;
        }
    }

    takeDamage(amount) {
        if (this.invincibilityFrames > 0) return;

        if (this.isBlocking) {
            this.blockCooldown = BLOCK_COOLDOWN_DURATION;
            this.canBlock = false;
            this.isBlocking = false;
        } else {
            this.health -= amount;
            this.invincibilityFrames = 90;
        }
    }

    heal(amount) {
        this.health = Math.min(this.maxHealth, this.health + amount);
    }

    update() {
        if (!this.isBlocking) {
            this.position.add(this.velocity);
        } else {
            this.position.y += this.velocity.y;
        }

        if (this.attackCooldown > 0) this.attackCooldown--;
        if (this.invincibilityFrames > 0) this.invincibilityFrames--;
        
        if (this.blockCooldown > 0) {
            this.blockCooldown--;
            if (this.blockCooldown <= 0) {
                this.canBlock = true;
                this.blockReadyPulse = BLOCK_PULSE_DURATION;
            }
        }
        
        if (this.blockReadyPulse > 0) {
            this.blockReadyPulse--;
        }
        
        if (!this.isBlocking && this.velocity.x !== 0) {
            this.direction = Math.sign(this.velocity.x);
        }

        if (this.direction > 0) {
            this.attackBox.x = this.position.x + this.width;
        } else {
            this.attackBox.x = this.position.x - this.attackBox.width;
        }
        this.attackBox.y = this.position.y;
        
        if (this.attackCooldown < 20) {
            this.isAttacking = false;
        }
    }
    
    handleCollision(platform) {
        const p = {
            left: this.position.x,
            right: this.position.x + this.width,
            top: this.position.y,
            bottom: this.position.y + this.height,
            prevTop: this.position.y - this.velocity.y,
            prevBottom: this.position.y + this.height - this.velocity.y,
            prevLeft: this.position.x - this.velocity.x,
            prevRight: this.position.x + this.width - this.velocity.x
        };
        const plat = {
            left: platform.x,
            right: platform.x + platform.width,
            top: platform.y,
            bottom: platform.y + platform.height
        };

        if (p.right > plat.left && p.left < plat.right) {
            if (this.velocity.y >= 0 && p.bottom >= plat.top && p.prevBottom <= plat.top) {
                this.position.y = plat.top - this.height;
                this.velocity.y = 0;
                this.isJumping = false;
                this.onGround = true;
                return;
            }
            if (this.velocity.y < 0 && p.top <= plat.bottom && p.prevTop >= plat.bottom) {
                this.position.y = plat.bottom;
                this.velocity.y = 0;
                return;
            }
        }

        const verticalOverlapWithPillar = p.bottom > plat.top;
        if (verticalOverlapWithPillar) {
            if (this.velocity.x > 0 && p.right > plat.left && p.prevRight <= plat.left) {
                this.position.x = plat.left - this.width;
                this.velocity.x = 0;
                return;
            }
            if (this.velocity.x < 0 && p.left < plat.right && p.prevLeft >= plat.right) {
                this.position.x = plat.right;
                this.velocity.x = 0;
                return;
            }
        }
    }
    
    drawBlockCooldown(ctx, cameraX) {
        if (this.blockCooldown <= 0 && this.blockReadyPulse <= 0) {
            return;
        }

        const indicatorX = this.position.x + this.width / 2 - cameraX;
        const indicatorY = this.position.y - 20;
        let radius = 8;
        
        ctx.beginPath();
        ctx.arc(indicatorX, indicatorY, radius, 0, 2 * Math.PI, false);
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fill();
        
        if (this.blockCooldown > 0) {
            const fillRatio = (BLOCK_COOLDOWN_DURATION - this.blockCooldown) / BLOCK_COOLDOWN_DURATION;
            ctx.beginPath();
            ctx.moveTo(indicatorX, indicatorY);
            ctx.arc(indicatorX, indicatorY, radius, -Math.PI / 2, -Math.PI / 2 + (fillRatio * 2 * Math.PI), false);
            ctx.lineTo(indicatorX, indicatorY);
            ctx.fillStyle = 'white';
            ctx.fill();
        } else if (this.blockReadyPulse > 0) {
            const pulseRatio = this.blockReadyPulse / BLOCK_PULSE_DURATION;
            const pulseRadius = radius * (1 + Math.sin(pulseRatio * Math.PI) * 0.4);
            ctx.beginPath();
            ctx.arc(indicatorX, indicatorY, pulseRadius, 0, 2 * Math.PI, false);
            ctx.fillStyle = `rgba(255, 255, 255, ${pulseRatio})`;
            ctx.fill();
        }
    }

    draw(ctx, cameraX) {
        ctx.save();
        if (this.invincibilityFrames > 0) {
            if (Math.floor(this.invincibilityFrames / 6) % 2 === 0) {
                ctx.fillStyle = '#ff4d4d';
            } else {
                ctx.fillStyle = '#4A4A4A';
            }
        } else {
            ctx.fillStyle = '#4A4A4A';
        }
        ctx.fillRect(this.position.x - cameraX, this.position.y, this.width, this.height);
        ctx.strokeStyle = '#2c2c2c';
        ctx.lineWidth = 2;
        ctx.strokeRect(this.position.x - cameraX, this.position.y, this.width, this.height);
        ctx.restore();

        if (this.isBlocking) {
            ctx.fillStyle = '#37474F';
            const shieldX = this.direction > 0 ? this.position.x + this.width : this.position.x - 10;
            ctx.fillRect(shieldX - cameraX, this.position.y, 10, this.height);
            ctx.strokeStyle = '#263238';
            ctx.strokeRect(shieldX - cameraX, this.position.y, 10, this.height);
        } else if (this.isAttacking) {
            ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
            ctx.fillRect(this.attackBox.x - cameraX, this.attackBox.y, this.attackBox.width, this.attackBox.height);
        }
        
        this.drawBlockCooldown(ctx, cameraX);
    }
}

// --- CLASSES DE INIMIGOS E PLATAFORMAS ---

class Platform {
    constructor(x, y, width) {
        this.x = x; this.y = y; this.width = width; this.height = PLATFORM_HEIGHT;
    }
    draw(ctx, cameraX) {
        ctx.fillStyle = '#616161';
        ctx.fillRect(this.x - cameraX, this.y, this.width, this.height);
        ctx.strokeStyle = '#3E2723';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(this.x - cameraX, this.y + this.height - 1.5);
        ctx.lineTo(this.x - cameraX + this.width, this.y + this.height - 1.5);
        ctx.stroke();
        ctx.fillStyle = '#424242';
        ctx.fillRect(this.x - cameraX, this.y + this.height, this.width, SCREEN_HEIGHT - (this.y + this.height));
    }
}

class Enemy {
    constructor(x, y) {
        this.position = new Vector2D(x, y - 40);
        this.width = 35;
        this.height = 40;
        this.health = 1;
        this.maxHealth = 1;
        this.hitCooldown = 0;
    }
    
    drawHealthBar(ctx, cameraX) {
        const barWidth = 5;
        const totalBarWidth = this.maxHealth * (barWidth + 2);
        const barX = this.position.x - cameraX + (this.width / 2) - (totalBarWidth / 2);
        const barY = this.position.y - 15;

        for (let i = 0; i < this.maxHealth; i++) {
            ctx.fillStyle = i < this.health ? '#e53e3e' : '#555';
            ctx.fillRect(barX + i * (barWidth + 2), barY, barWidth, barWidth);
        }
    }
    
    update(projectiles, player) {
        if(this.hitCooldown > 0) this.hitCooldown--;
    }
    
    draw(ctx, cameraX) {
        this.drawHealthBar(ctx, cameraX);
    }
}

class SkeletonMelee extends Enemy {
    constructor(x, y, platformX, platformWidth) {
        super(x, y);
        this.health = 2;
        this.maxHealth = 2;
        this.patrolStart = platformX + 10;
        this.patrolEnd = platformX + platformWidth - this.width - 10;
        this.speed = 0.5;
        this.direction = -1;
    }
    update(projectiles, player) {
        super.update(projectiles, player);
        this.position.x += this.speed * this.direction;
        if (this.position.x <= this.patrolStart && this.direction < 0) {
            this.direction = 1;
        } else if (this.position.x + this.width >= this.patrolEnd && this.direction > 0) {
            this.direction = -1;
        }
    }
    draw(ctx, cameraX) {
        ctx.fillStyle = '#E0E0E0';
        ctx.fillRect(this.position.x - cameraX, this.position.y, this.width, this.height);
        ctx.fillStyle = '#BDBDBD'; // Sword
        ctx.fillRect(this.position.x - cameraX + (this.direction > 0 ? this.width : -15), this.position.y + 10, 15, 5);
        ctx.fillStyle = '#795548'; // Shield
        ctx.fillRect(this.position.x - cameraX + (this.direction < 0 ? this.width : -5), this.position.y + 5, 5, 30);
        super.draw(ctx, cameraX);
    }
}

class SkeletonArcher extends Enemy {
    constructor(x, y) {
        super(x, y);
        this.health = 1;
        this.maxHealth = 1;
        this.shootCooldown = Math.random() * 100 + 120;
    }
    update(projectiles, player) {
        super.update(projectiles, player);
        this.shootCooldown--;
        const playerDistance = Math.abs(player.position.x - this.position.x);
        const directionToPlayer = Math.sign(player.position.x - this.position.x);
        if (this.shootCooldown <= 0 && playerDistance < SCREEN_WIDTH / 1.5) {
            projectiles.push(new Arrow(this.position.x, this.position.y + 15, directionToPlayer));
            this.shootCooldown = 180;
        }
    }
    draw(ctx, cameraX) {
        ctx.fillStyle = '#E0E0E0';
        ctx.fillRect(this.position.x - cameraX, this.position.y, this.width, this.height);
        ctx.fillStyle = '#8D6E63'; // Bow
        ctx.fillRect(this.position.x - cameraX - 5, this.position.y, 5, this.height);
        super.draw(ctx, cameraX);
    }
}

class Arrow {
    constructor(x, y, direction) {
        this.position = new Vector2D(x, y);
        this.velocity = new Vector2D(6 * direction, 0);
        this.width = 15;
        this.height = 3;
    }
    update() { this.position.add(this.velocity); }
    draw(ctx, cameraX) {
        ctx.fillStyle = '#F5F5F5';
        ctx.fillRect(this.position.x - cameraX, this.position.y, this.width, this.height);
    }
}

// --- GERAÇÃO PROCEDURAL ---
const generateLevelChunk = (lastX, lastY) => {
    const newPlatforms = [];
    const newEnemies = [];
    const gap = MIN_PLATFORM_GAP + Math.random() * (MAX_PLATFORM_GAP - MIN_PLATFORM_GAP);
    const newX = lastX + gap;
    const yVariation = MIN_PLATFORM_Y_VAR + Math.random() * (MAX_PLATFORM_Y_VAR - MIN_PLATFORM_Y_VAR);
    let newY = lastY + yVariation;
    if (newY > SCREEN_HEIGHT - 40) newY = SCREEN_HEIGHT - 40;
    if (newY < 250) newY = 250;
    const newWidth = MIN_PLATFORM_WIDTH + Math.random() * (MAX_PLATFORM_WIDTH - MIN_PLATFORM_WIDTH);
    const newPlatform = new Platform(newX, newY, newWidth);
    newPlatforms.push(newPlatform);
    if (Math.random() < ENEMY_SPAWN_CHANCE && newWidth > 180) {
        const enemyX = newPlatform.x + newPlatform.width / 2;
        const enemyY = newPlatform.y;
        if (Math.random() < 0.5) {
            newEnemies.push(new SkeletonMelee(enemyX, enemyY, newPlatform.x, newPlatform.width));
        } else {
            newEnemies.push(new SkeletonArcher(enemyX, enemyY));
        }
    }
    return { newPlatforms, newEnemies };
};

// --- COMPONENTES REACT ---

const MainMenu = ({ onStart, onAbout }) => (
    <div className="w-full h-full bg-gray-900 flex flex-col justify-center items-center text-white p-8 border-4 border-gray-700">
        <h1 className="text-6xl font-cinzel font-bold mb-10 text-red-700 drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)]">mar..... io?</h1>
        <button onClick={onStart} className="font-cinzel bg-gray-700 hover:bg-red-800 border-2 border-gray-500 hover:border-red-600 text-gray-200 font-bold py-3 px-8 rounded-sm text-2xl shadow-lg transition-all duration-300">
            Iniciar Jornada
        </button>
        <button onClick={onAbout} className="mt-5 font-cinzel bg-gray-800 hover:bg-gray-700 border border-gray-600 hover:border-gray-500 text-gray-400 font-bold py-2 px-6 rounded-sm text-xl shadow-md transition-all duration-300">
            Sobre
        </button>
    </div>
);

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
        <button onClick={onBack} className="mt-8 font-cinzel bg-gray-700 hover:bg-gray-600 border border-gray-600 text-gray-300 font-bold py-2 px-6 rounded-sm shadow-lg">
            Retornar
        </button>
    </div>
);

const Game = ({ onGameOver }) => {
    const canvasRef = useRef(null);
    const playerRef = useRef(new Player());
    
    const { initialPlatforms, initialEnemies } = React.useMemo(() => {
        const platforms = [
            new Platform(50, PLATFORM_START_Y, 300), 
            new Platform(500, PLATFORM_START_Y - 20, 250),
            new Platform(850, PLATFORM_START_Y - 40, 200),
        ];
        const enemies = [
            new SkeletonMelee(550, platforms[1].y, platforms[1].x, platforms[1].width),
            new SkeletonArcher(950, platforms[2].y),
        ];
        return { initialPlatforms: platforms, initialEnemies: enemies };
    }, []);

    const platformsRef = useRef(initialPlatforms);
    const enemiesRef = useRef(initialEnemies);
    const projectilesRef = useRef([]);
    const keysPressedRef = useRef({});
    const cameraXRef = useRef(0);
    const scoreRef = useRef(0);
    const lastWalkScoreX = useRef(0);
    
    const gameLoop = useCallback((ctx) => {
        const player = playerRef.current;
        const keys = keysPressedRef.current;
        
        // UPDATE LOGIC
        player.velocity.x = 0;
        if (!player.isBlocking) {
            if (keys['ArrowLeft'] || keys['a']) player.velocity.x = -PLAYER_SPEED;
            if (keys['ArrowRight'] || keys['d']) player.velocity.x = PLAYER_SPEED;
        }
        player.applyGravity();
        player.update();
        platformsRef.current.forEach(p => player.handleCollision(p));
        enemiesRef.current.forEach(e => e.update(projectilesRef.current, player));
        projectilesRef.current.forEach(p => p.update());
        
        // COLLISION LOGIC
        if (player.isAttacking) {
            enemiesRef.current.forEach((enemy) => {
                if (enemy.hitCooldown === 0 &&
                    player.attackBox.x < enemy.position.x + enemy.width &&
                    player.attackBox.x + player.attackBox.width > enemy.position.x &&
                    player.attackBox.y < enemy.position.y + enemy.height &&
                    player.attackBox.height + player.attackBox.y > enemy.position.y) {
                    enemy.health -= 1;
                    enemy.hitCooldown = 30;
                }
            });
        }
        
        enemiesRef.current.forEach((enemy) => {
             if (player.position.x < enemy.position.x + enemy.width &&
                 player.position.x + player.width > enemy.position.x &&
                 player.position.y < enemy.position.y + enemy.height &&
                 player.position.y + player.height > enemy.position.y) {
                 player.takeDamage(1);
             }
        });
        projectilesRef.current.forEach((proj, index) => {
            if (player.position.x < proj.position.x + proj.width &&
                player.position.x + player.width > proj.position.x &&
                player.position.y < proj.position.y + proj.height &&
                player.position.y + player.height > proj.position.y) {
                player.takeDamage(1);
                projectilesRef.current.splice(index, 1);
            }
        });

        // ENEMY DEATH, PLAYER HEALING, AND SCORING
        let enemiesKilledThisFrame = 0;
        enemiesRef.current = enemiesRef.current.filter(e => {
            if (e.health <= 0) {
                enemiesKilledThisFrame++;
                return false;
            }
            return true;
        });
        if (enemiesKilledThisFrame > 0) {
            player.heal(enemiesKilledThisFrame);
            scoreRef.current += enemiesKilledThisFrame * 100;
        }

        // LEVEL GENERATION, CLEANUP AND WALKING SCORE
        cameraXRef.current = player.position.x - SCREEN_WIDTH / 3;
        
        const walkPointsThisFrame = Math.floor(player.position.x / 80) - Math.floor(lastWalkScoreX.current / 80);
        if(walkPointsThisFrame > 0) {
            scoreRef.current += walkPointsThisFrame;
        }
        lastWalkScoreX.current = player.position.x;
        
        const lastPlatform = platformsRef.current[platformsRef.current.length - 1];
        if (lastPlatform && player.position.x > lastPlatform.x - SCREEN_WIDTH) {
            const { newPlatforms, newEnemies } = generateLevelChunk(lastPlatform.x + lastPlatform.width, lastPlatform.y);
            platformsRef.current.push(...newPlatforms);
            enemiesRef.current.push(...newEnemies);
        }
        platformsRef.current = platformsRef.current.filter(p => p.x + p.width > cameraXRef.current);
        enemiesRef.current = enemiesRef.current.filter(e => e.position.x + e.width > cameraXRef.current);
        projectilesRef.current = projectilesRef.current.filter(p => p.position.x + p.width > cameraXRef.current && p.position.x < cameraXRef.current + SCREEN_WIDTH);

        // PLAYER DEATH CHECK
        if (player.position.y > SCREEN_HEIGHT + player.height) player.takeDamage(50);
        if (player.health <= 0) {
            onGameOver(scoreRef.current);
            return;
        }
        
        // RENDER
        const bgGradient = ctx.createLinearGradient(0, 0, 0, SCREEN_HEIGHT);
        bgGradient.addColorStop(0, '#0a0a0a'); bgGradient.addColorStop(0.6, '#222034'); bgGradient.addColorStop(1, '#444264');
        ctx.fillStyle = bgGradient;
        ctx.fillRect(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT);
        
        platformsRef.current.forEach(p => p.draw(ctx, cameraXRef.current));
        enemiesRef.current.forEach(e => e.draw(ctx, cameraXRef.current));
        projectilesRef.current.forEach(p => p.draw(ctx, cameraXRef.current));
        player.draw(ctx, cameraXRef.current);
        
        // HUD
        ctx.font = 'bold 24px "Cinzel"';
        ctx.textAlign = 'left';
        ctx.shadowColor = 'black';
        ctx.shadowBlur = 4;
        ctx.fillStyle = '#D1D1D1';
        ctx.fillText(`Almas: ${scoreRef.current}`, 20, 40);
        for (let i = 0; i < player.maxHealth; i++) {
            ctx.fillStyle = i < player.health ? '#e53e3e' : '#718096';
            ctx.fillRect(SCREEN_WIDTH - 120 + (i * 25), 20, 20, 20);
        }
        ctx.shadowBlur = 0;

        requestAnimationFrame(() => gameLoop(ctx));
    }, [onGameOver, initialPlatforms, initialEnemies]);

    useEffect(() => {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        let animationFrameId;

        const handleKeyDown = (e) => {
            keysPressedRef.current[e.key] = true;
            if (e.key === ' ' || e.key === 'ArrowUp' || e.key === 'w') {
                e.preventDefault();
                playerRef.current.jump();
            }
        };
        const handleKeyUp = (e) => {
            keysPressedRef.current[e.key] = false;
        };
        const handleMouseDown = (e) => {
            if (e.button === 0) {
                playerRef.current.attack();
            } else if (e.button === 2) {
                if (playerRef.current.canBlock) {
                    playerRef.current.isBlocking = true;
                }
            }
        };
        const handleMouseUp = (e) => {
            if (e.button === 2) {
                playerRef.current.isBlocking = false;
            }
        };
        const handleContextMenu = (e) => e.preventDefault();

        window.addEventListener('keydown', handleKeyDown);
        window.addEventListener('keyup', handleKeyUp);
        window.addEventListener('mousedown', handleMouseDown);
        window.addEventListener('mouseup', handleMouseUp);
        window.addEventListener('contextmenu', handleContextMenu);
        
        animationFrameId = requestAnimationFrame(() => gameLoop(ctx));
        
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            window.removeEventListener('keyup', handleKeyUp);
            window.removeEventListener('mousedown', handleMouseDown);
            window.removeEventListener('mouseup', handleMouseUp);
            window.removeEventListener('contextmenu', handleContextMenu);
            cancelAnimationFrame(animationFrameId);
        };
    }, [gameLoop]);

    return <canvas ref={canvasRef} width={SCREEN_WIDTH} height={SCREEN_HEIGHT} />;
};

const GameOverScreen = ({ score, onRestart }) => {
    return (
        <div className="w-full h-full bg-black bg-opacity-80 flex flex-col justify-center items-center text-white p-8">
            <h1 className="text-7xl font-cinzel font-bold text-red-700 mb-4 drop-shadow-[0_0_8px_rgba(255,0,0,0.7)]">VOCÊ MORREU</h1>
            
            <div className="h-16 flex items-center justify-center">
                 <p className="text-2xl text-center italic text-gray-300 font-cinzel">sua alma se esvai...</p>
            </div>

            <p className="text-xl mt-4 mb-8 font-cinzel text-gray-400">Você coletou {score} almas.</p>

            <button onClick={onRestart} className="font-cinzel bg-gray-700 hover:bg-red-800 border-2 border-gray-500 hover:border-red-600 text-gray-200 font-bold py-3 px-8 rounded-sm text-2xl shadow-lg transition-all duration-300">
                Renascer
            </button>
        </div>
    );
};

export default function App() {
    const [gameState, setGameState] = useState('menu');
    const [finalScore, setFinalScore] = useState(0);

    const handleStartGame = () => setGameState('playing');
    const handleShowAbout = () => setGameState('about');
    const handleBackToMenu = () => setGameState('menu');
    const handleGameOver = (score) => {
        setFinalScore(score);
        setGameState('gameOver');
    }
    
    const renderGameState = () => {
        switch (gameState) {
            case 'playing': return <Game key={Date.now()} onGameOver={handleGameOver} />;
            case 'about': return <AboutScreen onBack={handleBackToMenu} />;
            case 'gameOver': return <GameOverScreen score={finalScore} onRestart={handleStartGame} />
            default: return <MainMenu onStart={handleStartGame} onAbout={handleShowAbout} />;
        }
    };

    return (
        <div className="bg-black flex justify-center items-center min-h-screen">
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@400;700&display=swap');
                .font-cinzel { font-family: 'Cinzel', serif; }
                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(10px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .fading-name {
                    display: inline-block;
                    animation: fadeIn 3s ease-in-out infinite alternate;
                    padding: 2px;
                    opacity: 0;
                }
            `}</style>
            <div style={{ width: SCREEN_WIDTH, height: SCREEN_HEIGHT }} className="relative bg-gray-900 shadow-2xl shadow-red-900/40">
               {renderGameState()}
            </div>
        </div>
    );
}
