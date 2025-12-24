import React from 'react';
import { MatchResult, Persona, Language } from '../types';
import { t } from '../utils/translations';

interface ScoreModalProps {
  result: MatchResult;
  personaA: Persona;
  personaB: Persona;
  onClose: () => void;
  lang: Language;
}

const ScoreBar = ({ label, value, color }: { label: string, value: number, color: string }) => (
  <div className="mb-2">
    <div className="flex justify-between text-xs uppercase font-bold tracking-wider mb-1 opacity-80">
      <span>{label}</span>
      <span>{value}/10</span>
    </div>
    <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
      <div 
        className={`h-full bg-${color}-500`} 
        style={{ width: `${value * 10}%` }}
      ></div>
    </div>
  </div>
);

export const ScoreModal: React.FC<ScoreModalProps> = ({ result, personaA, personaB, onClose, lang }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-[fadeIn_0.2s_ease-out]">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden animate-[scaleIn_0.3s_ease-out]">
        
        <div className="p-6 text-center border-b border-slate-800 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900">
          <h2 className="text-2xl font-black text-white uppercase tracking-widest mb-1">{t('analyzing', lang)}</h2>
          <div className="text-sm font-mono text-slate-400">
             {t('winner', lang)}: <span className={result.winner === 'A' ? 'text-blue-400' : result.winner === 'B' ? 'text-red-400' : 'text-purple-400'}>
               {result.winner === 'A' ? personaA.name : result.winner === 'B' ? personaB.name : t('draw', lang)}
             </span>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-0">
          {/* Side A */}
          <div className="p-6 border-b md:border-b-0 md:border-r border-slate-800 bg-blue-900/5">
            <div className="flex items-center gap-3 mb-6">
               <span className="text-3xl">{personaA.avatar}</span>
               <div>
                 <h3 className="font-bold text-blue-200">{personaA.name}</h3>
                 <div className="text-xs text-blue-400/60 uppercase">{t('totalScore', lang)}: {result.scores.A.total}</div>
               </div>
            </div>
            <ScoreBar label={t('logic', lang)} value={result.scores.A.logic} color="blue" />
            <ScoreBar label={t('evidence', lang)} value={result.scores.A.evidence} color="blue" />
            <ScoreBar label={t('novelty', lang)} value={result.scores.A.novelty} color="blue" />
            <p className="mt-4 text-xs text-blue-200/70 italic bg-blue-900/20 p-3 rounded-lg border border-blue-900/30">
              "{result.scores.A.comment}"
            </p>
          </div>

          {/* Side B */}
          <div className="p-6 bg-red-900/5">
            <div className="flex items-center gap-3 mb-6 flex-row-reverse md:flex-row">
               <div className="text-right md:text-left flex-1">
                 <h3 className="font-bold text-red-200">{personaB.name}</h3>
                 <div className="text-xs text-red-400/60 uppercase">{t('totalScore', lang)}: {result.scores.B.total}</div>
               </div>
               <span className="text-3xl">{personaB.avatar}</span>
            </div>
            <ScoreBar label={t('logic', lang)} value={result.scores.B.logic} color="red" />
            <ScoreBar label={t('evidence', lang)} value={result.scores.B.evidence} color="red" />
            <ScoreBar label={t('novelty', lang)} value={result.scores.B.novelty} color="red" />
             <p className="mt-4 text-xs text-red-200/70 italic bg-red-900/20 p-3 rounded-lg border border-red-900/30">
              "{result.scores.B.comment}"
            </p>
          </div>
        </div>

        <div className="p-4 bg-slate-900 flex justify-center">
          <button 
            onClick={onClose}
            className="px-8 py-3 bg-slate-100 text-slate-900 font-bold rounded-full hover:bg-white hover:scale-105 transition-all shadow-[0_0_20px_rgba(255,255,255,0.2)]"
          >
            {t('closeAnalysis', lang)}
          </button>
        </div>

      </div>
    </div>
  );
};