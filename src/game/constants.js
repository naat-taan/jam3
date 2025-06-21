// --- Constantes Globais do Jogo ---
export const SCREEN_WIDTH = 1200;
export const SCREEN_HEIGHT = 600;
export const PLAYER_WIDTH = 32;
export const PLAYER_HEIGHT = 48;
export const PLAYER_SPEED = 5;
export const JUMP_FORCE = 15;
export const GRAVITY = 0.7;

// Constantes para a geração procedural das plataformas
export const PLATFORM_HEIGHT = 20;
export const MIN_PLATFORM_WIDTH = 150;
export const MAX_PLATFORM_WIDTH = 280;
export const PLATFORM_START_Y = SCREEN_HEIGHT - 50;
export const MIN_PLATFORM_GAP = 40;
export const MAX_PLATFORM_GAP = 80;
export const MIN_PLATFORM_Y_VAR = -40;
export const MAX_PLATFORM_Y_VAR = 40;

export const ENEMY_SPAWN_CHANCE = 0.7; // Chance base de um inimigo aparecer numa plataforma

// --- Configuração da Loja de Upgrades ---
export const UPGRADES_CONFIG = {
    health: { base: 3, cost: 2500, costIncrease: 2.2, description: "Vida Máxima" },
    damage: { base: 1, cost: 5000, costIncrease: 2.5, description: "Dano da Espada" },
    attackSpeed: { base: 30, cost: 4000, costIncrease: 2.6, decrease: 2, min: 10, description: "Velocidade de Ataque" },
    blockCharges: { base: 1, cost: 2000, costIncrease: 2.8, description: "Resistência do Escudo" },
    blockCooldown: { base: 180, cost: 2000, costIncrease: 2.3, decrease: 15, min: 60, description: "Recarga do Escudo" }
};

// Adicione outras constantes que possam ser específicas do jogo aqui, se necessário.
// Ex: export const ATTACK_HITBOX_WIDTH = 50;
// Ex: export const ENEMY_HIT_COOLDOWN = 30;