import { GoogleGenAI } from "@google/genai";

// NOTE: In a real app, never expose keys in client code.
// For this demo, we assume the user has the key in environment or we prompt for it.
// The code strictly follows the instruction to use process.env.API_KEY.

export const generateEventTheme = async (baseIdea: string): Promise<string> => {
  if (!process.env.API_KEY) {
    console.warn("No API Key found");
    return "API Key 缺失: 无法生成主题。";
  }

  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `你是一位乡村体育赛事的专家组织者。
      请根据以下想法生成一个朗朗上口、鼓舞人心的中文主题名称和一段简短的描述（最多50字）。
      想法: "${baseIdea}".
      格式: 主题名称 - 描述`,
    });
    return response.text || "生成主题失败。";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "AI 服务暂时不可用。";
  }
};

export const consultSportsExpert = async (query: string): Promise<string> => {
   if (!process.env.API_KEY) return "请配置您的 API Key 以使用 AI 助手。";

   try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `你是一个乡村体育公益平台的智能助手。
      村民们会向你咨询关于比赛规则、健康建议或活动组织的问题。
      请用中文回答，语言通俗易懂，态度热情鼓励，适合农村居民阅读。
      
      用户问题: "${query}"`,
    });
    return response.text || "我现在想不出答案。";
  } catch (error) {
    return "AI 服务暂时离线。";
  }
}