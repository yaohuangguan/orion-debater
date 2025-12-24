import React from 'react';
import { Message, Persona } from '../types';
import { ThinkingIndicator } from './ThinkingIndicator';

interface ChatMessageProps {
  message: Message;
  personaA: Persona | null;
  personaB: Persona | null;
}

export const ChatMessage: React.FC<ChatMessageProps> = ({ message, personaA, personaB }) => {
  const isUser = message.senderId === 'User';
  const isSystem = message.senderId === 'System';
  const isAudience = message.senderId === 'Audience';
  
  if (isSystem) {
    return (
      <div className="flex justify-center my-4 opacity-50 text-xs uppercase tracking-widest text-slate-400">
        <span>{message.text}</span>
      </div>
    );
  }

  if (isAudience) {
    return (
      <div className="flex justify-center my-2 animate-bounce-slight">
         <div className="bg-slate-800/60 text-slate-400 px-3 py-1 rounded-full text-xs font-mono border border-slate-700/50 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
            {message.text}
         </div>
      </div>
    );
  }

  if (isUser) {
    return (
      <div className="flex justify-center my-4">
        <div className="bg-amber-500/20 border border-amber-500/50 text-amber-200 px-4 py-2 rounded-full max-w-[80%] text-sm font-medium shadow-[0_0_15px_rgba(245,158,11,0.2)] backdrop-blur-sm">
          <span className="mr-2">🎤</span>
          {message.text}
        </div>
      </div>
    );
  }

  const isA = message.senderId === 'A';
  const persona = isA ? personaA : personaB;
  const align = isA ? 'justify-start' : 'justify-end';
  const bgColor = isA ? 'bg-blue-900/40 border-blue-700/50' : 'bg-red-900/40 border-red-700/50';
  const textColor = isA ? 'text-blue-100' : 'text-red-100';
  const bubbleRounded = isA ? 'rounded-tl-none' : 'rounded-tr-none';

  if (!persona) return null;

  return (
    <div className={`flex ${align} my-3 group px-4 md:px-0 animate-[slideUp_0.3s_ease-out]`}>
      {isA && (
        <div className="flex-shrink-0 mr-3 flex flex-col items-center">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-xl shadow-lg ring-2 ring-blue-500/30">
            {persona.avatar}
          </div>
        </div>
      )}

      <div className={`max-w-[75%] md:max-w-[60%] flex flex-col ${isA ? 'items-start' : 'items-end'}`}>
        <span className={`text-xs mb-1 opacity-70 ${isA ? 'text-blue-300 ml-1' : 'text-red-300 mr-1'}`}>
          {persona.name} • {persona.role}
        </span>
        
        {message.isThinking ? (
          <ThinkingIndicator color={persona.color} />
        ) : (
          <div className={`${bgColor} ${textColor} border p-3.5 rounded-2xl ${bubbleRounded} shadow-md backdrop-blur-sm text-sm md:text-base leading-relaxed`}>
            {message.text}
          </div>
        )}
      </div>

      {!isA && (
        <div className="flex-shrink-0 ml-3 flex flex-col items-center">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-red-500 to-pink-600 flex items-center justify-center text-xl shadow-lg ring-2 ring-red-500/30">
            {persona.avatar}
          </div>
        </div>
      )}
    </div>
  );
};