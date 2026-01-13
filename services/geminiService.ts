
import { GoogleGenAI, Modality, Type } from "@google/genai";
import { Project, Chapter, Character, Relationship } from "../types";

const getApiKey = () => {
  const key = process.env.API_KEY;
  if (!key || key === "" || key === "undefined") {
    throw new Error("CHƯA CẤU HÌNH API KEY: Vui lòng kiểm tra biến môi trường API_KEY trong cài đặt Vercel.");
  }
  return key;
};

/**
 * Xử lý lỗi từ Google API để hiển thị thông báo thân thiện
 */
const handleAiError = (error: any) => {
  console.error("AI Error Details:", error);
  const msg = error.message || "";
  
  if (msg.includes("429") || msg.includes("RESOURCE_EXHAUSTED")) {
    return "⚠️ HẾT HẠN MỨC SỬ DỤNG: Bạn đã gửi quá nhiều yêu cầu hoặc hết giới hạn miễn phí của Google trong hôm nay. Hãy đợi 1-2 phút rồi thử lại hoặc nâng cấp lên gói trả phí tại Google AI Studio.";
  }
  if (msg.includes("500") || msg.includes("Internal Server Error")) {
    return "⚠️ LỖI HỆ THỐNG GOOGLE: Máy chủ AI đang gặp sự cố tạm thời. Vui lòng thử lại sau vài giây.";
  }
  return `⚠️ LỖI KẾT NỐI: ${msg}`;
};

const getSystemContext = (project: Project) => {
  const charContext = project.characters.length > 0 
    ? `DANH SÁCH NHÂN VẬT:\n${project.characters.map(c => `- ${c.name} (${c.role}): ${c.personality}`).join('\n')}`
    : "";
    
  return `
    DỰ ÁN: ${project.title}
    BỐI CẢNH: ${project.worldBible || "Tự do"}
    ${charContext}
    THỂ LOẠI: ${project.genre}. TONE: ${project.tone}.
  `;
};

export const generateCoAuthorResponse = async (project: Project, userMessage: string) => {
  try {
    const ai = new GoogleGenAI({ apiKey: getApiKey() });
    // Chuyển sang model Flash để có hạn mức sử dụng (RPM/TPM) cao hơn Pro
    const model = "gemini-3-flash-preview";
    
    const systemInstruction = `Bạn là đồng tác giả của dự án này. Hãy phản hồi bằng tiếng Việt. ${getSystemContext(project)}`;

    const formattedHistory = project.chatHistory.map(m => ({
      role: m.role,
      parts: [{ text: m.text }]
    }));

    const response = await ai.models.generateContent({
      model,
      contents: [...formattedHistory, { role: 'user', parts: [{ text: userMessage }] }],
      config: { 
        systemInstruction,
        tools: [{ googleSearch: {} }] 
      }
    });

    const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
    const urls = groundingChunks?.map((chunk: any) => ({
      title: chunk.web?.title || "Nguồn tham khảo",
      uri: chunk.web?.uri
    })).filter((item: any) => item.uri);

    return { 
      text: response.text || "AI không trả về nội dung.",
      groundingUrls: urls
    };
  } catch (error: any) {
    return { text: handleAiError(error) };
  }
};

export const analyzeRelationships = async (project: Project): Promise<Relationship[]> => {
  try {
    const ai = new GoogleGenAI({ apiKey: getApiKey() });
    if (project.characters.length < 2) return [];

    const prompt = `Phân tích quan hệ nhân vật: ${project.characters.map(c => c.name).join(", ")}. Trả về JSON array.`;

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
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

export const generateStoryDraft = async (project: Project, chapter: Chapter, instruction: string) => {
  try {
    const ai = new GoogleGenAI({ apiKey: getApiKey() });
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Viết tiếp chương này: ${chapter.title}. Yêu cầu: ${instruction}\n\nNội dung cũ: ${chapter.content}`,
      config: { systemInstruction: getSystemContext(project) }
    });
    return response.text;
  } catch (error: any) {
    return handleAiError(error);
  }
};

export const generateCharacterPortrait = async (character: Character) => {
  try {
    const ai = new GoogleGenAI({ apiKey: getApiKey() });
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: { parts: [{ text: `Portrait of ${character.name}, ${character.appearance}` }] }
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
