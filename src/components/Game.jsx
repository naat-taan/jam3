import React, { useRef, useEffect, useCallback } from 'react';
import { Player, Platform, SkeletonMelee, SkeletonArcher } from '../game/entities';
import { generateLevelChunk } from '../game/levelGenerator';
import { SCREEN_WIDTH, SCREEN_HEIGHT, PLAYER_SPEED, PLATFORM_START_Y } from '../game/constants';

const Game = ({ playerStats, onGameOver }) => {
    const canvasRef = useRef(null);
    const playerRef = useRef(null); // Será inicializado no useEffect
    const assetsRef = useRef({
        platform: null,
        background: null,
        background2: null,
        background3: null,
        background4: null, 
        skeletonMeleeAttack: null,
        skeletonMeleeWalk: null,
        skeletonMeleeHurt: null,
        skeletonMeleeDeath: null,
        Knight_Idle: null,
        Knight_Run: null,
        Knight_Full_Jump: null,
        Knight_Hurt: null,
        Death_Sprite_Sheet: null,
        Attack_Sprite_Sheet_Full: null,
        loaded: false,
        skeletonArcherIdle: null,
        skeletonArcherAttack: null,
    });

    const { initialPlatforms, initialEnemies } = React.useMemo(() => {
        const platforms = [
            new Platform(50, PLATFORM_START_Y, 300),
            new Platform(500, PLATFORM_START_Y - 20, 250),
            new Platform(850, PLATFORM_START_Y - 40, 200),
        ];
        const enemies = [
            new SkeletonMelee(550, platforms[1].y, platforms[1].x, platforms[1].width, 1),
            new SkeletonArcher(950, platforms[2].y, 1),
        ];
        return { initialPlatforms: platforms, initialEnemies: enemies };
    }, []);

    const platformsRef = useRef([...initialPlatforms]);
    const enemiesRef = useRef([...initialEnemies]);
    const projectilesRef = useRef([]);
    const keysPressedRef = useRef({});
    const cameraXRef = useRef(0);
    const scoreRef = useRef(0);
    const lastWalkScoreX = useRef(0);
    const difficultyLevelRef = useRef(1);
    const animationFrameIdRef = useRef(null);

    // Efeito para carregar as imagens (assets) do jogo
    useEffect(() => {
        const platformImg = new Image();
        const backgroundImg = new Image();
        const backgroundImg2 = new Image();
        const backgroundImg3 = new Image();
        const backgroundImg4 = new Image();
        const skeletonMeleeAttackImg = new Image();
        const skeletonMeleeWalkImg = new Image();
        const skeletonMeleeHurtImg = new Image();
        const skeletonMeleeDeathImg = new Image();
        const knightIdleImg = new Image();
        const knightRunImg = new Image();
        const knightJumpImg = new Image();
        const knightHurtImg = new Image();
        const knightDeathImg = new Image();
        const knightAttackImg = new Image();
        const skeletonArcherIdleImg = new Image();
        const skeletonArcherAttackImg = new Image();

        let loadedCount = 0;
        const totalImages = 15; // 1 plataforma + 4 backgrounds + 4 skeleton + 6 player

        const onImageLoad = () => {
            loadedCount++;
            if (loadedCount === totalImages) {
                assetsRef.current.loaded = true;
            }
        };

        platformImg.onload = onImageLoad;
        backgroundImg.onload = onImageLoad;
        backgroundImg2.onload = onImageLoad;
        backgroundImg3.onload = onImageLoad;
        backgroundImg4.onload = onImageLoad;
        skeletonMeleeAttackImg.onload = onImageLoad;
        skeletonMeleeWalkImg.onload = onImageLoad;
        skeletonMeleeHurtImg.onload = onImageLoad;
        skeletonMeleeDeathImg.onload = onImageLoad;
        knightIdleImg.onload = onImageLoad;
        knightRunImg.onload = onImageLoad;
        knightJumpImg.onload = onImageLoad;
        knightHurtImg.onload = onImageLoad;
        knightDeathImg.onload = onImageLoad;
        knightAttackImg.onload = onImageLoad;
        skeletonArcherIdleImg.onload = onImageLoad;
        skeletonArcherAttackImg.onload = onImageLoad;

        platformImg.src = '/assets/images/environment/texture.png';
        backgroundImg.src = '/assets/images/environment/background.png';
        backgroundImg2.src = '/assets/images/environment/background2.png';
        backgroundImg3.src = '/assets/images/environment/background3.png';
        backgroundImg4.src = '/assets/images/environment/background4.png';

        skeletonMeleeAttackImg.src = '/assets/images/enemies/Skeleton_Sword/Attack/Skeleton_Attack_1.png';
        skeletonMeleeWalkImg.src = '/assets/images/enemies/Skeleton_Sword/Walk/SkeletonWalk.png';
        skeletonMeleeHurtImg.src = '/assets/images/enemies/Skeleton_Sword/Hurt/SkeletonHurt.png';
        skeletonMeleeDeathImg.src = '/assets/images/enemies/Skeleton_Sword/Death/Skeleton_Sword_Death.png';

        knightIdleImg.src = '/assets/images/player/character/Knight_Idle.png';
        knightRunImg.src = '/assets/images/player/character/Knight_Run.png';
        knightJumpImg.src = '/assets/images/player/character/Knight_Full_Jump.png';
        knightHurtImg.src = '/assets/images/player/character/Knight_Hurt.png';
        knightDeathImg.src = '/assets/images/player/character/Death_Sprite_Sheet.png';
        knightAttackImg.src = '/assets/images/player/character/Attack_Sprite_Sheet_Full.png';

        skeletonArcherIdleImg.src = '/assets/images/enemies/Skeleton_Bow/Walk/Skeleton_Bow_Walk.png';
        skeletonArcherAttackImg.src = '/assets/images/enemies/Skeleton_Bow/Attack/Skeleton_Bow_Shooting_Once.png';

        assetsRef.current.platform = platformImg;
        assetsRef.current.background = backgroundImg;
        assetsRef.current.background2 = backgroundImg2;
        assetsRef.current.background3 = backgroundImg3;
        assetsRef.current.background4 = backgroundImg4;
        assetsRef.current.skeletonMeleeAttack = skeletonMeleeAttackImg;
        assetsRef.current.skeletonMeleeWalk = skeletonMeleeWalkImg;
        assetsRef.current.skeletonMeleeHurt = skeletonMeleeHurtImg;
        assetsRef.current.skeletonMeleeDeath = skeletonMeleeDeathImg;
        assetsRef.current.Knight_Idle = knightIdleImg;
        assetsRef.current.Knight_Run = knightRunImg;
        assetsRef.current.Knight_Full_Jump = knightJumpImg;
        assetsRef.current.Knight_Hurt = knightHurtImg;
        assetsRef.current.Death_Sprite_Sheet = knightDeathImg;
        assetsRef.current.Attack_Sprite_Sheet_Full = knightAttackImg;
        assetsRef.current.skeletonArcherIdle = skeletonArcherIdleImg;
        assetsRef.current.skeletonArcherAttack = skeletonArcherAttackImg;
    }, []);
    // Inicializa o jogador quando playerStats estiver disponível ou mudar
    useEffect(() => {
        playerRef.current = new Player(playerStats);
        // Resetar outros estados relacionados ao jogador se necessário ao reiniciar
        scoreRef.current = 0;
        lastWalkScoreX.current = playerRef.current.position.x;
        difficultyLevelRef.current = 1;
        platformsRef.current = [...initialPlatforms];
        enemiesRef.current = [...initialEnemies];
        projectilesRef.current = [];

    }, [playerStats, initialPlatforms, initialEnemies]);


    const drawParallaxLayer = useCallback((ctx, image, cameraX, parallaxFactor) => {
        if (!image) return;
        const bgWidth = image.width;
        const parallaxX = cameraX * parallaxFactor;
        const offsetX = ((parallaxX % bgWidth) + bgWidth) % bgWidth;

        // Calculate the starting X position for the first image tile
        // This ensures that the part of the image that should be at the left edge of the screen
        // (after parallax scroll) is correctly positioned.
        let startX = -offsetX;

        // Draw tiles until the screen is covered
        while (startX < SCREEN_WIDTH) {
            ctx.drawImage(image, startX, 0, bgWidth, SCREEN_HEIGHT);
            startX += bgWidth; // Move to the next tile position
        }
    }, [SCREEN_WIDTH, SCREEN_HEIGHT]); // Adicionado SCREEN_WIDTH e SCREEN_HEIGHT às dependências, embora sejam constantes.
    
    const gameLoop = useCallback((ctx) => {
        const player = playerRef.current;
        if (!player) return; // Garante que o jogador foi inicializado

        const keys = keysPressedRef.current;

        player.velocity.x = 0;
        if (!player.isBlocking) {
            if (keys['ArrowLeft'] || keys['a']) player.velocity.x = -PLAYER_SPEED;
            if (keys['ArrowRight'] || keys['d']) player.velocity.x = PLAYER_SPEED;
        }
        
        player.applyGravity();
        platformsRef.current.forEach(p => player.handleCollision(p));
        player.update();

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

        // Lógica de dano do inimigo ao jogador
        enemiesRef.current.forEach((enemy) => {
            if (enemy instanceof SkeletonMelee) {
                // Lógica de ataque corpo a corpo
                if (enemy.isAttacking) {
                    const attackBox = enemy.attackBox;
                    if (
                        player.position.x < attackBox.x + attackBox.width &&
                        player.position.x + player.width > attackBox.x &&
                        player.position.y < attackBox.y + attackBox.height &&
                        player.position.y + player.height > attackBox.y
                    ) {
                        player.takeDamage(enemy.damage);
                    }
                }
            } else if (!(enemy instanceof SkeletonArcher)) { // Dano de contato para outros inimigos (que não sejam arqueiros)
                if (player.position.x < enemy.position.x + enemy.width && player.position.x + player.width > enemy.position.x &&
                    player.position.y < enemy.position.y + enemy.height && player.position.y + player.height > enemy.position.y) {
                    player.takeDamage(enemy.damage || 1);
                }
            }
        });
        projectilesRef.current.forEach((proj, index) => {
            if (player.position.x < proj.position.x + proj.width && player.position.x + player.width > proj.position.x &&
                player.position.y < proj.position.y + proj.height && player.position.y + player.height > proj.position.y) {
                player.takeDamage(1); // ou proj.damage se projéteis tiverem dano variável
                projectilesRef.current.splice(index, 1);
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
        if (walkPointsThisFrame > 0) { scoreRef.current += walkPointsThisFrame; }
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

         // Fundo com efeito parallax
        if (assetsRef.current.loaded) {
            const { background, background2, background3, background4 } = assetsRef.current;
            // Desenha as camadas da mais distante para a mais próxima
            drawParallaxLayer(ctx, background, cameraXRef.current, 0.1);
            drawParallaxLayer(ctx, background2, cameraXRef.current, 0.25);
            drawParallaxLayer(ctx, background3, cameraXRef.current, 0.4);
            drawParallaxLayer(ctx, background4, cameraXRef.current, 0.5);
        } else {
            const bgGradient = ctx.createLinearGradient(0, 0, 0, SCREEN_HEIGHT);
            bgGradient.addColorStop(0, '#0a0a0a'); bgGradient.addColorStop(0.6, '#222034'); bgGradient.addColorStop(1, '#444264');
            ctx.fillStyle = bgGradient; ctx.fillRect(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT);
        }

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

        animationFrameIdRef.current = requestAnimationFrame(() => gameLoop(ctx));
    }, [onGameOver, drawParallaxLayer]);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas || !playerRef.current) return;
        const ctx = canvas.getContext('2d');

        const handleKeyDown = (e) => { keysPressedRef.current[e.key] = true; if (playerRef.current && (e.key === ' ' || e.key === 'ArrowUp' || e.key === 'w')) { e.preventDefault(); playerRef.current.jump(); } };
        const handleKeyUp = (e) => { keysPressedRef.current[e.key] = false; };
        const handleMouseDown = (e) => { if (playerRef.current) { if (e.button === 0) { playerRef.current.attack(); } else if (e.button === 2) { if (playerRef.current.canBlock) { playerRef.current.isBlocking = true; } } } };
        const handleMouseUp = (e) => { if (playerRef.current && e.button === 2) { playerRef.current.isBlocking = false; } };
        const handleContextMenu = (e) => e.preventDefault();

        window.addEventListener('keydown', handleKeyDown); window.addEventListener('keyup', handleKeyUp);
        window.addEventListener('mousedown', handleMouseDown); window.addEventListener('mouseup', handleMouseUp);
        window.addEventListener('contextmenu', handleContextMenu);

        animationFrameIdRef.current = requestAnimationFrame(() => gameLoop(ctx));

        return () => {
            window.removeEventListener('keydown', handleKeyDown); window.removeEventListener('keyup', handleKeyUp);
            window.removeEventListener('mousedown', handleMouseDown); window.removeEventListener('mouseup', handleMouseUp);
            window.removeEventListener('contextmenu', handleContextMenu);
            if (animationFrameIdRef.current) {
                cancelAnimationFrame(animationFrameIdRef.current);
            }
        };
    }, [gameLoop, playerStats]);

    return <canvas ref={canvasRef} width={SCREEN_WIDTH} height={SCREEN_HEIGHT} />;
};

export default Game;