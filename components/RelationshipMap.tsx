
import React, { useState } from 'react';
import { Project, Relationship } from '../types';
import { analyzeRelationships } from '../services/geminiService';

interface RelationshipMapProps {
  project: Project;
  onUpdate: (project: Project) => void;
}

const RelationshipMap: React.FC<RelationshipMapProps> = ({ project, onUpdate }) => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const handleAnalyze = async () => {
    if (project.characters.length < 2) {
      alert("Cần ít nhất 2 nhân vật để lập sơ đồ quan hệ.");
      return;
    }
    setIsAnalyzing(true);
    try {
      const result = await analyzeRelationships(project);
      if (result && result.length > 0) {
        onUpdate({ ...project, relationships: result, lastUpdated: Date.now() });
      } else {
        alert("AI không tìm thấy mối liên kết rõ ràng. Hãy cập nhật bối cảnh thế giới chi tiết hơn.");
      }
    } catch (err) {
      alert("Lỗi khi phân tích sơ đồ. Vui lòng thử lại.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="h-full bg-slate-50 overflow-y-auto p-12">
      <div className="max-w-5xl mx-auto">
        <header className="flex flex-col md:flex-row justify-between items-start md:items-end mb-12 gap-6">
          <div>
            <h2 className="text-3xl font-black text-slate-900 mb-2 tracking-tight">Sơ đồ Quan hệ</h2>
            <p className="text-slate-500 text-sm font-medium italic">AI tự động phân tích bối cảnh và tính cách để vẽ nên mạng lưới quan hệ.</p>
          </div>
          <button 
            onClick={handleAnalyze} 
            disabled={isAnalyzing}
            className="bg-indigo-600 text-white px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl hover:bg-indigo-700 transition-all flex items-center gap-3 disabled:opacity-50"
          >
            {isAnalyzing ? (
              <><div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> Đang phân tích...</>
            ) : '⚡ Cập nhật sơ đồ'}
          </button>
        </header>

        {(!project.relationships || project.relationships.length === 0) ? (
          <div className="bg-white rounded-[40px] p-20 text-center border border-slate-100 shadow-sm flex flex-col items-center">
            <div className="text-6xl mb-6 opacity-20">🕸️</div>
            <h3 className="text-xl font-bold text-slate-800 mb-2">Chưa có dữ liệu quan hệ</h3>
            <p className="text-slate-400 max-w-xs mx-auto text-sm leading-relaxed mb-8">
              Nhấn nút "Cập nhật sơ đồ" để AI đọc lại toàn bộ bối cảnh thế giới và danh sách nhân vật, sau đó tự động đề xuất các mối liên kết.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {project.relationships.map((rel, idx) => {
              // Tìm nhân vật theo tên hoặc ID
              const fromChar = project.characters.find(c => c.id === rel.fromId || c.name === rel.fromId);
              const toChar = project.characters.find(c => c.id === rel.toId || c.name === rel.toId);
              
              return (
                <div key={idx} className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm hover:shadow-md transition-all group">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex flex-col items-center gap-2">
                      <div className="w-12 h-12 rounded-full bg-indigo-50 border border-indigo-100 flex items-center justify-center text-[10px] font-black text-indigo-600 overflow-hidden shadow-inner">
                        {fromChar?.imageUrl ? <img src={fromChar.imageUrl} className="w-full h-full object-cover" /> : <span className="uppercase">{fromChar?.name[0] || '?'}</span>}
                      </div>
                      <span className="text-[10px] font-black text-slate-900 truncate max-w-[70px] uppercase tracking-tighter">{fromChar?.name || rel.fromId}</span>
                    </div>
                    
                    <div className="flex-1 flex flex-col items-center px-4">
                      <div className="text-[9px] font-black text-indigo-600 uppercase tracking-widest mb-1.5 text-center px-2 py-0.5 bg-indigo-50 rounded-full">{rel.type}</div>
                      <div className="h-0.5 w-full bg-gradient-to-r from-indigo-100 via-indigo-300 to-indigo-100 rounded-full relative">
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[10px]">↔️</div>
                      </div>
                    </div>

                    <div className="flex flex-col items-center gap-2">
                      <div className="w-12 h-12 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center text-[10px] font-black text-slate-400 overflow-hidden shadow-inner">
                        {toChar?.imageUrl ? <img src={toChar.imageUrl} className="w-full h-full object-cover" /> : <span className="uppercase">{toChar?.name[0] || '?'}</span>}
                      </div>
                      <span className="text-[10px] font-black text-slate-900 truncate max-w-[70px] uppercase tracking-tighter">{toChar?.name || rel.toId}</span>
                    </div>
                  </div>
                  <div className="bg-slate-50 p-4 rounded-2xl">
                    <p className="text-xs text-slate-500 leading-relaxed italic text-center">"{rel.description}"</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default RelationshipMap;
