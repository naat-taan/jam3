import React, { useRef, useEffect, useCallback } from 'react';
import { Player, Platform, SkeletonMelee, SkeletonArcher } from '../game/entities';
import { generateLevelChunk } from '../game/levelGenerator';
import { SCREEN_WIDTH, SCREEN_HEIGHT, PLAYER_SPEED, PLATFORM_START_Y } from '../game/constants';

const Game = ({ playerStats, onGameOver }) => {
    const canvasRef = useRef(null);
    const playerRef = useRef(null); // Será inicializado no useEffect
    // const assetsRef = useRef(null); // Não está sendo usado, pode ser removido se não houver planos para assets carregados

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


    const gameLoop = useCallback((ctx) => {
        const player = playerRef.current;
        if (!player) return; // Garante que o jogador foi inicializado

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

        const bgGradient = ctx.createLinearGradient(0, 0, 0, SCREEN_HEIGHT);
        bgGradient.addColorStop(0, '#0a0a0a'); bgGradient.addColorStop(0.6, '#222034'); bgGradient.addColorStop(1, '#444264');
        ctx.fillStyle = bgGradient; ctx.fillRect(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT);

        platformsRef.current.forEach(p => p.draw(ctx, cameraXRef.current, null));
        enemiesRef.current.forEach(e => e.draw(ctx, cameraXRef.current, null));
        projectilesRef.current.forEach(p => p.draw(ctx, cameraXRef.current, null));
        player.draw(ctx, cameraXRef.current, null);

        ctx.font = 'bold 24px "Cinzel"'; ctx.textAlign = 'left'; ctx.shadowColor = 'black';
        ctx.shadowBlur = 4; ctx.fillStyle = '#D1D1D1';
        ctx.fillText(`Almas: ${scoreRef.current}`, 20, 40);
        for (let i = 0; i < player.maxHealth; i++) {
            ctx.fillStyle = i < player.health ? '#e53e3e' : '#718096';
            ctx.fillRect(SCREEN_WIDTH - 120 + (i * 25), 20, 20, 20);
        }
        ctx.shadowBlur = 0;

        animationFrameIdRef.current = requestAnimationFrame(() => gameLoop(ctx));
    }, [onGameOver]); // Removido initialPlatforms, initialEnemies das dependências do gameLoop pois são estáveis via useMemo

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas || !playerRef.current) return; // Adicionado verificação para playerRef.current
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
    }, [gameLoop, playerStats]); // Adicionado playerStats como dependência para reiniciar o loop/handlers se o jogador for recriado

    return <canvas ref={canvasRef} width={SCREEN_WIDTH} height={SCREEN_HEIGHT} />;
};

export default Game;