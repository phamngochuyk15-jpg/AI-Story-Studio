
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
  imageUrl?: string;
}

export interface Relationship {
  fromId: string;
  toId: string;
  type: string;
  description: string;
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
  groundingUrls?: { title: string; uri: string }[];
}

export interface Project {
  id: string;
  title: string;
  type: ProjectType;
  genre: string;
  worldBible: string;
  tone: string;
  characters: Character[];
  relationships: Relationship[];
  chapters: Chapter[];
  chatHistory: ChatMessage[];
  lastUpdated: number;
}
