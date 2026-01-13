
import { GoogleGenAI, Modality, Type } from "@google/genai";
import { Project, Chapter, Character, Relationship } from "../types";

const getApiKey = () => {
  const key = process.env.API_KEY;
  if (!key || key === "" || key === "undefined") {
    throw new Error("CHƯA CẤU HÌNH API KEY: Kiểm tra biến API_KEY trên Vercel.");
  }
  return key;
};

const handleAiError = (error: any) => {
  console.error("AI Error:", error);
  const msg = error.message || "";
  if (msg.includes("429") || msg.includes("RESOURCE_EXHAUSTED")) {
    return "⚠️ HỆ THỐNG ĐANG QUÁ TẢI (429): Bạn đã dùng hết hạn mức miễn phí trong phút này. Hãy nghỉ tay khoảng 30-60 giây rồi nhấn gửi lại nhé!";
  }
  return `⚠️ LỖI: ${msg}`;
};

/**
 * Rút gọn bối cảnh để gửi đi (chỉ gửi những thứ quan trọng nhất)
 */
const getCondensedContext = (project: Project) => {
  const charNames = project.characters.map(c => c.name).join(", ");
  return `Tên truyện: ${project.title}. Thể loại: ${project.genre}. Nhân vật: ${charNames}. Bối cảnh: ${project.worldBible.slice(0, 1000)}...`;
};

// Cập nhật hàm trả về đối tượng có groundingUrls để khớp với kiểu dữ liệu ChatMessage trong UI
export const generateCoAuthorResponse = async (project: Project, userMessage: string) => {
  try {
    const ai = new GoogleGenAI({ apiKey: getApiKey() });
    const model = "gemini-3-flash-preview";
    
    // Chỉ lấy 8 tin nhắn gần nhất để tiết kiệm token
    const shortHistory = project.chatHistory.slice(-8).map(m => ({
      role: m.role,
      parts: [{ text: m.text }]
    }));

    const response = await ai.models.generateContent({
      model,
      contents: [...shortHistory, { role: 'user', parts: [{ text: userMessage }] }],
      config: { 
        systemInstruction: `Bạn là đồng tác giả truyện. Hãy trả lời ngắn gọn, súc tích bằng tiếng Việt. Bối cảnh: ${getCondensedContext(project)}`,
        // Kích hoạt Google Search để có thể cung cấp nguồn tham khảo thực tế
        tools: [{ googleSearch: {} }]
      }
    });

    // Trích xuất các liên kết từ dữ liệu grounding của Gemini
    const groundingUrls = response.candidates?.[0]?.groundingMetadata?.groundingChunks
      ?.filter((chunk: any) => chunk.web)
      .map((chunk: any) => ({
        title: chunk.web.title || "Nguồn tham khảo",
        uri: chunk.web.uri || ""
      }))
      .filter((u: any) => u.uri !== "");

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
      model: "gemini-3-flash-preview",
      contents: `Viết tiếp chương "${chapter.title}". Yêu cầu: ${instruction}\n\nNội dung trước đó: ${chapter.content.slice(-2000)}`,
      config: { 
        systemInstruction: getCondensedContext(project)
      }
    });
    return response.text;
  } catch (error: any) {
    return handleAiError(error);
  }
};

export const analyzeRelationships = async (project: Project): Promise<Relationship[]> => {
  try {
    const ai = new GoogleGenAI({ apiKey: getApiKey() });
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Phân tích quan hệ giữa: ${project.characters.map(c => c.name).join(", ")} dựa trên bối cảnh: ${project.worldBible}`,
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
      contents: { parts: [{ text: `Anime style portrait of ${character.name}, ${character.appearance}` }] }
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
      contents: [{ parts: [{ text }] }],
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
