import { GoogleGenAI, Type, Modality } from "@google/genai";
import { Persona, Message, MatchResult, Language, DebateConfig } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const SYSTEM_INSTRUCTION_GENERATOR = `
You are an expert debate organizer and profiler. Your goal is to create two distinct, diametrically opposed personas based on a user-provided topic.
These personas should have conflicting worldviews, different speaking styles, specific backgrounds, hidden biases, and distinct voices (metaphorically).
One should be Pro (or side A) and one Con (or side B).
`;

const getDebaterInstruction = (config: DebateConfig) => {
  let toneInstruction = "";
  switch (config.tone) {
    case 'humorous':
      toneInstruction = "Be funny, sarcastic, and use witty analogies. It's okay to be slightly absurd.";
      break;
    case 'aggressive':
      toneInstruction = "Be intense, provocative, and attack the opponent's logic mercilessly. Use strong language.";
      break;
    case 'academic':
      toneInstruction = "Use formal language, cite theoretical frameworks, and focus on empirical evidence and logic. Be polite but rigorous.";
      break;
    case 'serious':
    default:
      toneInstruction = "Keep it professional, logical, and persuasive.";
      break;
  }

  let lengthInstruction = "";
  switch (config.length) {
    case 'short':
      lengthInstruction = "Keep your response extremely brief (under 30 words). Get straight to the point.";
      break;
    case 'long':
      lengthInstruction = "You can elaborate on your points (up to 120 words). Provide detailed examples.";
      break;
    case 'medium':
    default:
      lengthInstruction = "Keep your response concise (under 80 words).";
      break;
  }

  return `
You are a participant in a heated debate. 
You must stay strictly in character. 
${toneInstruction}
${lengthInstruction}
Do not be overly polite; this is a clash of ideas.
Use formatting like *emphasis* where appropriate.
`;
};

const getJudgeInstruction = (config: DebateConfig) => {
  let judgePersona = "";
  switch(config.judge || 'impartial') {
    case 'sarcastic':
      judgePersona = "You are a sarcastic, witty judge who roasts the participants while scoring them. Be mean but funny.";
      break;
    case 'harsh':
      judgePersona = "You are a strictly professional and very harsh judge. You hate logical fallacies and demand high standards. Give low scores if they fail.";
      break;
    case 'constructive':
      judgePersona = "You are a kind, teacher-like judge. Focus on growth and provide very constructive feedback.";
      break;
    case 'impartial':
    default:
      judgePersona = "You are an impartial, expert debate judge.";
      break;
  }

  return `
${judgePersona}
Analyze the conversation transcript provided.
Score both participants (Persona A and Persona B) on three criteria:
1. Logic (Logical consistency and reasoning)
2. Evidence (Use of examples, facts, or strong theoretical backing)
3. Novelty (Creativity of arguments and wit)
Scores should be out of 10.
Provide a one-sentence critique for each.
`;
};

// Helper to clean JSON string if markdown code blocks are present
const cleanJson = (text: string) => {
  let clean = text.trim();
  if (clean.startsWith('```json')) clean = clean.replace('```json', '');
  if (clean.startsWith('```')) clean = clean.replace('```', '');
  if (clean.endsWith('```')) clean = clean.slice(0, -3);
  return clean.trim();
};

