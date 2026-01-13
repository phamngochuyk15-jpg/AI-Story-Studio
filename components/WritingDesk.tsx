
import React, { useState, useEffect, useRef } from 'react';
import { Project, Chapter } from '../types';
import { generateStoryDraft, generateSpeech } from '../services/geminiService';
import { decodeBase64, decodeAudioData } from '../services/audioUtils';

interface WritingDeskProps {
  project: Project;
  onUpdate: (project: Project) => void;
}

const WritingDesk: React.FC<WritingDeskProps> = ({ project, onUpdate }) => {
  const [activeChapterId, setActiveChapterId] = useState<string | null>(
    project.chapters.length > 0 ? project.chapters[0].id : null
  );
  const [isAiWriting, setIsAiWriting] = useState(false);
  const [isReading, setIsReading] = useState(false);
  const [audioSource, setAudioSource] = useState<AudioBufferSourceNode | null>(null);
  
  const [localContent, setLocalContent] = useState('');
  const [localTitle, setLocalTitle] = useState('');
  const [localSummary, setLocalSummary] = useState('');
  
  const activeChapter = project.chapters.find(c => c.id === activeChapterId);
  const audioContextRef = useRef<AudioContext | null>(null);

  useEffect(() => {
    if (activeChapter) {
      setLocalContent(activeChapter.content);
      setLocalTitle(activeChapter.title);
      setLocalSummary(activeChapter.summary);
      stopAudio();
    }
  }, [activeChapterId]);

  const syncToGlobal = (updates: Partial<Chapter>) => {
    if (!activeChapter) return;
    onUpdate({
      ...project,
      chapters: project.chapters.map(c => c.id === activeChapter.id ? { ...activeChapter, ...updates } : c)
    });
  };

  const stopAudio = () => {
    if (audioSource) {
      audioSource.stop();
      setAudioSource(null);
    }
    setIsReading(false);
  };

  const handleReadAloud = async () => {
    if (!localContent.trim() || isReading) {
      if (isReading) stopAudio();
      return;
    }
    setIsReading(true);
    
    // Chia nhỏ đoạn văn nếu quá dài để TTS xử lý tốt hơn (giới hạn 3000 ký tự đầu cho bản demo này)
    const textToRead = localContent.slice(0, 3000);
    const base64Audio = await generateSpeech(textToRead);
    
    if (base64Audio) {
      if (!audioContextRef.current) audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      const ctx = audioContextRef.current;
      const audioBuffer = await decodeAudioData(decodeBase64(base64Audio), ctx, 24000, 1);
      const source = ctx.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(ctx.destination);
      source.onended = () => { setIsReading(false); setAudioSource(null); };
      source.start();
      setAudioSource(source);
    } else {
      setIsReading(false);
    }
  };

  const handleAddChapter = () => {
    const newChap: Chapter = { id: crypto.randomUUID(), title: `Chương ${project.chapters.length + 1}`, content: '', summary: '', createdAt: Date.now() };
    onUpdate({ ...project, chapters: [...project.chapters, newChap], lastUpdated: Date.now() });
    setActiveChapterId(newChap.id);
  };

  const handleAiWriteNext = async () => {
    if (!activeChapter || isAiWriting) return;
    setIsAiWriting(true);
    const draft = await generateStoryDraft(project, activeChapter, "Hãy viết tiếp mạch truyện một cách tự nhiên và kịch tính nhất.");
    if (draft) {
      const newContent = localContent + (localContent ? "\n\n" : "") + draft;
      setLocalContent(newContent);
      syncToGlobal({ content: newContent });
    }
    setIsAiWriting(false);
  };

  return (
    <div className="flex h-full bg-slate-50 overflow-hidden">
      <aside className="w-72 border-r border-slate-200 flex flex-col shrink-0 bg-white">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center">
          <h3 className="font-bold text-slate-800 text-sm">Mục lục</h3>
          <button onClick={handleAddChapter} className="p-2 bg-indigo-600 text-white rounded-xl shadow-md hover:bg-indigo-700 transition-all"><svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" /></svg></button>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-1">
          {project.chapters.map((chap, idx) => (
            <button key={chap.id} onClick={() => setActiveChapterId(chap.id)} className={`w-full p-4 rounded-xl text-left border transition-all ${activeChapterId === chap.id ? 'bg-indigo-50 border-indigo-200 text-indigo-700 shadow-sm' : 'bg-white border-transparent hover:border-slate-200 text-slate-600'}`}>
              <div className="text-[9px] font-black uppercase opacity-50 mb-1 tracking-widest">Chương {idx + 1}</div>
              <div className="font-bold text-sm truncate">{chap.id === activeChapterId ? localTitle : chap.title}</div>
            </button>
          ))}
        </div>
      </aside>

      <div className="flex-1 overflow-y-auto bg-white relative">
        {activeChapter ? (
          <div className="max-w-4xl mx-auto px-16 py-12">
            <header className="flex justify-between items-start mb-10">
              <input className="text-4xl font-black text-slate-900 border-none outline-none w-full bg-transparent serif placeholder:text-slate-100" value={localTitle} onChange={e => { setLocalTitle(e.target.value); syncToGlobal({ title: e.target.value }); }} placeholder="Tiêu đề chương..." />
              <div className="flex gap-3">
                <button onClick={handleReadAloud} className={`flex items-center gap-2 px-5 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${isReading ? 'bg-red-50 text-red-600' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
                   {isReading ? (
                     <><div className="flex gap-0.5"><div className="w-1 h-3 bg-red-600 animate-pulse"></div><div className="w-1 h-3 bg-red-600 animate-pulse [animation-delay:0.2s]"></div><div className="w-1 h-3 bg-red-600 animate-pulse [animation-delay:0.4s]"></div></div> Dừng đọc</>
                   ) : '🔈 Audiobook'}
                </button>
                <button onClick={handleAiWriteNext} disabled={isAiWriting} className="flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl hover:bg-indigo-700 disabled:opacity-50">
                  {isAiWriting ? 'AI đang viết...' : 'AI Viết Tiếp'}
                </button>
              </div>
            </header>
            
            <div className="mb-12 bg-slate-50 p-6 rounded-3xl border border-slate-100">
               <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Ghi chú & Tóm tắt chương</label>
               <textarea className="w-full bg-transparent border-none outline-none text-sm italic text-slate-600 placeholder:text-slate-300 resize-none leading-relaxed" placeholder="Để AI hiểu bạn muốn viết gì tiếp theo..." rows={2} value={localSummary} onChange={e => { setLocalSummary(e.target.value); syncToGlobal({ summary: e.target.value }); }} />
            </div>

            <textarea className="w-full h-screen border-none outline-none text-xl leading-relaxed text-slate-800 serif resize-none placeholder:text-slate-100 bg-transparent" placeholder="Hành trình bắt đầu từ đây..." value={localContent} onChange={e => { setLocalContent(e.target.value); syncToGlobal({ content: e.target.value }); }} />
          </div>
        ) : (
          <div className="h-full flex items-center justify-center text-slate-300 flex-col p-10 text-center"><h3 className="text-xl font-bold uppercase tracking-widest">Bàn viết</h3><p className="max-w-xs mt-3 text-sm font-medium">Chọn hoặc tạo một chương để bắt đầu sáng tác.</p></div>
        )}

        {isAiWriting && (
          <div className="fixed bottom-10 right-10 bg-slate-900 text-white px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-4 z-50 animate-in slide-in-from-bottom-5">
            <div className="w-2 h-2 bg-indigo-400 rounded-full animate-ping"></div>
            <span className="text-[10px] font-black uppercase tracking-widest">Đồng tác giả đang phóng bút...</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default WritingDesk;
