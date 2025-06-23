import React from 'react';
import '../styles.css'; // Certifique-se de que o caminho está correto
const MainMenu = ({ onStart, onAbout, onShop }) => (
    <div className="w-full h-full flex flex-col justify-center items-center text-white p-8 border-4 border-gray-700 relative">
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

export default MainMenu;