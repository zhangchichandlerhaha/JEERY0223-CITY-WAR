import { GoogleGenAI } from "@google/genai";

let aiInstance: any = null;

const getAI = () => {
  if (!aiInstance) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      // Return a mock or throw a descriptive error that can be caught
      console.warn("GEMINI_API_KEY is missing. AI features will be disabled.");
      return null;
    }
    aiInstance = new GoogleGenAI({ apiKey });
  }
  return aiInstance;
};

export const getGameIntro = async (language: 'zh' | 'en') => {
  const ai = getAI();
  if (!ai) return language === 'zh' ? "保卫你的城市，拦截落下的火箭！" : "Defend your cities, intercept the falling rockets!";

  const prompt = language === 'zh' 
    ? "为一款名为《JERRY新星防御》的塔防游戏写一段简短、热血的背景介绍。要求：100字以内。"
    : "Write a short, exciting background introduction for a tower defense game called 'JERRY Nova Defense'. Max 100 words.";
  
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
    });
    return response.text || (language === 'zh' ? "保卫你的城市，拦截落下的火箭！" : "Defend your cities, intercept the falling rockets!");
  } catch (error) {
    console.error("Error generating intro:", error);
    return language === 'zh' ? "保卫你的城市，拦截落下的火箭！" : "Defend your cities, intercept the falling rockets!";
  }
};
