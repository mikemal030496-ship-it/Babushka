
import { GoogleGenAI, Type } from "@google/genai";

// Fix: Initialize GoogleGenAI strictly with the required named parameter and environment variable
const getAI = () => new GoogleGenAI({ apiKey: process.env.API_KEY });

export const askBabushka = async (query: string, currentWord: string) => {
  const ai = getAI();
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `User is learning Russian. Current word/topic: "${currentWord}". User asks: "${query}". 
      Respond as a friendly Russian grandmother (Babushka). Keep it encouraging and informative about language or culture. 
      Use a mix of English and small Russian phrases. Keep response under 100 words.`,
      config: {
        temperature: 0.8,
        topP: 0.9,
      }
    });
    // Fix: Access .text property directly (do not call as a function)
    return response.text || "I'm a bit tired today, dearie. Ask me again later!";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "The samovar is boiling over! I can't talk right now. (Error connection)";
  }
};

export const generateDeck = async (topic: string) => {
  const ai = getAI();
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Create a set of 20 Russian-English flashcards for the topic: "${topic}". 
      Each flashcard must include the Russian word (f), English translation (t), phonetic transcription (p), and a short usage context or interesting fact (c).`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              f: { type: Type.STRING, description: "Russian word/phrase" },
              t: { type: Type.STRING, description: "English translation" },
              p: { type: Type.STRING, description: "Phonetic pronunciation" },
              c: { type: Type.STRING, description: "Example sentence or context" }
            },
            required: ["f", "t", "p", "c"]
          }
        }
      }
    });
    // Fix: Access .text property directly and parse the JSON string result
    const jsonStr = response.text?.trim() || "[]";
    return JSON.parse(jsonStr);
  } catch (error) {
    console.error("Gemini Deck Generation Error:", error);
    throw error;
  }
};
