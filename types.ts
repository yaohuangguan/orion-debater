export type Language = 'en' | 'zh';

export type DebateTone = 'serious' | 'humorous' | 'aggressive' | 'academic';
export type DebateLength = 'short' | 'medium' | 'long';
export type JudgePersonality = 'impartial' | 'sarcastic' | 'harsh' | 'constructive';

export interface DebateConfig {
  tone: DebateTone;
  length: DebateLength;
  judge: JudgePersonality;
}

export interface User {
  id: string;
  displayName: string;
  email: string;
  phone?: string;
  role?: string;
}

export interface Persona {
  id: 'A' | 'B';
  name: string;
  role: string; // e.g., "Fundamentalist", "Quant"
  description: string;
  avatar: string; // Emoji or short string
  color: string; // Tailwind color class prefix (e.g., 'red', 'blue')
  style?: string; // Speaking style/quirk
}

export interface Message {
  id: string;
  senderId: 'A' | 'B' | 'User' | 'System' | 'Audience';
  text: string;
  timestamp: number;
  isThinking?: boolean;
}

export type DebateStatus = 'idle' | 'generating_personas' | 'debating' | 'paused' | 'finished' | 'scoring';

export interface DebateTopic {
  id: string;
  title: string;
  title_zh?: string;
  description: string;
  description_zh?: string;
  category: string;
  category_zh?: string;
}

export interface Score {
  logic: number;
  evidence: number;
  novelty: number;
  total: number;
  comment: string;
}

export interface MatchResult {
  scores: {
    A: Score;
    B: Score;
  };
  winner: 'A' | 'B' | 'Tie';
}

export interface DebateContext {
  topic: string;
  personas: {
    A: Persona | null;
    B: Persona | null;
  };
  messages: Message[];
  status: DebateStatus;
  turn: 'A' | 'B';
}