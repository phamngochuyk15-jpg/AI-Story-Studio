
export enum ProjectType {
  SHORT_STORY = 'Truyện ngắn',
  NOVEL = 'Tiểu thuyết',
  BLOG = 'Blog cá nhân',
  SERIES = 'Truyện dài/Sê-ri'
}

export interface Character {
  id: string;
  name: string;
  role: string;
  age: string;
  personality: string;
  backstory: string;
  appearance: string;
  notes: string;
  imageUrl?: string; // Lưu URL base64 của ảnh nhân vật
}

export interface Chapter {
  id: string;
  title: string;
  content: string;
  summary: string;
  createdAt: number;
}

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
}

export interface Project {
  id: string;
  title: string;
  type: ProjectType;
  genre: string;
  worldBible: string; // Lưu thiết lập thế giới/bible
  tone: string;
  characters: Character[];
  chapters: Chapter[];
  chatHistory: ChatMessage[];
  lastUpdated: number;
}
