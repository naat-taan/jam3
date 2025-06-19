import { Platform, SkeletonMelee, SkeletonArcher } from './entities';
import {
    MIN_PLATFORM_GAP, MAX_PLATFORM_GAP, MIN_PLATFORM_Y_VAR, MAX_PLATFORM_Y_VAR,
    SCREEN_HEIGHT, MIN_PLATFORM_WIDTH, MAX_PLATFORM_WIDTH, ENEMY_SPAWN_CHANCE
} from './constants';

/** Gera um novo pedaço do nível com plataformas e, possivelmente, inimigos. */
export const generateLevelChunk = (lastX, lastY, difficultyLevel) => {
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