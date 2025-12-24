import React, { useState } from 'react';
import { Language } from '../types';
import { t } from '../utils/translations';
import { authService, AuthResponse } from '../services/authService';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (auth: AuthResponse) => void;
  lang: Language;
  initialMode?: 'login' | 'register';
  forced?: boolean;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, onSuccess, lang, initialMode = 'login', forced = false }) => {
  const [mode, setMode] = useState<'login' | 'register'>(initialMode);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConf, setPasswordConf] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [phone, setPhone] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      let response: AuthResponse;
      if (mode === 'login') {
        response = await authService.login({ email, password });
      } else {
        response = await authService.register({ 
          displayName, 
          email, 
          password, 
          passwordConf,
          phone 
        });
      }
      onSuccess(response);
      onClose();
    } catch (err: any) {
      setError(err.message || "An unknown error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-sm animate-[fadeIn_0.2s_ease-out]">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-md rounded-2xl shadow-2xl overflow-hidden animate-[scaleIn_0.3s_ease-out]">
        
        {/* Header Tabs */}
        <div className="flex border-b border-slate-700">
          <button 
            onClick={() => { setMode('login'); setError(null); }}
            className={`flex-1 py-4 text-sm font-bold uppercase tracking-wider transition-colors ${mode === 'login' ? 'bg-slate-800 text-blue-400' : 'text-slate-500 hover:text-slate-300'}`}
          >
            {t('login', lang)}
          </button>
          <button 
             onClick={() => { setMode('register'); setError(null); }}
            className={`flex-1 py-4 text-sm font-bold uppercase tracking-wider transition-colors ${mode === 'register' ? 'bg-slate-800 text-blue-400' : 'text-slate-500 hover:text-slate-300'}`}
          >
            {t('register', lang)}
          </button>
        </div>

        <div className="p-8">
           {forced && (
             <div className="mb-6 p-3 bg-yellow-900/20 border border-yellow-700/50 rounded-lg text-yellow-200 text-xs text-center">
               {t('limitReachedDesc', lang)}
             </div>
           )}

           <form onSubmit={handleSubmit} className="space-y-4">
              
              {mode === 'register' && (
                <div>
                  <label className="block text-xs text-slate-400 mb-1">{t('displayName', lang)}</label>
                  <input 
                    type="text" 
                    value={displayName}
                    onChange={e => setDisplayName(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-blue-500 outline-none"
                    required
                  />
                </div>
              )}

              <div>
                <label className="block text-xs text-slate-400 mb-1">{t('email', lang)}</label>
                <input 
                  type="text" 
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-blue-500 outline-none"
                  required
                />
              </div>

              {mode === 'register' && (
                <div>
                  <label className="block text-xs text-slate-400 mb-1">{t('phone', lang)}</label>
                  <input 
                    type="text" 
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs text-slate-400 mb-1">{t('password', lang)}</label>
                <input 
                  type="password" 
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-blue-500 outline-none"
                  required
                />
              </div>

              {mode === 'register' && (
                <div>
                  <label className="block text-xs text-slate-400 mb-1">{t('confirmPassword', lang)}</label>
                  <input 
                    type="password" 
                    value={passwordConf}
                    onChange={e => setPasswordConf(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-blue-500 outline-none"
                    required
                  />
                </div>
              )}

              {error && (
                <div className="text-red-400 text-xs text-center">{error}</div>
              )}

              <button 
                type="submit" 
                disabled={loading}
                className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-lg transition-colors disabled:opacity-50"
              >
                {loading ? t('thinking', lang) : (mode === 'login' ? t('login', lang) : t('register', lang))}
              </button>
           </form>
           
           {!forced && (
             <button onClick={onClose} className="w-full mt-4 text-xs text-slate-500 hover:text-slate-300">
               Cancel
             </button>
           )}
        </div>
      </div>
    </div>
  );
};