
import { GoogleGenAI, Modality, Type } from "@google/genai";
import { Project, Chapter, Character, Relationship } from "../types";

const getApiKey = () => {
  const key = process.env.API_KEY;
  if (!key || key === "" || key === "undefined") {
    throw new Error("CHƯA CẤU HÌNH API KEY.");
  }
  return key;
};

const handleAiError = (error: any) => {
  console.error("AI Error:", error);
  const msg = error.message || "";
  if (msg.includes("429") || msg.includes("RESOURCE_EXHAUSTED")) {
    return "429_ERROR"; // Trả về mã lỗi đặc biệt để UI xử lý
  }
  return `⚠️ LỖI: ${msg}`;
};

/**
 * Thu gọn bối cảnh ở mức tối giản (dưới 500 ký tự) để tiết kiệm Token
 */
const getUltraCondensedContext = (project: Project) => {
  return `Truyện: ${project.title}. Thể loại: ${project.genre}. Bối cảnh: ${project.worldBible.slice(0, 300)}...`;
};

/**
 * Trả về phản hồi từ đồng tác giả AI
 * Fix: Thêm kiểu dữ liệu trả về tường minh bao gồm groundingUrls để sửa lỗi TS trong CoAuthorChat.tsx
 */
export const generateCoAuthorResponse = async (project: Project, userMessage: string): Promise<{ text: string; groundingUrls?: { title: string; uri: string }[] }> => {
  try {
    const ai = new GoogleGenAI({ apiKey: getApiKey() });
    // Chuyển sang Flash Lite - Model "trâu" nhất về hạn mức Free
    const model = "gemini-flash-lite-latest";
    
    // Chỉ lấy 4 tin nhắn gần nhất (siêu tiết kiệm)
    const shortHistory = project.chatHistory.slice(-4).map(m => ({
      role: m.role,
      parts: [{ text: m.text }]
    }));

    const response = await ai.models.generateContent({
      model,
      contents: [...shortHistory, { role: 'user', parts: [{ text: userMessage }] }],
      config: { 
        systemInstruction: `Bạn là đồng tác giả. Trả lời cực ngắn gọn bằng tiếng Việt. Bối cảnh: ${getUltraCondensedContext(project)}`,
        // KHÔNG dùng tools (Google Search) để tránh bị khóa quota nhanh
      }
    });

    // Trích xuất grounding URLs nếu có (mặc dù hiện tại tools đang tắt)
    const groundingUrls = response.candidates?.[0]?.groundingMetadata?.groundingChunks?.map((chunk: any) => ({
      title: chunk.web?.title || chunk.maps?.title || "Nguồn",
      uri: chunk.web?.uri || chunk.maps?.uri || ""
    })).filter((item: any) => item.uri);

    return { 
      text: response.text || "AI không phản hồi.",
      groundingUrls: groundingUrls && groundingUrls.length > 0 ? groundingUrls : undefined
    };
  } catch (error: any) {
    return { text: handleAiError(error) };
  }
};

export const generateStoryDraft = async (project: Project, chapter: Chapter, instruction: string) => {
  try {
    const ai = new GoogleGenAI({ apiKey: getApiKey() });
    const response = await ai.models.generateContent({
      model: "gemini-flash-lite-latest",
      contents: `Viết tiếp chương "${chapter.title}". Yêu cầu: ${instruction}\n\nĐoạn cuối: ${chapter.content.slice(-800)}`,
      config: { 
        systemInstruction: getUltraCondensedContext(project)
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
      model: "gemini-flash-lite-latest",
      contents: `JSON quan hệ: ${project.characters.map(c => c.name).join(", ")}`,
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
  } catch (error) {
    return [];
  }
};

export const generateCharacterPortrait = async (character: Character) => {
  try {
    const ai = new GoogleGenAI({ apiKey: getApiKey() });
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: { parts: [{ text: `Simple anime character, ${character.appearance}` }] }
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
      contents: [{ parts: [{ text: text.slice(0, 500) }] }],
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
