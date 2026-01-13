
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
      
      const modelMsg: ChatMessage = { role: 'model', text: result.text };
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
              <h4 className="text-xl font-bold text-slate-800 mb-2">
                Hãy kể cho tôi nghe về thế giới của bạn
              </h4>
              <p className="text-slate-500 max-w-sm mx-auto mb-8 leading-relaxed">
                Tôi là đồng tác giả của bạn. Đừng ngần ngại mô tả những ý tưởng điên rồ nhất, tôi sẽ giúp bạn đúc kết chúng thành hồ sơ và bản thảo.
              </p>
              <div className="flex flex-wrap justify-center gap-3">
                <button 
                  onClick={() => setInput("Tôi muốn viết về một thế giới bị xâm chiếm bởi Hư Không, nơi con người chỉ còn vài thành trì cuối cùng.")} 
                  className="text-xs bg-indigo-50 text-indigo-600 px-5 py-2.5 rounded-xl hover:bg-indigo-100 transition-all font-bold border border-indigo-100 shadow-sm"
                >
                  Gợi ý thế giới quan
                </button>
              </div>
            </div>
          )}

          {project.chatHistory.map((msg, i) => (
            <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[88%] group relative ${
                msg.role === 'user' 
                ? 'bg-indigo-600 text-white px-6 py-4 rounded-2xl rounded-tr-none shadow-md shadow-indigo-100' 
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
                  msg.role === 'user' 
                  ? 'text-[14px] font-medium' 
                  : 'text-[17px] chat-serif tracking-wide'
                }`}>
                  {msg.text}
                </div>
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-white px-6 py-4 rounded-2xl border border-slate-200 shadow-sm">
                 <div className="flex gap-2">
                   <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce"></div>
                   <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce [animation-delay:0.2s]"></div>
                   <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce [animation-delay:0.4s]"></div>
                 </div>
              </div>
            </div>
          )}
          <div ref={chatEndRef} />
        </div>
      </div>

      <div className="p-6 bg-white border-t border-slate-200 shrink-0 shadow-[0_-4px_20px_rgba(0,0,0,0.03)]">
        <div className="max-w-4xl mx-auto">
          <div className="relative">
            <textarea 
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              placeholder="Chia sẻ ý tưởng cốt truyện hoặc thảo luận về nhân vật..."
              className="w-full pl-6 pr-16 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none resize-none transition-all shadow-inner text-[15px]"
              rows={2}
            />
            <button 
              onClick={handleSend}
              disabled={!input.trim() || isLoading}
              className={`absolute right-3 bottom-3 p-3 rounded-xl transition-all ${
                input.trim() && !isLoading ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200' : 'bg-slate-200 text-slate-400'
              }`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CoAuthorChat;
