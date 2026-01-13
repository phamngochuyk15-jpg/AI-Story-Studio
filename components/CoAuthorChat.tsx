
import React, { useState, useRef, useEffect } from 'react';
import { Project, ChatMessage } from '../types';
import { generateCoAuthorResponse } from '../services/geminiService';

interface CoAuthorChatProps {
  project: Project;
  onUpdate: (project: Project) => void;
}

const CoAuthorChat: React.FC<CoAuthorChatProps> = ({ project, onUpdate }) => {
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [lastModelUsed, setLastModelUsed] = useState<'pro' | 'flash' | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(scrollToBottom, [project.chatHistory, isLoading]);

  const clearHistory = () => {
    if (window.confirm("Xóa lịch sử chat giúp giải phóng Token và tăng tốc độ AI. Xác nhận xóa?")) {
      onUpdate({ ...project, chatHistory: [] });
    }
  };

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMsg: ChatMessage = { role: 'user', text: input };
    const initialHistory = [...project.chatHistory, userMsg];
    
    onUpdate({ ...project, chatHistory: initialHistory });
    const currentInput = input;
    setInput('');
    setIsLoading(true);

    try {
      const result = await generateCoAuthorResponse(project, currentInput);
      
      const modelMsg: ChatMessage = { 
        role: 'model', 
        text: result.text
      };
      
      setLastModelUsed(result.modelUsed as any || null);

      onUpdate({ 
        ...project, 
        chatHistory: [...initialHistory, modelMsg],
        lastUpdated: Date.now()
      });
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const copyToCurrentChapter = (text: string) => {
    if (project.chapters.length === 0) {
      alert("Hãy tạo một chương ở Bàn Viết trước.");
      return;
    }
    const latestChapter = project.chapters[project.chapters.length - 1];
    const updatedChapter = {
      ...latestChapter,
      content: latestChapter.content + (latestChapter.content ? "\n\n" : "") + text
    };
    onUpdate({
      ...project,
      chapters: project.chapters.map(c => c.id === latestChapter.id ? updatedChapter : c),
      lastUpdated: Date.now()
    });
  };

  return (
    <div className="flex flex-col h-full bg-slate-50 overflow-hidden">
      <div className="bg-white px-8 py-3 border-b border-slate-200 flex justify-between items-center shrink-0">
        <div className="flex items-center gap-4">
           <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${lastModelUsed === 'flash' ? 'bg-amber-400' : 'bg-indigo-600'} animate-pulse`}></div>
              <span className="text-[10px] font-black text-slate-800 uppercase tracking-widest">
                Engine: {lastModelUsed === 'flash' ? 'Gemini Flash (Dự phòng)' : 'Gemini 3 Pro (Mặc định)'}
              </span>
           </div>
           {lastModelUsed === 'flash' && (
             <span className="text-[9px] bg-amber-50 text-amber-600 px-2 py-0.5 rounded border border-amber-100 font-bold">Model Pro đang tạm nghỉ</span>
           )}
        </div>
        <button 
          onClick={clearHistory}
          className="text-[10px] font-black text-slate-400 hover:text-red-500 uppercase tracking-widest px-3 py-1.5 rounded-lg hover:bg-red-50 transition-all"
        >
          Dọn dẹp ngữ cảnh
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-8 custom-scrollbar bg-[url('https://www.transparenttextures.com/patterns/paper-fibers.png')]">
        <div className="max-w-4xl mx-auto space-y-8">
          {project.chatHistory.length === 0 && (
            <div className="text-center py-20 bg-white/60 backdrop-blur-sm rounded-[40px] border border-slate-100 shadow-sm">
              <div className="text-5xl mb-6">🖋️</div>
              <h4 className="text-xl font-black text-slate-800 mb-2">Đồng tác giả thông minh</h4>
              <p className="text-slate-400 max-w-xs mx-auto text-sm font-medium">Hệ thống tự động điều phối tài nguyên để bạn viết không bị gián đoạn.</p>
            </div>
          )}

          {project.chatHistory.map((msg, i) => (
            <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[85%] group relative ${
                msg.role === 'user' 
                ? 'bg-indigo-600 text-white px-6 py-4 rounded-2xl rounded-tr-none shadow-md' 
                : 'bg-white text-slate-800 px-8 py-7 rounded-3xl rounded-tl-none border border-slate-200 shadow-lg'
              }`}>
                <div className={`text-[10px] font-bold mb-3 uppercase tracking-widest flex justify-between items-center ${
                  msg.role === 'user' ? 'opacity-60 text-indigo-100' : 'text-indigo-600'
                }`}>
                  <span>{msg.role === 'user' ? 'Tác giả' : 'Gemini AI'}</span>
                  {msg.role === 'model' && (
                    <button 
                      onClick={() => copyToCurrentChapter(msg.text)}
                      className="opacity-0 group-hover:opacity-100 transition-opacity bg-indigo-600 text-white px-3 py-1.5 rounded-lg text-[9px] font-black shadow-lg"
                    >
                      CHÈN VÀO TRUYỆN
                    </button>
                  )}
                </div>
                <div className={`whitespace-pre-wrap leading-relaxed ${
                  msg.role === 'user' ? 'text-sm' : 'text-base chat-serif text-slate-700'
                }`}>
                  {msg.text}
                </div>
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-white px-6 py-4 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-3">
                 <div className="flex gap-1">
                   <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce"></div>
                   <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce [animation-delay:0.2s]"></div>
                   <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce [animation-delay:0.4s]"></div>
                 </div>
                 <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Đang kiến tạo văn chương...</span>
              </div>
            </div>
          )}
          <div ref={chatEndRef} />
        </div>
      </div>

      <div className="p-6 bg-white border-t border-slate-200 shrink-0">
        <div className="max-w-4xl mx-auto flex gap-4">
          <textarea 
            disabled={isLoading}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
            placeholder="Mô tả ý tưởng của bạn..."
            className="flex-1 px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-600 transition-all resize-none text-sm"
            rows={1}
          />
          <button 
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
            className={`p-4 rounded-2xl transition-all ${
              input.trim() && !isLoading ? 'bg-indigo-600 text-white shadow-xl hover:scale-105' : 'bg-slate-100 text-slate-300'
            }`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 5l7 7-7 7M5 5l7 7-7 7" /></svg>
          </button>
        </div>
      </div>
    </div>
  );
};

export default CoAuthorChat;
