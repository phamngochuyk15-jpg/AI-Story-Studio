
import { GoogleGenAI, Modality, Type } from "@google/genai";
import { Project, Chapter, Character, Relationship } from "../types";

// Hàm kiểm tra API Key để debug nhanh
const getApiKey = () => {
  const key = process.env.API_KEY;
  if (!key || key === 'undefined' || key === '') {
    throw new Error("API_KEY_MISSING: Chưa tìm thấy API Key trong môi trường hệ thống. Vui lòng kiểm tra lại cấu hình biến môi trường trên nền tảng deploy.");
  }
  return key;
};

const getSystemContext = (project: Project) => {
  const charContext = project.characters.length > 0 
    ? `DANH SÁCH NHÂN VẬT:\n${project.characters.map(c => `- ${c.name} (${c.role}): ${c.personality}`).join('\n')}`
    : "";
    
  return `
    BỐI CẢNH THẾ GIỚI (WORLD BIBLE):
    ${project.worldBible || "Chưa có thiết lập bối cảnh cụ thể."}

    ${charContext}

    THỂ LOẠI: ${project.genre}. GIỌNG VĂN: ${project.tone}.
  `;
};

export const generateCoAuthorResponse = async (project: Project, userMessage: string) => {
  try {
    const ai = new GoogleGenAI({ apiKey: getApiKey() });
    const model = "gemini-3-pro-preview"; // Nâng cấp lên Pro cho tác vụ viết lách phức tạp
    
    const systemInstruction = `Bạn là Nhà văn Đồng tác giả chuyên nghiệp cho dự án "${project.title}". 
    ${getSystemContext(project)}
    Hãy hỗ trợ tác giả phát triển ý tưởng, xây dựng tình tiết và tra cứu thông tin thực tế khi cần thiết.`;

    // Đảm bảo chat history luôn xen kẽ user-model và kết thúc bằng user
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
      text: response.text || "Tôi chưa tìm được ý tưởng phù hợp, hãy thử lại nhé.",
      groundingUrls: urls
    };
  } catch (error: any) {
    console.error("AI Error:", error);
    return { 
      text: `Lỗi kết nối AI: ${error.message.includes('API_KEY_MISSING') ? error.message : "Đã có lỗi xảy ra khi gọi Gemini API. Có thể do quota hoặc model chưa khả dụng tại vùng này."}` 
    };
  }
};

export const analyzeRelationships = async (project: Project): Promise<Relationship[]> => {
  try {
    const ai = new GoogleGenAI({ apiKey: getApiKey() });
    if (project.characters.length < 2) return [];

    const prompt = `Phân tích mối quan hệ giữa các nhân vật sau dựa trên bối cảnh:
    ${project.characters.map(c => `${c.name} (${c.role}): ${c.personality}`).join(", ")}
    Trả về JSON array các quan hệ.`;

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
    console.error("Analyze error:", error);
    return [];
  }
};

export const generateStoryDraft = async (project: Project, chapter: Chapter, instruction: string) => {
  try {
    const ai = new GoogleGenAI({ apiKey: getApiKey() });
    const systemInstruction = `Bạn là nhà văn đang viết "${project.title}". ${getSystemContext(project)}`;

    const response = await ai.models.generateContent({
      model: "gemini-3-pro-preview",
      contents: `Nhiệm vụ: ${instruction}\n\nNội dung hiện tại:\n${chapter.content}`,
      config: { systemInstruction }
    });
    return response.text;
  } catch (error) {
    console.error("Draft error:", error);
    return "";
  }
};

export const generateCharacterPortrait = async (character: Character) => {
  try {
    const ai = new GoogleGenAI({ apiKey: getApiKey() });
    const prompt = `Portrait of ${character.name}, ${character.appearance}. Concept art style, high quality. No text.`;
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: { parts: [{ text: prompt }] }
    });
    for (const part of response.candidates[0].content.parts) {
      if (part.inlineData) return `data:image/png;base64,${part.inlineData.data}`;
    }
    return null;
  } catch (error) {
    console.error("Image error:", error);
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
        speechConfig: {
          voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } },
        },
      },
    });
    return response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
  } catch (error) {
    console.error("TTS error:", error);
    return null;
  }
};
