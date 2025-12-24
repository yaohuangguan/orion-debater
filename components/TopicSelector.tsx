import React from 'react';
import { TOPICS } from '../data/topics';
import { Language } from '../types';
import { t } from '../utils/translations';

interface TopicSelectorProps {
  onSelect: (topic: string) => void;
  lang: Language;
}

export const TopicSelector: React.FC<TopicSelectorProps> = ({ onSelect, lang }) => {
  return (
    <div className="w-full max-w-5xl mx-auto mt-8 px-4 animate-[fadeIn_0.5s_0.2s_ease-out_forwards]">
      <h3 className="text-slate-400 text-sm font-bold uppercase tracking-widest mb-4">{t('trending', lang)}</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {TOPICS.map((topic) => {
          const title = lang === 'zh' && topic.title_zh ? topic.title_zh : topic.title;
          const description = lang === 'zh' && topic.description_zh ? topic.description_zh : topic.description;
          const category = lang === 'zh' && topic.category_zh ? topic.category_zh : topic.category;

          return (
            <button
              key={topic.id}
              onClick={() => onSelect(title)}
              className="group relative text-left bg-slate-800/40 hover:bg-slate-800/80 border border-slate-700 hover:border-blue-500/50 rounded-xl p-5 transition-all duration-300 hover:scale-[1.02] hover:shadow-lg hover:shadow-blue-900/20 overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-transparent via-transparent to-blue-500/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <div className="flex justify-between items-start mb-2">
                <span className="text-[10px] font-mono text-blue-400 bg-blue-950/50 px-2 py-1 rounded border border-blue-900">{category}</span>
                <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-slate-500 group-hover:text-blue-400 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </div>
              <h4 className="font-bold text-slate-100 mb-1 group-hover:text-blue-200">{title}</h4>
              <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">{description}</p>
            </button>
          );
        })}
      </div>
    </div>
  );
};