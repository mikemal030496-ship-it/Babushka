
import { GoogleGenAI, Type } from "@google/genai";

export const askBabushka = async (query: string, currentWord: string) => {
  // Always create a new instance to ensure environment variables are fresh
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `User is studying "${currentWord}". Question: "${query}"`,
      config: {
        systemInstruction: "You are a friendly and encouraging Russian grandmother (Babushka). Use a mix of English and small Russian phrases. Keep your response warm, cultural, and under 80 words.",
        temperature: 0.7,
      }
    });
    return response.text?.trim() || "I'm a bit tired today, dearie. Ask me again later!";
  } catch (error) {
    console.error("Babushka Chat Error:", error);
    return "The samovar is boiling over! I can't talk right now, dear. Check your connection!";
  }
};

export const generateDeck = async (topic: string) => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Generate exactly 20 high-quality Russian-English flashcards for the topic: "${topic}".`,
      config: {
        systemInstruction: "You are an expert Russian language teacher. Return a JSON array of flashcards. Each card must have 'f' (Russian word), 't' (English), 'p' (Pronunciation), and 'c' (short context sentence). Use only valid JSON.",
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              f: { type: Type.STRING, description: "Russian word or phrase" },
              t: { type: Type.STRING, description: "English translation" },
              p: { type: Type.STRING, description: "Phonetic transcription" },
              c: { type: Type.STRING, description: "Context or interesting fact" }
            },
            required: ["f", "t", "p", "c"]
          }
        }
      }
    });
    
    const jsonStr = response.text?.trim() || "[]";
    const data = JSON.parse(jsonStr);
    
    if (!Array.isArray(data) || data.length === 0) {
      throw new Error("Invalid format returned from AI");
    }
    
    return data;
  } catch (error) {
    console.error("Babushka Deck Gen Error:", error);
    throw error;
  }
};
