import React, { useState, useEffect, useRef } from 'react';
import { Persona, Message, DebateStatus, MatchResult, Language, DebateConfig, User } from './types';
import { generatePersonas, generateTurn, evaluateDebate, generateAudienceComment, generateSpeech } from './services/geminiService';
import { authService, AuthResponse } from './services/authService';
import { ChatMessage } from './components/ChatMessage';
import { InputArea } from './components/InputArea';
import { LandingPage } from './components/LandingPage';
import { LiveBar } from './components/LiveBar';
import { ScoreModal } from './components/ScoreModal';
import { AuthModal } from './components/AuthModal';
import { t } from './utils/translations';

// Helper to decode raw PCM data from Gemini TTS
// Gemini returns 24kHz, 1 channel, 16-bit PCM (Linear16)
const decodePCM = (base64Data: string, ctx: AudioContext): AudioBuffer => {
  const binaryString = atob(base64Data);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  
  const sampleRate = 24000;
  const numChannels = 1;
  
  // Create Int16Array from the Uint8Array buffer
  // We need to ensure we are reading 16-bit integers
  const dataInt16 = new Int16Array(bytes.buffer);
  const frameCount = dataInt16.length / numChannels;
  
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      // Normalize 16-bit integer to float [-1.0, 1.0]
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  
  return buffer;
};

