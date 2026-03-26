import { Persona, Message, MatchResult, Language, DebateConfig } from "../types";

const API_URL = "https://bananaboom-api-242273127238.asia-east1.run.app/api";

const fetchWithAuth = async (endpoint: string, data: any, token?: string) => {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  
  if (token) {
    headers['x-auth-token'] = token;
  }

  const res = await fetch(`${API_URL}/debater${endpoint}`, {
    method: 'POST',
    headers,
    body: JSON.stringify(data),
  });

  const json = await res.json();
  if (!res.ok) {
    throw new Error(json.msg || json.message || 'API request failed');
  }
  return json;
};

// Helper code removed as backend handles instruction generation and JSON cleaning

export const generatePersonas = async (topic: string, lang: Language, token?: string): Promise<{ A: Persona; B: Persona }> => {
  try {
    const res = await fetchWithAuth('/generate-personas', { topic, lang }, token);
    return res.data;
  } catch (error) {
    console.error("Error generating personas:", error);
    // Fallback if AI fails
    const isZh = lang === 'zh';
    return {
      A: { id: 'A', name: isZh ? '正方' : 'Proponent', role: isZh ? '支持者' : 'Supporter', description: 'Supports the topic', avatar: '⭕', color: 'blue', style: 'Standard' },
      B: { id: 'B', name: isZh ? '反方' : 'Opponent', role: isZh ? '反对者' : 'Skeptic', description: 'Opposes the topic', avatar: '❌', color: 'red', style: 'Standard' }
    };
  }
};

export const generateTurn = async (
  topic: string,
  currentPersona: Persona,
  opponentPersona: Persona,
  history: Message[],
  lang: Language,
  config: DebateConfig,
  modifier?: string,
  token?: string
): Promise<string> => {
  try {
    const res = await fetchWithAuth('/generate-turn', { 
      topic, 
      currentPersona, 
      opponentPersona, 
      history, 
      lang, 
      config, 
      modifier 
    }, token);
    return res.text;
  } catch (error) {
    console.error("Error generating turn:", error);
    return lang === 'zh' ? "稍微等一下，我在思考..." : "I need a moment to collect my thoughts...";
  }
};

export const generateSpeech = async (text: string, voiceName: string, token?: string): Promise<string | null> => {
  try {
    const res = await fetchWithAuth('/generate-speech', { text, voiceName }, token);
    return res.audioBase64;
  } catch (e) {
    console.error("TTS generation failed", e);
    return null;
  }
};

export const evaluateDebate = async (
  topic: string,
  history: Message[],
  lang: Language,
  config?: DebateConfig,
  token?: string
): Promise<MatchResult> => {
  try {
    const res = await fetchWithAuth('/evaluate', { topic, history, lang, config }, token);
    return res.data as MatchResult;
  } catch (e) {
    console.error("Evaluation failed", e);
    return {
      scores: {
        A: { logic: 0, evidence: 0, novelty: 0, total: 0, comment: "N/A" },
        B: { logic: 0, evidence: 0, novelty: 0, total: 0, comment: "N/A" }
      },
      winner: 'Tie'
    };
  }
};

export const generateAudienceComment = async (topic: string, lastMessage: string, lang: Language, token?: string): Promise<string> => {
  try {
    const res = await fetchWithAuth('/audience-comment', { topic, lastMessage, lang }, token);
    return res.text;
  } catch {
    return "";
  }
};