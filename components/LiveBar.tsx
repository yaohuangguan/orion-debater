import React from 'react';
import { Language } from '../types';
import { t } from '../utils/translations';

interface LiveBarProps {
  voteA: number;
  voteB: number;
  onVote: (side: 'A' | 'B') => void;
  personaAColor?: string;
  personaBColor?: string;
  lang: Language;
}

export const LiveBar: React.FC<LiveBarProps> = ({ voteA, voteB, onVote, personaAColor = 'blue', personaBColor = 'red', lang }) => {
  const total = voteA + voteB;
  const percentA = total === 0 ? 50 : (voteA / total) * 100;

  return (
    <div className="absolute top-0 left-0 right-0 z-10 p-2">
      <div className="max-w-xl mx-auto bg-slate-900/90 backdrop-blur-md rounded-full border border-slate-700 shadow-xl overflow-hidden flex items-center relative h-12">
        
        {/* Progress Bar Background */}
        <div className="absolute inset-0 flex opacity-20">
          <div style={{ width: `${percentA}%` }} className={`bg-${personaAColor}-500 transition-all duration-700 ease-out`}></div>
          <div className={`flex-1 bg-${personaBColor}-500 transition-all duration-700 ease-out`}></div>
        </div>

        {/* Left Button */}
        <button 
          onClick={() => onVote('A')}
          className="flex-1 z-10 h-full flex items-center justify-start pl-4 group hover:bg-white/5 transition-colors"
        >
          <div className={`w-2 h-2 rounded-full bg-${personaAColor}-400 mr-2 group-hover:animate-ping`}></div>
          <span className={`text-xs font-bold text-${personaAColor}-300 whitespace-nowrap`}>{t('voteA', lang)}</span>
          <span className="ml-2 text-[10px] opacity-60 font-mono hidden sm:inline">{Math.round(percentA)}%</span>
        </button>

        {/* Divider */}
        <div className="w-[1px] h-4 bg-slate-600 z-10"></div>

        {/* Right Button */}
        <button 
          onClick={() => onVote('B')}
          className="flex-1 z-10 h-full flex items-center justify-end pr-4 group hover:bg-white/5 transition-colors"
        >
          <span className="mr-2 text-[10px] opacity-60 font-mono hidden sm:inline">{100 - Math.round(percentA)}%</span>
          <span className={`text-xs font-bold text-${personaBColor}-300 whitespace-nowrap`}>{t('voteB', lang)}</span>
          <div className={`w-2 h-2 rounded-full bg-${personaBColor}-400 ml-2 group-hover:animate-ping`}></div>
        </button>

      </div>
    </div>
  );
};