export const generatePersonas = async (topic: string, lang: Language): Promise<{ A: Persona; B: Persona }> => {
  try {
    const langInstruction = lang === 'zh' ? "Provide names, roles, descriptions and styles in Chinese (Simplified)." : "Provide output in English.";
    
    const prompt = `
      Topic: "${topic}"
      
      Create two distinct personas to debate this topic.
      Persona A should generally support the affirmative or a specific dominant viewpoint.
      Persona B should support the negative or an opposing specific viewpoint.
      
      Ensure they have deep backgrounds. 
      
      CRITICAL: Assign a specific ARCHETYPE to each.
      Archetype Examples: 
      - The Doomer (Pessimistic, fatalistic)
      - The Futurist (Obsessed with tech progress)
      - The Traditionalist (Values old ways)
      - The Contrarian (Argues just to argue)
      - The Corporate Shill (Defends business interests)
      - The Academic (Pedantic, uses big words)
      - The Conspiracy Theorist (Connects unrelated dots)
      - The Compassionate Activist (Emotional appeal)
      
      Assign a unique 'style' (speaking style) that matches the archetype.
      
      ${langInstruction}
      
      Return strictly a JSON object with this structure:
      {
        "personaA": {
          "name": "Name",
          "role": "Short Title (e.g. Traditionalist)",
          "description": "Personality description including background and bias",
          "avatar": "Single Emoji",
          "style": "Speaking style description"
        },
        "personaB": {
          "name": "Name",
          "role": "Short Title",
          "description": "Personality description including background and bias",
          "avatar": "Single Emoji",
          "style": "Speaking style description"
        }
      }
    `;

    // Switch to gemini-3-flash-preview for speed
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION_GENERATOR,
        responseMimeType: "application/json"
      }
    });

    const text = response.text || "{}";
    const data = JSON.parse(cleanJson(text));

    return {
      A: { ...data.personaA, id: 'A', color: 'blue' },
      B: { ...data.personaB, id: 'B', color: 'red' }
    };

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
  modifier?: string
): Promise<string> => {
  
  // Convert history to a string format for context
  const conversationLog = history
    .filter(m => m.senderId !== 'System')
    .map(m => {
      if (m.senderId === 'User') return `[Audience Member Interjects]: ${m.text}`;
      if (m.senderId === 'Audience') return `[Audience Commentary]: ${m.text}`;
      const name = m.senderId === 'A' ? "Side A" : "Side B"; 
      return `[${name}]: ${m.text}`;
    })
    .join("\n");

  const langInstruction = lang === 'zh' ? "Respond in Chinese (Simplified) strictly." : "Respond in English strictly.";
  
  // Incorporate modifier if present (Wildcard feature)
  const interventionInstruction = modifier 
    ? `\n!!! SPECIAL INTERVENTION: The moderator has imposed a constraint: "${modifier}". YOU MUST OBEY THIS MODIFIER FOR THIS TURN ONLY. !!!\n` 
    : "";

  const prompt = `
    Current Debate Topic: "${topic}"
    
    You are acting as:
    Name: ${currentPersona.name}
    Role: ${currentPersona.role}
    Stance: ${currentPersona.description}
    Speaking Style: ${currentPersona.style}
    
    Your Opponent is:
    Name: ${opponentPersona.name}
    Role: ${opponentPersona.role}
    
    Conversation History:
    ${conversationLog}
    
    INSTRUCTIONS:
    - ${langInstruction}
    - Respond to the last message (or start the debate if history is empty).
    - If the last message was from the user (Audience Member), address their point while maintaining your stance against your opponent.
    - Be witty, sharp, and in-character. 
    - Do not repeat yourself.
    ${interventionInstruction}
  `;

  try {
    // Switch to gemini-3-flash-preview for faster turns
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        systemInstruction: getDebaterInstruction(config)
      }
    });

    return response.text || "...";
  } catch (error) {
    console.error("Error generating turn:", error);
    return lang === 'zh' ? "稍微等一下，我在思考..." : "I need a moment to collect my thoughts...";
  }
};

export const generateSpeech = async (text: string, voiceName: string): Promise<string | null> => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName },
          },
        },
      },
    });
    return response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data || null;
  } catch (e) {
    console.error("TTS generation failed", e);
    return null;
  }
};

export const evaluateDebate = async (
  topic: string,
  history: Message[],
  lang: Language,
  config?: DebateConfig
): Promise<MatchResult> => {
  const conversationLog = history
    .filter(m => ['A', 'B'].includes(m.senderId))
    .map(m => `[${m.senderId}]: ${m.text}`)
    .join("\n");

  const langInstruction = lang === 'zh' ? "Provide comments in Chinese (Simplified)." : "Provide comments in English.";

  const prompt = `
    Topic: ${topic}
    
    Transcript:
    ${conversationLog}
    
    Evaluate the performance of A and B. ${langInstruction} Return JSON only.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        systemInstruction: config ? getJudgeInstruction(config) : getJudgeInstruction({ tone: 'serious', length: 'medium', judge: 'impartial' }),
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            scores: {
              type: Type.OBJECT,
              properties: {
                A: {
                   type: Type.OBJECT,
                   properties: {
                     logic: { type: Type.INTEGER },
                     evidence: { type: Type.INTEGER },
                     novelty: { type: Type.INTEGER },
                     total: { type: Type.INTEGER },
                     comment: { type: Type.STRING }
                   }
                },
                B: {
                   type: Type.OBJECT,
                   properties: {
                     logic: { type: Type.INTEGER },
                     evidence: { type: Type.INTEGER },
                     novelty: { type: Type.INTEGER },
                     total: { type: Type.INTEGER },
                     comment: { type: Type.STRING }
                   }
                }
              }
            },
            winner: { type: Type.STRING, enum: ["A", "B", "Tie"] }
          }
        }
      }
    });
    
    const text = response.text || "{}";
    return JSON.parse(cleanJson(text)) as MatchResult;
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

export const generateAudienceComment = async (topic: string, lastMessage: string, lang: Language): Promise<string> => {
  // Simple, fast call for audience
  const langContext = lang === 'zh' ? "in Chinese (Simplified)" : "in English";
  try {
     const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Context: A debate about "${topic}". Last argument: "${lastMessage}". 
      Generate a very short (1-5 words) audience reaction ${langContext}. 
      Examples: "Agreed!", "What?", "No evidence!", "Exactly.", "Boo!", "Compelling point."`,
    });
    return response.text?.trim() || (lang === 'zh' ? "有意思..." : "Interesting...");
  } catch {
    return "";
  }
};