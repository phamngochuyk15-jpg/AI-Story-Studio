
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
  console.error("AI Error:", error);
  const msg = error.message || "";
  if (msg.includes("429") || msg.includes("60s") || msg.includes("quota") || msg.includes("exhausted")) {
    return "429_ERROR";
  }
  return `⚠️ LỖI: ${msg}`;
};

// Cực kỳ ngắn gọn để tiết kiệm token đầu vào
const getMinContext = (project: Project) => {
  return `Truyện: ${project.title}. Thể loại: ${project.genre}.`;
};

export const generateCoAuthorResponse = async (project: Project, userMessage: string): Promise<{ text: string; groundingUrls?: { title: string; uri: string }[] }> => {
  try {
    const ai = new GoogleGenAI({ apiKey: getApiKey() });
    // Dùng model 2.0 Lite mới nhất để có quota tốt nhất
    const model = "gemini-2.0-flash-lite-preview-02-05";
    
    // Chỉ lấy 2 tin nhắn gần nhất để siêu tiết kiệm
    const shortHistory = project.chatHistory.slice(-2).map(m => ({
      role: m.role,
      parts: [{ text: m.text }]
    }));

    const response = await ai.models.generateContent({
      model,
      contents: [...shortHistory, { role: 'user', parts: [{ text: userMessage }] }],
      config: { 
        systemInstruction: `Bạn là đồng tác giả. Trả lời ngắn gọn bằng tiếng Việt. ${getMinContext(project)}`,
        maxOutputTokens: 400, // Giới hạn độ dài phản hồi để tiết kiệm TPM
        temperature: 0.7
      }
    });

    return { 
      text: response.text || "AI không phản hồi.",
    };
  } catch (error: any) {
    if (error.message === "API_KEY_MISSING") return { text: "⚠️ LỖI: Chưa cấu hình API_KEY trên Vercel." };
    return { text: handleAiError(error) };
  }
};

export const generateStoryDraft = async (project: Project, chapter: Chapter, instruction: string) => {
  try {
    const ai = new GoogleGenAI({ apiKey: getApiKey() });
    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash-lite-preview-02-05",
      contents: `Viết tiếp chương "${chapter.title}". Yêu cầu: ${instruction}\n\nĐoạn cuối: ${chapter.content.slice(-500)}`,
      config: { 
        systemInstruction: `Viết truyện tiếng Việt. ${getMinContext(project)}`,
        maxOutputTokens: 800 // Giới hạn vừa phải cho viết chương
      }
    });
    return response.text;
  } catch (error: any) {
    const errCode = handleAiError(error);
    return errCode === "429_ERROR" ? "⚠️ LỖI 429: Hết hạn mức, hãy đợi 30s." : errCode;
  }
};

export const analyzeRelationships = async (project: Project): Promise<Relationship[]> => {
  try {
    const ai = new GoogleGenAI({ apiKey: getApiKey() });
    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash-lite-preview-02-05",
      contents: `Trả về JSON quan hệ nhân vật: ${project.characters.map(c => c.name).join(", ")}`,
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
        },
        maxOutputTokens: 500
      }
    });
    return JSON.parse(response.text || "[]");
  } catch (error) {
    return [];
  }
};

export const generateCharacterPortrait = async (character: Character) => {
  try {
    const ai = new GoogleGenAI({ apiKey: getApiKey() });
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: { parts: [{ text: `Anime style: ${character.appearance}` }] }
    });
    for (const part of response.candidates[0].content.parts) {
      if (part.inlineData) return `data:image/png;base64,${part.inlineData.data}`;
    }
    return null;
  } catch (error) {
    return null;
  }
};

export const generateSpeech = async (text: string) => {
  try {
    const ai = new GoogleGenAI({ apiKey: getApiKey() });
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text: text.slice(0, 300) }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } } },
      },
    });
    return response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
  } catch (error) {
    return null;
  }
};
