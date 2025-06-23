import React, { useState, useEffect, useRef } from 'react';
import MainMenu from './components/MainMenu.jsx';
import AboutScreen from './components/AboutScreen.jsx';
import ShopScreen from './components/ShopScreen.jsx';
import Game from './components/Game.jsx';
import GameOverScreen from './components/GameOverScreen.jsx';
import './styles.css'; // Certifique-se de que o caminho está correto
import { SCREEN_WIDTH, SCREEN_HEIGHT, UPGRADES_CONFIG } from './game/constants';

function App() {
    const [gameState, setGameState] = useState('menu');
    const [totalSouls, setTotalSouls] = useState(0);
    const [lastScore, setLastScore] = useState(0);
    const [upgrades, setUpgrades] = useState({ health: 0, damage: 0, attackSpeed: 0, blockCharges: 0, blockCooldown: 0 });
    const [playerStats, setPlayerStats] = useState({});
    const [hasPlayedOnce, setHasPlayedOnce] = useState(false);

    // --- Implementação da Trilha Sonora ---
    const menuAudioRef = useRef(null);
    const gameAudioRef = useRef(null);
    const [currentMenuTrack, setCurrentMenuTrack] = useState(0);
    const [currentGameTrack, setCurrentGameTrack] = useState(0);

    // Playlists de música. Crie uma pasta 'public/audio' no seu projeto e coloque os arquivos lá.
    const menuTracks = ['/assets/sounds/music/main_1.mp3', '/assets/sounds/music/main_2.mp3'];
    const gameTracks = ['/assets/sounds/music/fight_2.mp3', '/assets/sounds/music/fight_2.mp3' ];

    useEffect(() => {
        if (menuAudioRef.current) menuAudioRef.current.volume = 0.3;
        if (gameAudioRef.current) gameAudioRef.current.volume = 0.3;
    }, []);

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

    // Efeito para gerenciar a lógica da playlist (alternar músicas ao terminarem)
    useEffect(() => {
        const menuAudio = menuAudioRef.current;
        const gameAudio = gameAudioRef.current;

        const playNextMenuTrack = () => setCurrentMenuTrack(prev => (prev + 1) % menuTracks.length);
        const playNextGameTrack = () => setCurrentGameTrack(prev => (prev + 1) % gameTracks.length);

        if (menuAudio) menuAudio.addEventListener('ended', playNextMenuTrack);
        if (gameAudio) gameAudio.addEventListener('ended', playNextGameTrack);

        return () => {
            if (menuAudio) menuAudio.removeEventListener('ended', playNextMenuTrack);
            if (gameAudio) gameAudio.removeEventListener('ended', playNextGameTrack);
        };
    }, [menuTracks.length, gameTracks.length]);

    // Efeito para controlar play/pause com base no estado do jogo (gameState)
    useEffect(() => {
        const menuAudio = menuAudioRef.current;
        const gameAudio = gameAudioRef.current;
        const isMenuState = ['menu', 'shop', 'about', 'gameOver'].includes(gameState);

        if (isMenuState) {
            if (gameAudio && !gameAudio.paused) gameAudio.pause();
            if (menuAudio && menuAudio.paused) {
                menuAudio.play().catch(e => console.error("Erro ao tocar música do menu:", e));
            }
        } else if (gameState === 'playing') {
            if (menuAudio && !menuAudio.paused) menuAudio.pause();
            if (gameAudio && gameAudio.paused) {
                gameAudio.play().catch(e => console.error("Erro ao tocar música do jogo:", e));
            }
        }
    }, [gameState]);

    // Efeito para tocar a próxima música da playlist de MENU quando o índice mudar
    useEffect(() => {
        const audio = menuAudioRef.current;
        const isMenuState = ['menu', 'shop', 'about', 'gameOver'].includes(gameState);
        if (audio && isMenuState && audio.paused) {
            audio.play().catch(e => console.error("Erro ao tocar música do menu:", e));
        }
    }, [currentMenuTrack, gameState]);

    // Efeito para tocar a próxima música da playlist de JOGO quando o índice mudar
    useEffect(() => {
        const audio = gameAudioRef.current;
        if (audio && gameState === 'playing' && audio.paused) {
            audio.play().catch(e => console.error("Erro ao tocar música do jogo:", e));
        }
    }, [currentGameTrack, gameState]);

    const handlePurchaseUpgrade = (key) => {
        const cost = Math.floor(UPGRADES_CONFIG[key].cost * Math.pow(UPGRADES_CONFIG[key].costIncrease, upgrades[key]));
        if (totalSouls >= cost) {
            setTotalSouls(prev => prev - cost);
            setUpgrades(prev => ({ ...prev, [key]: prev[key] + 1 }));
        }
    };

    const handleGameOver = (score) => {
        setTotalSouls(prev => prev + score);
        setLastScore(score);
        setGameState('gameOver');
    };

    const renderGameState = () => {
        switch (gameState) {
            case 'menu':
                return <MainMenu onStart={() => { setGameState('playing'); setHasPlayedOnce(true); }} onAbout={() => setGameState('about')} onShop={() => setGameState('shop')} />;
            case 'about':
                return <AboutScreen onBack={() => setGameState('menu')} />;
            case 'shop':
                return <ShopScreen onBack={() => setGameState('menu')} onRestartGame={() => { setGameState('playing'); setHasPlayedOnce(true); }} hasPlayedOnce={hasPlayedOnce} totalSouls={totalSouls} upgrades={upgrades} purchaseUpgrade={handlePurchaseUpgrade} />;
            case 'playing':
                return <Game playerStats={playerStats} onGameOver={handleGameOver} />;
            case 'gameOver':
                return <GameOverScreen score={lastScore} onGoToMenu={() => setGameState('menu')} onGoToShop={() => setGameState('shop')} onRestartGame={() => setGameState('playing')} />;
            default:
                return <MainMenu onStart={() => { setGameState('playing'); setHasPlayedOnce(true); }} onAbout={() => setGameState('about')} onShop={() => setGameState('shop')} />;
        }
    };

    return (
    <div className="bg-black min-h-screen flex items-center justify-center p-4">
        {/* Elementos de Áudio */}
        <audio ref={menuAudioRef} src={menuTracks[currentMenuTrack]} />
        <audio ref={gameAudioRef} src={gameTracks[currentGameTrack]} />

        <div 
            style={{ 
                width: SCREEN_WIDTH, 
                height: SCREEN_HEIGHT,
            }} 
            className="relative bg-black shadow-2xl shadow-red-900/40 flex items-center justify-center"
        >
            {renderGameState()}
        </div>
    </div>
);
}
export default App;
