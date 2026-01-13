
import { GoogleGenAI, Modality, Type } from "@google/genai";
import { Project, Chapter, Character, Relationship } from "../types";

/**
 * Hàm lấy API Key từ môi trường.
 * Vite sẽ thay thế process.env.API_KEY bằng giá trị thực tế lúc Build.
 */
const getApiKey = () => {
  const key = process.env.API_KEY;
  
  // Kiểm tra nếu key bị rỗng hoặc là chuỗi "undefined" do lỗi build
  if (!key || key === "" || key === "undefined") {
    throw new Error("CHƯA CẤU HÌNH API KEY: Vui lòng vào cài đặt Project trên nền tảng Deploy (Vercel/Netlify), thêm biến môi trường tên là API_KEY với giá trị là mã của bạn, sau đó 'Redeploy' lại.");
  }
  return key;
};

const getSystemContext = (project: Project) => {
  const charContext = project.characters.length > 0 
    ? `DANH SÁCH NHÂN VẬT:\n${project.characters.map(c => `- ${c.name} (${c.role}): ${c.personality}`).join('\n')}`
    : "";
    
  return `
    DỰ ÁN: ${project.title}
    BỐI CẢNH THẾ GIỚI:
    ${project.worldBible || "Chưa có thiết lập bối cảnh."}

    ${charContext}

    THỂ LOẠI: ${project.genre}. TONE GIỌNG: ${project.tone}.
  `;
};

export const generateCoAuthorResponse = async (project: Project, userMessage: string) => {
  try {
    const ai = new GoogleGenAI({ apiKey: getApiKey() });
    const model = "gemini-3-pro-preview";
    
    const systemInstruction = `Bạn là một Nhà văn chuyên nghiệp, đồng tác giả của dự án này. 
    ${getSystemContext(project)}
    Hãy phản hồi bằng tiếng Việt, hỗ trợ tác giả xây dựng tình tiết hấp dẫn.`;

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
      text: response.text || "Tôi đang suy nghĩ, bạn hãy thử lại nhé.",
      groundingUrls: urls
    };
  } catch (error: any) {
    console.error("AI Error:", error);
    return { 
      text: `⚠️ ${error.message}` 
    };
  }
};

export const analyzeRelationships = async (project: Project): Promise<Relationship[]> => {
  try {
    const ai = new GoogleGenAI({ apiKey: getApiKey() });
    if (project.characters.length < 2) return [];

    const prompt = `Dựa vào bối cảnh, hãy phân tích mối quan hệ giữa các nhân vật:
    ${project.characters.map(c => `${c.name} (${c.role}): ${c.personality}`).join(", ")}
    Trả về kết quả dưới dạng JSON array các object {fromId, toId, type, description}.`;

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
    const systemInstruction = `Bạn là nhà văn chính. ${getSystemContext(project)}`;

    const response = await ai.models.generateContent({
      model: "gemini-3-pro-preview",
      contents: `Nhiệm vụ: ${instruction}\n\nNội dung chương hiện tại:\n${chapter.content}`,
      config: { systemInstruction }
    });
    return response.text;
  } catch (error: any) {
    console.error("Draft error:", error);
    return `Lỗi khi viết: ${error.message}`;
  }
};

export const generateCharacterPortrait = async (character: Character) => {
  try {
    const ai = new GoogleGenAI({ apiKey: getApiKey() });
    const prompt = `Professional character portrait of ${character.name}, ${character.appearance}. Cinematic lighting, detailed digital art style.`;
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
