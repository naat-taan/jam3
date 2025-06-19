import React from 'react';
import { UPGRADES_CONFIG } from '../game/constants';

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
                <button onClick={onBack} className="font-cinzel bg-gray-700 hover:bg-gray-600 border border-gray-600 text-gray-300 font-bold py-2 px-6 rounded-sm shadow-lg">Retornar ao Menu</button>
                <button onClick={onRestartGame} className="font-cinzel bg-red-800 hover:bg-red-700 border-2 border-red-600 text-gray-200 font-bold py-2 px-6 rounded-sm text-2xl shadow-lg transition-all">{hasPlayedOnce ? "Renascer" : "Iniciar Jornada"}</button>
            </div>
        </div>
    );
};

export default ShopScreen;