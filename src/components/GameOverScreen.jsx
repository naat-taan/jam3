import React from 'react';

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

export default GameOverScreen;