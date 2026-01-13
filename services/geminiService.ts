
import { GoogleGenAI, Modality, Type } from "@google/genai";
import { Project, Chapter, Character, Relationship } from "../types";

const getApiKey = () => {
  const key = process.env.API_KEY;
  if (!key || key === "" || key === "undefined") {
    throw new Error("API_KEY_MISSING");
  }
  return key;
};

const handleAiError = (error: any) => {
  console.error("AI Error Details:", error);
  const msg = error.message || "";
  // Google trả về 429 khi quá tải hoặc hết hạn mức TPM (Tokens Per Minute)
  if (msg.includes("429") || msg.includes("quota") || msg.includes("exhausted") || msg.includes("60s")) {
    return "429_ERROR";
  }
  return `⚠️ LỖI: ${msg}`;
};

export const generateCoAuthorResponse = async (project: Project, userMessage: string): Promise<{ text: string }> => {
  try {
    const ai = new GoogleGenAI({ apiKey: getApiKey() });
    // Dùng bản Lite ổn định nhất (Stable Alias)
    const model = "gemini-flash-lite-latest";
    
    // Tối ưu: Chỉ gửi 1 tin nhắn cũ nhất và 1 tin nhắn mới nhất để giảm Token
    const ultraShortHistory = project.chatHistory.length > 0 
      ? [project.chatHistory[project.chatHistory.length - 1]].map(m => ({
          role: m.role,
          parts: [{ text: m.text.slice(0, 500) }] // Cắt ngắn tin nhắn cũ
        }))
      : [];

    const response = await ai.models.generateContent({
      model,
      contents: [...ultraShortHistory, { role: 'user', parts: [{ text: userMessage }] }],
      config: { 
        systemInstruction: `Bạn là đồng tác giả. Trả lời cực ngắn, súc tích bằng tiếng Việt. Bối cảnh: ${project.title}`,
        maxOutputTokens: 250, // Ép đầu ra siêu ngắn để Google không chặn
        temperature: 0.8,
        topP: 0.8,
        topK: 40
      }
    });

    return { text: response.text || "AI không phản hồi." };
  } catch (error: any) {
    return { text: handleAiError(error) };
  }
};

export const generateStoryDraft = async (project: Project, chapter: Chapter, instruction: string) => {
  try {
    const ai = new GoogleGenAI({ apiKey: getApiKey() });
    const response = await ai.models.generateContent({
      model: "gemini-flash-lite-latest",
      contents: `Viết tiếp chương "${chapter.title}". Yêu cầu: ${instruction}\n\nĐoạn cuối: ${chapter.content.slice(-400)}`,
      config: { 
        systemInstruction: `Viết truyện. ${project.title}`,
        maxOutputTokens: 500
      }
    });
    return response.text;
  } catch (error: any) {
    const errCode = handleAiError(error);
    return errCode === "429_ERROR" ? "⚠️ LỖI 429: Google đang chặn do bạn gửi quá nhiều chữ. Hãy đợi 30s hoặc xóa lịch sử chat." : errCode;
  }
};

export const analyzeRelationships = async (project: Project): Promise<Relationship[]> => {
  try {
    const ai = new GoogleGenAI({ apiKey: getApiKey() });
    const response = await ai.models.generateContent({
      model: "gemini-flash-lite-latest",
      contents: `JSON nhân vật: ${project.characters.map(c => c.name).join(", ")}`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              fromId: { type: Type.STRING },
              toId: { type: Type.STRING },
              type: { type: Type.STRING },
              description: { type: Type.STRING }
            },
            required: ["fromId", "toId", "type"]
          }
        }
      }
    });
    return JSON.parse(response.text || "[]");
  } catch (error) { return []; }
};

export const generateCharacterPortrait = async (character: Character) => {
  try {
    const ai = new GoogleGenAI({ apiKey: getApiKey() });
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: { parts: [{ text: `Anime style, ${character.appearance}` }] }
    });
    for (const part of response.candidates[0].content.parts) {
      if (part.inlineData) return `data:image/png;base64,${part.inlineData.data}`;
    }
    return null;
  } catch (error) { return null; }
};

export const generateSpeech = async (text: string) => {
  try {
    const ai = new GoogleGenAI({ apiKey: getApiKey() });
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text: text.slice(0, 200) }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } } },
      },
    });
    return response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
  } catch (error) { return null; }
};
