
import { GoogleGenAI, Modality } from "@google/genai";
import { Project, Chapter, Character } from "../types";

// Cập nhật context hệ thống bao gồm cả World Bible
const getSystemContext = (project: Project) => {
  const charContext = project.characters.length > 0 
    ? `DANH SÁCH NHÂN VẬT:\n${project.characters.map(c => `- ${c.name}: ${c.personality}`).join('\n')}`
    : "";
    
  return `
    BỐI CẢNH THẾ GIỚI (WORLD BIBLE):
    ${project.worldBible || "Chưa có thiết lập bối cảnh cụ thể."}

    ${charContext}

    THỂ LOẠI: ${project.genre}. GIỌNG VĂN: ${project.tone}.
  `;
};

export const generateCoAuthorResponse = async (project: Project, userMessage: string) => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || "" });
  const model = "gemini-3-pro-preview";
  
  const systemInstruction = `
    Bạn là Nhà văn Đồng tác giả chuyên nghiệp cho "${project.title}".
    ${getSystemContext(project)}
    Hãy thảo luận và cùng phát triển ý tưởng. Luôn tuân thủ bối cảnh thế giới đã thiết lập.
  `;

  try {
    const response = await ai.models.generateContent({
      model,
      contents: project.chatHistory.map(m => ({
        role: m.role,
        parts: [{ text: m.text }]
      })).concat([{ role: 'user', parts: [{ text: userMessage }] }]),
      config: { systemInstruction, thinkingConfig: { thinkingBudget: 16000 } }
    });
    return { text: response.text || "..." };
  } catch (error) {
    console.error("AI Error:", error);
    return { text: "Lỗi kết nối AI." };
  }
};

export const generateStoryDraft = async (project: Project, chapter: Chapter, instruction: string) => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || "" });
  const model = "gemini-3-pro-preview";
  
  const systemInstruction = `
    Bạn là nhà văn viết truyện "${project.title}".
    ${getSystemContext(project)}
    Nhiệm vụ: ${instruction}
  `;

  try {
    const response = await ai.models.generateContent({
      model,
      contents: `Bản thảo hiện tại:\n${chapter.content}\nTóm tắt ý đồ: ${chapter.summary}`,
      config: { systemInstruction, thinkingConfig: { thinkingBudget: 8000 } }
    });
    return response.text;
  } catch (error) {
    return "";
  }
};

export const generateCharacterPortrait = async (character: Character, projectTitle: string) => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || "" });
  const prompt = `A high-quality character profile portrait. 
    Character name: ${character.name}. 
    Appearance: ${character.appearance}. 
    Style: Professional digital painting, clean artistic background, centered composition, head and shoulders shot. 
    IMPORTANT: No text, no words, no letters, no typography on the image. Clear and sharp features.`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: { parts: [{ text: prompt }] },
      config: { imageConfig: { aspectRatio: "1:1" } }
    });
    
    for (const part of response.candidates[0].content.parts) {
      if (part.inlineData) return `data:image/png;base64,${part.inlineData.data}`;
    }
    return null;
  } catch (error) {
    console.error("Image Gen Error:", error);
    return null;
  }
};

export const generateSpeech = async (text: string) => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || "" });
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text: `Đọc diễn cảm đoạn văn sau: ${text}` }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } },
        },
      },
    });
    return response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
  } catch (error) {
    console.error("TTS Error:", error);
    return null;
  }
};
