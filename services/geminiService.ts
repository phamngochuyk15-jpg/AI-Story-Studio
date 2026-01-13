
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
  if (msg.includes("429") || msg.includes("quota") || msg.includes("exhausted")) {
    return "429_ERROR";
  }
  return `⚠️ LỖI: ${msg}`;
};

const getContextSnippet = (project: Project) => {
  const chars = project.characters.map(c => c.name).join(", ");
  return `Tác phẩm: ${project.title}. Thể loại: ${project.genre}. Nhân vật: ${chars}. Giọng văn: ${project.tone}.`;
};

// Hàm hỗ trợ gọi nội dung với cơ chế Fallback Pro -> Flash
async function generateWithFallback(params: {
  systemInstruction: string,
  contents: any,
  maxTokens: number,
  thinkingBudget?: number
}) {
  const ai = new GoogleGenAI({ apiKey: getApiKey() });
  
  try {
    // Thử dùng bản Pro trước
    const response = await ai.models.generateContent({
      model: "gemini-3-pro-preview",
      contents: params.contents,
      config: {
        systemInstruction: params.systemInstruction,
        maxOutputTokens: params.maxTokens,
        thinkingConfig: params.thinkingBudget ? { thinkingBudget: params.thinkingBudget } : undefined,
        temperature: 0.9
      }
    });
    return { text: response.text, modelUsed: 'pro' };
  } catch (error: any) {
    if (handleAiError(error) === "429_ERROR") {
      console.warn("Gemini Pro hit quota, falling back to Flash...");
      // Fallback sang Flash (Giới hạn cao hơn nhiều)
      const flashResponse = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: params.contents,
        config: {
          systemInstruction: params.systemInstruction + " (Lưu ý: Bạn đang ở chế độ dự phòng, hãy viết nhanh và súc tích hơn nhưng vẫn giữ đúng bối cảnh).",
          maxOutputTokens: params.maxTokens,
          temperature: 0.8
        }
      });
      return { text: flashResponse.text, modelUsed: 'flash' };
    }
    throw error;
  }
}

export const generateCoAuthorResponse = async (project: Project, userMessage: string): Promise<{ text: string, modelUsed?: string }> => {
  try {
    const history = project.chatHistory.slice(-4).map(m => ({
      role: m.role,
      parts: [{ text: m.text }]
    }));

    const result = await generateWithFallback({
      systemInstruction: `Bạn là một nhà văn tiểu thuyết chuyên nghiệp. Hãy phản hồi người dùng bằng văn phong lôi cuốn. BỐI CẢNH: ${getContextSnippet(project)}. DỮ LIỆU THẾ GIỚI: ${project.worldBible}`,
      contents: [...history, { role: 'user', parts: [{ text: userMessage }] }],
      maxTokens: 2048,
      thinkingBudget: 4000
    });

    return { text: result.text || "AI không phản hồi.", modelUsed: result.modelUsed };
  } catch (error: any) {
    return { text: handleAiError(error) };
  }
};

export const generateStoryDraft = async (project: Project, chapter: Chapter, instruction: string) => {
  try {
    const result = await generateWithFallback({
      systemInstruction: `Bạn đang viết bản thảo tiểu thuyết. ${getContextSnippet(project)}`,
      contents: `Hãy viết tiếp chương "${chapter.title}". Yêu cầu: ${instruction}\n\nDiễn biến trước: ${chapter.content.slice(-2000)}`,
      maxTokens: 4000,
      thinkingBudget: 8000
    });
    return result.text;
  } catch (error: any) {
    return handleAiError(error);
  }
};

export const analyzeRelationships = async (project: Project): Promise<Relationship[]> => {
  try {
    const ai = new GoogleGenAI({ apiKey: getApiKey() });
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview", // Quan hệ dùng Flash cho nhanh và ổn định
      contents: `Phân tích sâu quan hệ nhân vật dựa trên: ${project.worldBible}`,
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
      model: 'gemini-2.5-flash-image', // Model ảnh dùng Flash để tránh tranh chấp quota với Pro
      contents: { parts: [{ text: `Professional anime concept art: ${character.appearance}` }] }
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
      contents: [{ parts: [{ text: text.slice(0, 500) }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } } },
      },
    });
    return response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
  } catch (error) { return null; }
};
