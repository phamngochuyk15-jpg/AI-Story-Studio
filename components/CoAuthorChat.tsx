
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
  const chatEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(scrollToBottom, [project.chatHistory, isLoading]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMsg: ChatMessage = { role: 'user', text: input };
    const initialHistory = [...project.chatHistory, userMsg];
    
    onUpdate({ ...project, chatHistory: initialHistory });
    setInput('');
    setIsLoading(true);

    try {
      const result = await generateCoAuthorResponse(project, input);
      
      const modelMsg: ChatMessage = { 
        role: 'model', 
        text: result.text,
        groundingUrls: result.groundingUrls 
      };
      
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
      <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
        <div className="max-w-4xl mx-auto space-y-8">
          {project.chatHistory.length === 0 && (
            <div className="text-center py-16 bg-white rounded-3xl border border-slate-200 shadow-sm p-10">
              <div className="text-5xl mb-6">🖋️</div>
              <h4 className="text-xl font-bold text-slate-800 mb-2">Hãy kể cho tôi nghe về thế giới của bạn</h4>
              <p className="text-slate-500 max-w-sm mx-auto mb-8 leading-relaxed text-sm">
                Tôi là đồng tác giả của bạn. Đừng ngần ngại mô tả những ý tưởng điên rồ nhất, tôi sẽ giúp bạn đúc kết chúng thành hồ sơ và bản thảo.
              </p>
            </div>
          )}

          {project.chatHistory.map((msg, i) => (
            <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[90%] group relative ${
                msg.role === 'user' 
                ? 'bg-indigo-600 text-white px-6 py-4 rounded-2xl rounded-tr-none shadow-md' 
                : 'bg-white text-slate-800 px-8 py-7 rounded-3xl rounded-tl-none border border-slate-200 shadow-sm'
              }`}>
                <div className={`text-[10px] font-bold mb-3 uppercase tracking-widest flex justify-between items-center ${
                  msg.role === 'user' ? 'opacity-60 text-indigo-100' : 'text-slate-400'
                }`}>
                  <span>{msg.role === 'user' ? 'Tác giả' : 'Đồng tác giả AI'}</span>
                  {msg.role === 'model' && (
                    <button 
                      onClick={() => copyToCurrentChapter(msg.text)}
                      className="opacity-0 group-hover:opacity-100 transition-opacity bg-indigo-50 text-indigo-600 px-3 py-1.5 rounded-lg text-[10px] border border-indigo-100 ml-4 font-bold"
                    >
                      CHÈN VÀO BẢN THẢO
                    </button>
                  )}
                </div>
                <div className={`whitespace-pre-wrap leading-relaxed ${
                  msg.role === 'user' ? 'text-[14px]' : 'text-[16px] chat-serif tracking-wide'
                }`}>
                  {msg.text}
                </div>

                {msg.groundingUrls && msg.groundingUrls.length > 0 && (
                  <div className="mt-6 pt-4 border-t border-slate-100">
                    <div className="text-[10px] font-black text-slate-400 uppercase mb-2 tracking-widest">Nguồn tra cứu thực tế:</div>
                    <div className="flex flex-wrap gap-2">
                      {msg.groundingUrls.map((url, idx) => (
                        <a key={idx} href={url.uri} target="_blank" rel="noopener noreferrer" className="text-[10px] bg-slate-50 text-indigo-600 px-3 py-1.5 rounded-lg border border-slate-100 hover:bg-indigo-50 transition-all font-bold truncate max-w-[200px]">
                          🔗 {url.title}
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-white px-6 py-4 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-3">
                 <div className="flex gap-1">
                   <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce"></div>
                   <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce [animation-delay:0.2s]"></div>
                   <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce [animation-delay:0.4s]"></div>
                 </div>
                 <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Đang kết nối AI...</span>
              </div>
            </div>
          )}
          <div ref={chatEndRef} />
        </div>
      </div>

      <div className="p-6 bg-white border-t border-slate-200 shrink-0 shadow-[0_-4px_20px_rgba(0,0,0,0.03)]">
        <div className="max-w-4xl mx-auto flex gap-4">
          <textarea 
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
            placeholder="Kể cho tôi nghe về ý tưởng của bạn..."
            className="flex-1 px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none resize-none transition-all text-[15px]"
            rows={1}
          />
          <button 
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
            className={`p-4 rounded-2xl transition-all ${input.trim() && !isLoading ? 'bg-indigo-600 text-white shadow-lg' : 'bg-slate-200 text-slate-400'}`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 5l7 7-7 7M5 5l7 7-7 7" /></svg>
          </button>
        </div>
      </div>
    </div>
  );
};

export default CoAuthorChat;
