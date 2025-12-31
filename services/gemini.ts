import { GoogleGenAI, Type, Modality } from "@google/genai";

export const askBabushka = async (query: string, currentWord: string) => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Current study word: "${currentWord}". Student asks: "${query}"`,
      config: {
        systemInstruction: "You are a mature, wise Russian man (Dedushka). You speak with authority, gravitas, and calm warmth. You are a respected patriarch who values discipline, tradition, and learning. Respond in clear English with occasional Russian terms. Avoid overly sweet or diminutive language. Keep responses concise and stoic (under 60 words).",
        temperature: 0.7,
      }
    });
    return response.text?.trim() || "My ears are not what they once were. Speak clearly.";
  } catch (error) {
    console.error("Assistant Chat Error:", error);
    return "The samovar is cold. I am preoccupied at the moment.";
  }
};

export const generateDeck = async (topic: string) => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Create a Russian language learning unit about: "${topic}".`,
      config: {
        systemInstruction: "You are a professional Russian linguist. Generate exactly 15 high-quality flashcards for a serious student. Return ONLY a JSON array. Each object must have 'f' (Russian), 't' (English), 'p' (Pronunciation), 'c' (Context/Fact).",
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              f: { type: Type.STRING, description: "Russian word/phrase" },
              t: { type: Type.STRING, description: "English translation" },
              p: { type: Type.STRING, description: "Phonetic pronunciation" },
              c: { type: Type.STRING, description: "Short cultural context or usage tip" }
            },
            required: ["f", "t", "p", "c"]
          }
        }
      }
    });
    
    const text = response.text;
    if (!text) throw new Error("Empty response from model");
    
    const data = JSON.parse(text.trim());
    if (!Array.isArray(data)) throw new Error("Response is not an array");
    
    return data;
  } catch (error) {
    console.error("Deck Generation Error:", error);
    throw error;
  }
};

export const speakRussian = async (text: string) => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text: `Speak this Russian phrase with a deep, mature, resonant, and authoritative bass-baritone male voice. You are a wise Russian patriarch. Use a slow, clear, and commanding pace. Phrase: ${text}` }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: 'Fenrir' },
          },
        },
      },
    });
    
    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    return base64Audio;
  } catch (error) {
    console.error("Voice Error:", error);
    return null;
  }
};