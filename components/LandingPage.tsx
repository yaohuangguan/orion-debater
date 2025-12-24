import React, { useState } from 'react';
import { Language, DebateConfig, DebateTone, DebateLength, JudgePersonality, User } from '../types';
import { t } from '../utils/translations';
import { TopicSelector } from './TopicSelector';

interface LandingPageProps {
  onStart: (topic: string, config: DebateConfig) => void;
  lang: Language;
  setLang: (lang: Language) => void;
  onLoad: () => void;
  user: User | null;
  onOpenAuth: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onStart, lang, setLang, onLoad, user, onOpenAuth }) => {
  const [topic, setTopic] = useState('');
  const [tone, setTone] = useState<DebateTone>('serious');
  const [length, setLength] = useState<DebateLength>('medium');
  const [judge, setJudge] = useState<JudgePersonality>('impartial');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!topic.trim()) return;
    onStart(topic, { tone, length, judge });
  };

  const tones: DebateTone[] = ['serious', 'humorous', 'aggressive', 'academic'];
  const lengths: DebateLength[] = ['short', 'medium', 'long'];
  const judges: JudgePersonality[] = ['impartial', 'sarcastic', 'harsh', 'constructive'];

  return (
    <div className="h-full flex flex-col items-center justify-start overflow-y-auto pb-24 scroll-smooth">
      
      {/* Hero Section */}
      <div className="w-full max-w-4xl mx-auto p-8 pt-12 animate-[fadeIn_0.5s_ease-out_forwards] flex flex-col items-center">
        <div className="w-20 h-20 mb-6 rounded-2xl bg-gradient-to-tr from-slate-800 to-slate-700 flex items-center justify-center shadow-2xl shadow-blue-900/20 ring-1 ring-white/10">
          <span className="text-4xl">⚡️</span>
        </div>
        <h2 className="text-3xl md:text-5xl font-bold mb-4 text-white text-center bg-clip-text text-transparent bg-gradient-to-r from-white via-blue-200 to-slate-400">
          {t('sparkConflict', lang)}
        </h2>
        <p className="text-slate-400 max-w-lg mx-auto leading-relaxed text-center text-sm md:text-base">
          {t('introText', lang)}
        </p>

        {/* Global Controls */}
        <div className="flex gap-4 mt-6">
           <button 
             onClick={onLoad} 
             className="px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-slate-300 text-sm transition-colors border border-slate-700"
           >
             {t('load', lang)}
           </button>
           <div className="bg-slate-800 p-1 rounded-lg border border-slate-700 flex">
             <button 
               onClick={() => setLang('en')} 
               className={`px-3 py-1 rounded text-xs font-bold transition-colors ${lang === 'en' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:text-white'}`}
             >
               EN
             </button>
             <button 
               onClick={() => setLang('zh')} 
               className={`px-3 py-1 rounded text-xs font-bold transition-colors ${lang === 'zh' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:text-white'}`}
             >
               中文
             </button>
           </div>
        </div>
      </div>

      {/* Info Cards - Moved to Top */}
      <div className="w-full max-w-4xl mx-auto px-4 grid md:grid-cols-2 gap-4 animate-[fadeIn_0.5s_ease-out_0.2s_both]">
        <div className="bg-slate-800/40 border border-slate-700/50 rounded-lg p-4 hover:bg-slate-800/60 transition-colors">
          <h3 className="text-sm font-bold text-white mb-2 flex items-center gap-2 uppercase tracking-wide">
            <span className="text-lg">🛠</span> {t('howToUse', lang)}
          </h3>
          <ul className="text-xs text-slate-400 space-y-1">
            <li>{t('howToUse1', lang)}</li>
            <li>{t('howToUse2', lang)}</li>
            <li>{t('howToUse3', lang)}</li>
          </ul>
        </div>

        <div className="bg-slate-800/40 border border-slate-700/50 rounded-lg p-4 hover:bg-slate-800/60 transition-colors">
          <h3 className="text-sm font-bold text-white mb-2 flex items-center gap-2 uppercase tracking-wide">
             <span className="text-lg">💡</span> {t('whatIsThis', lang)}
          </h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            {t('whatIsThisDesc', lang)}
          </p>
        </div>
      </div>

      {/* Auth Banner */}
      {!user && (
        <div className="w-full max-w-2xl px-4 mt-6 animate-[slideUp_0.3s_ease-out]">
          <div 
            onClick={onOpenAuth}
            className="bg-gradient-to-r from-blue-900/40 to-purple-900/40 border border-blue-500/30 rounded-xl p-3 flex items-center justify-between cursor-pointer hover:border-blue-400/50 transition-all group"
          >
            <div className="flex items-center gap-3">
              <span className="text-xl bg-blue-500/20 w-8 h-8 rounded-full flex items-center justify-center text-blue-300">🔓</span>
              <span className="text-sm text-blue-100 font-medium group-hover:text-white">{t('encourageLogin', lang)}</span>
            </div>
            <span className="text-xs bg-blue-600 text-white px-3 py-1 rounded-full font-bold shadow-lg shadow-blue-900/50 group-hover:bg-blue-500">{t('register', lang)}</span>
          </div>
        </div>
      )}

      {/* Configuration & Input Section */}
      <div className="w-full max-w-2xl px-4 mt-6 animate-[slideUp_0.4s_ease-out_0.1s_both]">
         <div className="bg-slate-900/50 backdrop-blur-sm border border-slate-700/50 rounded-2xl p-6 shadow-xl">
            <h3 className="text-sm font-bold uppercase tracking-widest text-slate-500 mb-4">{t('configSection', lang)}</h3>
            
            {/* Config Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              
              {/* Tone */}
              <div>
                <label className="block text-xs text-slate-400 mb-2">{t('toneLabel', lang)}</label>
                <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
                  {tones.map((tne) => (
                    <button
                      key={tne}
                      onClick={() => setTone(tne)}
                      className={`px-3 py-2 rounded-lg text-xs font-medium border transition-all whitespace-nowrap flex-1 ${
                        tone === tne 
                          ? 'bg-blue-600 border-blue-500 text-white shadow-md' 
                          : 'bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-700'
                      }`}
                    >
                      {t(`tone${tne.charAt(0).toUpperCase() + tne.slice(1)}` as any, lang)}
                    </button>
                  ))}
                </div>
              </div>

              {/* Length */}
              <div>
                <label className="block text-xs text-slate-400 mb-2">{t('lengthLabel', lang)}</label>
                 <div className="flex gap-2">
                  {lengths.map((len) => (
                    <button
                      key={len}
                      onClick={() => setLength(len)}
                      className={`px-3 py-2 rounded-lg text-xs font-medium border transition-all whitespace-nowrap flex-1 ${
                        length === len 
                          ? 'bg-blue-600 border-blue-500 text-white shadow-md' 
                          : 'bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-700'
                      }`}
                    >
                      {t(`length${len.charAt(0).toUpperCase() + len.slice(1)}` as any, lang)}
                    </button>
                  ))}
                </div>
              </div>

               {/* Judge */}
              <div className="md:col-span-2">
                <label className="block text-xs text-slate-400 mb-2">{t('judgeLabel', lang)}</label>
                 <div className="flex gap-2 overflow-x-auto no-scrollbar">
                  {judges.map((jdg) => (
                    <button
                      key={jdg}
                      onClick={() => setJudge(jdg)}
                      className={`px-3 py-2 rounded-lg text-xs font-medium border transition-all whitespace-nowrap flex-1 ${
                        judge === jdg 
                          ? 'bg-purple-600 border-purple-500 text-white shadow-md' 
                          : 'bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-700'
                      }`}
                    >
                      {t(`judge${jdg.charAt(0).toUpperCase() + jdg.slice(1)}` as any, lang)}
                    </button>
                  ))}
                </div>
              </div>

            </div>

            <form onSubmit={handleSubmit} className="relative mt-6">
              <input
                type="text"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder={t('topicPlaceholder', lang)}
                className="w-full bg-slate-950 text-white border border-slate-700 rounded-xl py-4 px-5 pr-14 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder-slate-600 transition-all shadow-inner text-lg"
              />
              <button
                type="submit"
                disabled={!topic.trim()}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-500 disabled:opacity-50 disabled:hover:bg-blue-600 transition-all shadow-lg"
              >
                 <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
              </button>
            </form>
         </div>
      </div>

      <TopicSelector onSelect={(t) => onStart(t, { tone, length, judge })} lang={lang} />

      <footer className="mt-16 text-xs text-slate-600 text-center pb-8">
        Powered by Google Gemini 2.0 Flash & Pro
      </footer>
    </div>
  );
};