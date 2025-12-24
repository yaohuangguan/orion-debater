import React from 'react';

export const ThinkingIndicator: React.FC<{ color: string }> = ({ color }) => {
  const colorClass = color === 'blue' ? 'bg-blue-400' : 'bg-red-400';
  
  return (
    <div className={`flex items-center space-x-1 p-2 rounded-lg bg-opacity-20 max-w-[60px] ${color === 'blue' ? 'bg-blue-900/30' : 'bg-red-900/30'}`}>
      <div className={`w-2 h-2 rounded-full ${colorClass} typing-dot`}></div>
      <div className={`w-2 h-2 rounded-full ${colorClass} typing-dot`}></div>
      <div className={`w-2 h-2 rounded-full ${colorClass} typing-dot`}></div>
    </div>
  );
};