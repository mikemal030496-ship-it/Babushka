import { GoogleGenAI, Type } from "@google/genai";

export const askBabushka = async (query: string, currentWord: string) => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    console.error("API_KEY is missing from environment variables.");
    return "The samovar is empty, dearie! (API Key is missing in project settings).";
  }

  const ai = new GoogleGenAI({ apiKey });
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Current study word: "${currentWord}". Student asks: "${query}"`,
      config: {
        systemInstruction: "You are a warm, traditional Russian grandmother (Babushka). You love tea, your grandchildren, and teaching Russian culture. Respond in English with occasional Russian words. Keep it under 60 words.",
        temperature: 0.8,
      }
    });
    return response.text?.trim() || "My ears aren't what they used to be... can you repeat that?";
  } catch (error) {
    console.error("Babushka Chat Error:", error);
    return "My samovar is broken! Check your internet connection, dearie.";
  }
};

export const generateDeck = async (topic: string) => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    throw new Error("API_KEY_MISSING");
  }

  const ai = new GoogleGenAI({ apiKey });
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Create a Russian language learning unit about: "${topic}".`,
      config: {
        systemInstruction: "You are an expert Russian tutor. Generate exactly 15 high-quality flashcards. Return ONLY a JSON array. Each object must have 'f' (Russian), 't' (English), 'p' (Pronunciation), 'c' (Context/Fact).",
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
    console.error("Babushka Deck Generation Error:", error);
    throw error;
  }
};