function App() {
  // State
  const [topic, setTopic] = useState('');
  const [status, setStatus] = useState<DebateStatus>('idle');
  const [personaA, setPersonaA] = useState<Persona | null>(null);
  const [personaB, setPersonaB] = useState<Persona | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [turn, setTurn] = useState<'A' | 'B'>('A');
  const [isPaused, setIsPaused] = useState(false);
  const [lang, setLang] = useState<Language>('en');
  const [config, setConfig] = useState<DebateConfig>({ tone: 'serious', length: 'medium', judge: 'impartial' });
  const [voteA, setVoteA] = useState(50);
  const [voteB, setVoteB] = useState(50);
  const [matchResult, setMatchResult] = useState<MatchResult | null>(null);
  const [notification, setNotification] = useState<string | null>(null);

  // Auth State
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isAuthModalOpen, setAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [isLimitReached, setIsLimitReached] = useState(false);

  // Audio State
  const [isMuted, setIsMuted] = useState(false);
  const audioContextRef = useRef<AudioContext | null>(null);
  const audioQueueRef = useRef<string[]>([]);
  const isPlayingRef = useRef(false);

  // Wildcard State
  const [nextTurnModifier, setNextTurnModifier] = useState<string | null>(null);

  const chatContainerRef = useRef<HTMLDivElement>(null);
  const processingRef = useRef(false);

  // Check LocalStorage for Auth on mount
  useEffect(() => {
    const storedUser = localStorage.getItem('debater_user');
    const storedToken = localStorage.getItem('debater_token');
    if (storedUser && storedToken) {
      setUser(JSON.parse(storedUser));
      setToken(storedToken);
    }
  }, []);

  // Auto-scroll
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTo({
        top: chatContainerRef.current.scrollHeight,
        behavior: 'smooth'
      });
    }
  }, [messages, status]);

  // Audio Queue Management
  useEffect(() => {
    if (isMuted) return;

    const playNext = async () => {
      if (isPlayingRef.current || audioQueueRef.current.length === 0) return;

      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }

      if (audioContextRef.current.state === 'suspended') {
        await audioContextRef.current.resume();
      }

      isPlayingRef.current = true;
      const base64Data = audioQueueRef.current.shift();

      if (base64Data) {
        try {
          // Use manual PCM decoding instead of native decodeAudioData
          const audioBuffer = decodePCM(base64Data, audioContextRef.current);
          
          const source = audioContextRef.current.createBufferSource();
          source.buffer = audioBuffer;
          source.connect(audioContextRef.current.destination);
          
          source.onended = () => {
            isPlayingRef.current = false;
            playNext(); // Play next in queue
          };

          source.start();
        } catch (e) {
          console.error("Error playing audio", e);
          isPlayingRef.current = false;
          playNext();
        }
      } else {
        isPlayingRef.current = false;
      }
    };

    // Check queue more frequently for smoother playback
    const interval = setInterval(playNext, 100);
    return () => clearInterval(interval);
  }, [isMuted]);

  // Color Mapping
  const getColorHex = (colorName: string | undefined, defaultColor: string) => {
    const map: Record<string, string> = {
      blue: '#3b82f6',
      red: '#ef4444',
      green: '#22c55e',
      purple: '#a855f7',
      amber: '#f59e0b',
      cyan: '#06b6d4',
      pink: '#ec4899',
    };
    return colorName && map[colorName] ? map[colorName] : defaultColor;
  };

  const colorA = getColorHex(personaA?.color, '#3b82f6');
  const colorB = getColorHex(personaB?.color, '#ef4444');

  // Auth Handlers
  const handleAuthSuccess = (res: AuthResponse) => {
    setUser(res.user);
    setToken(res.token);
    localStorage.setItem('debater_user', JSON.stringify(res.user));
    localStorage.setItem('debater_token', res.token);
    showNotification(t('loginSuccess', lang));
    
    // Resume game if it was paused due to limit
    if (isLimitReached) {
      setIsLimitReached(false);
      setIsPaused(false); // Resume debate
    }
  };

  const handleLogout = () => {
    if (token) authService.logout(token);
    setUser(null);
    setToken(null);
    localStorage.removeItem('debater_user');
    localStorage.removeItem('debater_token');
    // If debating and limit was exceeded, it will trigger again on next effect
  };

  const handleStart = async (newTopic: string, newConfig: DebateConfig) => {
    setTopic(newTopic);
    setConfig(newConfig);
    setStatus('generating_personas');
    setMessages([]);
    setVoteA(50);
    setVoteB(50);
    setMatchResult(null);
    setIsLimitReached(false);
    audioQueueRef.current = []; // Clear audio queue
    
    // Init Audio Context on user action
    if (!audioContextRef.current) {
       audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    
    setMessages([{ 
      id: 'sys-init', 
      senderId: 'System', 
      text: lang === 'zh' ? `正在分析话题: "${newTopic}"...` : `Analysing topic: "${newTopic}"...`, 
      timestamp: Date.now() 
    }]);

    try {
      const { A, B } = await generatePersonas(newTopic, lang);
      setPersonaA(A);
      setPersonaB(B);
      
      setMessages(prev => [
        ...prev, 
        { 
          id: 'sys-match', 
          senderId: 'System', 
          text: lang === 'zh' ? `匹配成功: ${A.name} vs ${B.name}` : `Match Found: ${A.name} (${A.role}) vs ${B.name} (${B.role})`, 
          timestamp: Date.now() 
        }
      ]);
      
      setStatus('debating');
      setTurn('A');
    } catch (error) {
      console.error(error);
      setMessages(prev => [...prev, { id: 'sys-err', senderId: 'System', text: "Failed to initialize debate.", timestamp: Date.now() }]);
      setStatus('idle');
    }
  };

  const handleInterject = (text: string) => {
    // Deprecated via UI removal, but kept for logic
    setMessages(prev => [
      ...prev,
      { id: `user-${Date.now()}`, senderId: 'User', text, timestamp: Date.now() }
    ]);
  };
  
  const handleWildcard = () => {
    const modifiers = [
      "Speak in rhymes",
      "Switch sides (argue the opponent's point)",
      "Speak like a pirate",
      "Use heavy Gen Z slang",
      "Act incredibly paranoid",
      "Speak in haiku",
      "Address the audience directly and break the fourth wall",
      "Use metaphors involving food only",
      "Shout (USE CAPS LOCK)"
    ];
    const randomMod = modifiers[Math.floor(Math.random() * modifiers.length)];
    setNextTurnModifier(randomMod);
    setMessages(prev => [...prev, {
      id: `wild-${Date.now()}`,
      senderId: 'System',
      text: `${t('wildcardTriggered', lang)} "${randomMod}"`,
      timestamp: Date.now()
    }]);
  };
  
  const handleScore = async () => {
    if (!personaA || !personaB) return;
    setIsPaused(true);
    const loadingId = `eval-${Date.now()}`;
    setMessages(prev => [...prev, { id: loadingId, senderId: 'System', text: t('analyzing', lang), timestamp: Date.now() }]);
    // Pass config to evaluateDebate to use judge personality
    const result = await evaluateDebate(topic, messages, lang, config);
    setMatchResult(result);
    setMessages(prev => prev.filter(m => m.id !== loadingId));
  };
  
  const handleVote = (side: 'A' | 'B') => {
    if (side === 'A') setVoteA(prev => prev + 1);
    else setVoteB(prev => prev + 1);
  };

  const handleSave = () => {
    const stateToSave = { topic, status, personaA, personaB, messages, turn, voteA, voteB, matchResult, lang, config };
    localStorage.setItem('the_debater_save', JSON.stringify(stateToSave));
    showNotification(t('saveSuccess', lang));
  };

  const handleLoad = () => {
    const saved = localStorage.getItem('the_debater_save');
    if (saved) {
      try {
        const data = JSON.parse(saved);
        setTopic(data.topic);
        setStatus(data.status);
        setPersonaA(data.personaA);
        setPersonaB(data.personaB);
        setMessages(data.messages);
        setTurn(data.turn);
        setVoteA(data.voteA);
        setVoteB(data.voteB);
        setMatchResult(data.matchResult);
        if (data.lang) setLang(data.lang);
        if (data.config) setConfig(data.config);
        showNotification(t('loadSuccess', lang));
        setIsPaused(true);
      } catch (e) {
        console.error("Failed to load", e);
      }
    } else {
      showNotification(t('noSave', lang));
    }
  };

  const showNotification = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 2000);
  };

  // Main Debate Loop
  useEffect(() => {
    if (status !== 'debating' || isPaused || processingRef.current) return;
    if (!personaA || !personaB) return;

    // Guest Limit Check
    if (!user) {
      const aiTurnCount = messages.filter(m => m.senderId === 'A' || m.senderId === 'B').length;
      if (aiTurnCount >= 10) {
        setIsPaused(true);
        setIsLimitReached(true);
        setAuthModalOpen(true);
        setAuthMode('login');
        return;
      }
    }

    const executeTurn = async () => {
      processingRef.current = true;
      const currentPersona = turn === 'A' ? personaA : personaB;
      const opponentPersona = turn === 'A' ? personaB : personaA;
      
      const thinkingId = `thinking-${Date.now()}`;
      setMessages(prev => [...prev, { id: thinkingId, senderId: turn, text: '', timestamp: Date.now(), isThinking: true }]);

      try {
        // Use modifier if one is set, then clear it
        const modifierToUse = nextTurnModifier;
        if (nextTurnModifier) setNextTurnModifier(null);

        const text = await generateTurn(topic, currentPersona, opponentPersona, messages, lang, config, modifierToUse || undefined);
        
        // Trigger TTS if not muted
        if (!isMuted) {
           // Side A gets 'Puck', Side B gets 'Kore' (Example distinction)
           const voice = turn === 'A' ? 'Puck' : 'Kore';
           generateSpeech(text, voice).then(audioData => {
             if (audioData) {
               audioQueueRef.current.push(audioData);
             }
           });
        }

        setMessages(prev => prev.filter(m => m.id !== thinkingId).concat({
          id: `msg-${Date.now()}`,
          senderId: turn,
          text: text,
          timestamp: Date.now()
        }));
        
        if (Math.random() < 0.2) {
           const reaction = await generateAudienceComment(topic, text, lang);
           if (reaction) {
             setMessages(prev => [...prev, { id: `aud-${Date.now()}`, senderId: 'Audience', text: reaction, timestamp: Date.now() }]);
             if (Math.random() > 0.5) {
                if (turn === 'A') setVoteA(v => v + 2);
                else setVoteB(v => v + 2);
             }
           }
        }
        setTurn(prev => prev === 'A' ? 'B' : 'A');
      } catch (error) {
        console.error("Turn generation failed", error);
      } finally {
        processingRef.current = false;
      }
    };

    const timer = setTimeout(executeTurn, 1000);
    return () => clearTimeout(timer);

  }, [status, turn, isPaused, personaA, personaB, topic, messages, lang, config, user, isMuted, nextTurnModifier]);

  return (
    <div className="flex flex-col h-screen bg-slate-950 text-slate-200 font-sans selection:bg-blue-500/30 overflow-hidden relative">
      
      {/* Dynamic Background */}
      <div className="fixed inset-0 pointer-events-none transition-colors duration-1000 ease-in-out">
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full opacity-10 blur-[100px] transition-all duration-1000" style={{ backgroundColor: colorA }}></div>
        <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] rounded-full opacity-10 blur-[100px] transition-all duration-1000" style={{ backgroundColor: colorB }}></div>
      </div>

      {/* Header */}
      <header className="flex-none p-4 border-b border-slate-800/60 bg-slate-900/50 backdrop-blur-md flex justify-between items-center z-10 shadow-lg h-16">
        <div className="flex items-center gap-2 cursor-pointer" onClick={() => setStatus('idle')}>
          <div className="w-8 h-8 rounded-lg flex items-center justify-center font-bold text-white shadow-lg transition-all duration-500" style={{ background: `linear-gradient(to top right, ${colorA}, ${colorB})` }}>D</div>
          <h1 className="hidden sm:block font-bold text-lg tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">{t('appTitle', lang)}</h1>
        </div>
        
        <div className="flex items-center gap-2">
           {status !== 'idle' && (
             <>
                {/* Audio Toggle */}
                <button 
                  onClick={() => setIsMuted(!isMuted)}
                  className={`p-2 rounded-full transition-colors mr-2 ${isMuted ? 'text-slate-500 hover:text-slate-400' : 'text-blue-400 hover:text-blue-300 bg-blue-900/20'}`}
                  title={isMuted ? t('unmute', lang) : t('mute', lang)}
                >
                  {isMuted ? (
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><line x1="23" y1="9" x2="17" y2="15"></line><line x1="17" y1="9" x2="23" y2="15"></line></svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"></path></svg>
                  )}
                </button>

               <button onClick={handleSave} className="text-xs px-3 py-1 bg-slate-800 hover:bg-slate-700 rounded text-slate-300 transition-colors">{t('save', lang)}</button>
               <div className="hidden sm:block text-xs font-mono px-3 py-1 rounded-full bg-slate-800 border border-slate-700 text-slate-400 truncate max-w-[150px]">{topic}</div>
               <button onClick={() => setLang(l => l === 'en' ? 'zh' : 'en')} className="ml-2 w-8 h-8 flex items-center justify-center rounded-full bg-slate-800 hover:bg-slate-700 text-xs font-bold transition-colors">{lang === 'en' ? 'CN' : 'EN'}</button>
             </>
           )}
           
           {user ? (
             <div className="flex items-center gap-3 ml-4 pl-4 border-l border-slate-700">
               <div className="text-xs text-right hidden md:block">
                 <div className="text-white font-bold">{user.displayName}</div>
                 <div className="text-slate-500">{user.email}</div>
               </div>
               <button onClick={handleLogout} className="text-xs text-red-400 hover:text-red-300 font-bold">{t('logout', lang)}</button>
             </div>
           ) : (
             <button 
               onClick={() => { setAuthMode('login'); setAuthModalOpen(true); }}
               className="ml-4 bg-blue-600 hover:bg-blue-500 text-white text-xs px-4 py-2 rounded-lg font-bold transition-colors shadow-lg shadow-blue-900/30"
             >
               {t('login', lang)}
             </button>
           )}
        </div>
      </header>

      {/* Main Arena */}
      <main className="flex-1 overflow-hidden relative flex flex-col">
        {status !== 'idle' && personaA && personaB && (
           <LiveBar voteA={voteA} voteB={voteB} onVote={handleVote} personaAColor={personaA.color} personaBColor={personaB.color} lang={lang} />
        )}

        {status !== 'idle' && personaA && personaB && (
          <div className="flex-none flex justify-between px-4 pt-14 pb-2 bg-gradient-to-r from-slate-900/50 via-transparent to-slate-900/50 border-b border-white/5 relative z-0">
             <div className="flex items-center gap-2 animate-fade-in-left transition-colors duration-500" style={{ color: colorA }}>
                <span className="text-3xl filter drop-shadow-lg">{personaA.avatar}</span>
                <div className="hidden md:block">
                  <div className="font-bold text-sm leading-tight text-slate-200">{personaA.name}</div>
                  <div className="text-[10px] opacity-70 uppercase tracking-wider" style={{ color: colorA }}>{personaA.role}</div>
                </div>
             </div>
             <div className="flex items-center gap-2 text-right animate-fade-in-right transition-colors duration-500" style={{ color: colorB }}>
                <div className="hidden md:block">
                  <div className="font-bold text-sm leading-tight text-slate-200">{personaB.name}</div>
                  <div className="text-[10px] opacity-70 uppercase tracking-wider" style={{ color: colorB }}>{personaB.role}</div>
                </div>
                <span className="text-3xl filter drop-shadow-lg">{personaB.avatar}</span>
             </div>
          </div>
        )}

        <div ref={chatContainerRef} className="flex-1 overflow-y-auto p-4 pb-32 space-y-4 scroll-smooth no-scrollbar">
          {status === 'idle' ? (
             <LandingPage 
                onStart={handleStart} 
                lang={lang} 
                setLang={setLang}
                onLoad={handleLoad}
                user={user}
                onOpenAuth={() => { setAuthMode('register'); setAuthModalOpen(true); }}
             />
          ) : (
            <>
              {status === 'generating_personas' && (
                <div className="h-full flex flex-col items-center justify-center pb-20">
                  <div className="relative">
                    <div className="absolute inset-0 bg-blue-500 blur-xl opacity-20 animate-pulse"></div>
                    <div className="w-16 h-16 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin"></div>
                  </div>
                  <p className="mt-6 text-blue-300 font-medium animate-pulse">{t('constructing', lang)}</p>
                </div>
              )}

              {messages.map((msg) => (
                <ChatMessage key={msg.id} message={msg} personaA={personaA} personaB={personaB} />
              ))}
              
              {/* Limit reached indicator inside chat */}
              {isLimitReached && (
                <div className="flex justify-center my-8">
                  <div className="bg-slate-900 border border-slate-700 p-4 rounded-xl text-center max-w-sm shadow-2xl">
                    <div className="text-2xl mb-2">🔒</div>
                    <h3 className="text-white font-bold mb-1">{t('limitReached', lang)}</h3>
                    <p className="text-slate-400 text-sm mb-4">{t('limitReachedDesc', lang)}</p>
                    <button 
                      onClick={() => { setAuthMode('login'); setAuthModalOpen(true); }}
                      className="bg-blue-600 text-white px-6 py-2 rounded-full font-bold text-sm hover:bg-blue-500 transition-colors"
                    >
                      {t('loginToUnlock', lang)}
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {isPaused && status === 'debating' && !isLimitReached && (
           <div className="absolute top-20 left-1/2 -translate-x-1/2 bg-yellow-500/10 border border-yellow-500/20 text-yellow-500 px-4 py-1 rounded-full text-xs font-bold uppercase tracking-widest backdrop-blur-sm shadow-lg animate-pulse">
             {t('paused', lang)}
           </div>
        )}
        
        {notification && (
          <div className="absolute bottom-24 left-1/2 -translate-x-1/2 bg-slate-800 text-white px-4 py-2 rounded-lg shadow-xl animate-[slideUp_0.2s_ease-out] text-sm font-medium z-30">
            {notification}
          </div>
        )}
      </main>

      {matchResult && personaA && personaB && (
        <ScoreModal result={matchResult} personaA={personaA} personaB={personaB} onClose={() => setMatchResult(null)} lang={lang} />
      )}
      
      <AuthModal 
        isOpen={isAuthModalOpen} 
        onClose={() => !isLimitReached && setAuthModalOpen(false)} 
        onSuccess={handleAuthSuccess}
        lang={lang}
        initialMode={authMode}
        forced={isLimitReached}
      />

      <InputArea 
        status={status} 
        onStart={(t) => handleStart(t, config)} 
        onInterject={handleInterject}
        onPauseResume={() => setIsPaused(!isPaused)}
        onScore={handleScore}
        isPaused={isPaused}
        lang={lang}
        onWildcard={handleWildcard}
      />
    </div>
  );
}

export default App;