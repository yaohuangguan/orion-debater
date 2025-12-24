import React from 'react';
import { Language } from '../types';
import { t } from '../utils/translations';

interface InputAreaProps {
  status: string;
  onStart: (topic: string) => void;
  onInterject: (text: string) => void;
  onPauseResume: () => void;
  onScore: () => void;
  isPaused: boolean;
  lang: Language;
  onWildcard?: () => void;
}

export const InputArea: React.FC<InputAreaProps> = ({ status, onStart, onInterject, onPauseResume, onScore, isPaused, lang, onWildcard }) => {
  const isDebating = status === 'debating' || status === 'paused';

  // If idle, don't show the bottom bar as the landing page handles start
  if (status === 'idle') return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 p-6 bg-slate-900/90 backdrop-blur-md border-t border-slate-700/50 z-20">
      <div className="max-w-4xl mx-auto flex items-center justify-center gap-6">
        {isDebating && (
          <>
            <button
              onClick={onPauseResume}
              className={`px-8 py-3 rounded-full flex items-center gap-2 transition-all font-bold uppercase tracking-wider text-sm ${
                isPaused 
                  ? 'bg-green-600 hover:bg-green-500 text-white shadow-[0_0_20px_rgba(22,163,74,0.4)]' 
                  : 'bg-slate-700 hover:bg-slate-600 text-slate-300'
              }`}
            >
              {isPaused ? (
                <>
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>
                  {t('resumeBtn', lang)}
                </>
              ) : (
                <>
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><rect x="6" y="4" width="4" height="16"></rect><rect x="14" y="4" width="4" height="16"></rect></svg>
                  {t('pauseBtn', lang)}
                </>
              )}
            </button>
            
            {onWildcard && (
              <button
                onClick={onWildcard}
                className="px-6 py-3 rounded-full bg-orange-600 hover:bg-orange-500 text-white shadow-[0_0_20px_rgba(234,88,12,0.4)] transition-all font-bold text-sm uppercase tracking-wider flex items-center gap-2"
                title={t('wildcard', lang)}
              >
                <span className="text-lg">🃏</span>
                <span className="hidden sm:inline">{t('wildcard', lang)}</span>
              </button>
            )}

            <button
              onClick={onScore}
              className="px-8 py-3 rounded-full bg-purple-600 hover:bg-purple-500 text-white shadow-[0_0_20px_rgba(147,51,234,0.4)] transition-all font-bold text-sm uppercase tracking-wider flex items-center gap-2"
            >
              <span className="text-lg">⚖️</span>
              {t('scoreBtn', lang)}
            </button>
          </>
        )}
      </div>
    </div>
  );
};