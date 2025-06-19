import React, { useState, useEffect } from 'react';
import MainMenu from './components/MainMenu';
import AboutScreen from './components/AboutScreen';
import ShopScreen from './components/ShopScreen';
import Game from './components/Game';
import GameOverScreen from './components/GameOverScreen';
import { UPGRADES_CONFIG, SCREEN_WIDTH, SCREEN_HEIGHT } from './game/constants';

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
            setUpgrades(prev => ({ ...prev, [key]: prev[key] + 1 }));
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
            {/* 
            // --- elementos de áudio ---
            <audio ref={menuAudioRef} src="URL_DA_MUSICA_DO_MENU.mp3" loop />
            <audio ref={gameAudioRef} src="URL_DA_MUSICA_DO_JOGO.mp3" loop />
            */}
            <div style={{ width: SCREEN_WIDTH, height: SCREEN_HEIGHT }} className="relative bg-gray-900 shadow-2xl shadow-red-900/40">
                {renderGameState()}
            </div>
        </div>
    );
}