import React from 'react';

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
        <button onClick={onBack} className="mt-8 font-cinzel bg-gray-700 hover:bg-gray-600 border border-gray-600 text-gray-300 font-bold py-2 px-6 rounded-sm shadow-lg">Retornar</button>
    </div>
);

export default AboutScreen;