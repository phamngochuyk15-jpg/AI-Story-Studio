
import React from 'react';
import { Project } from '../types';

interface WorldBibleProps {
  project: Project;
  onUpdate: (project: Project) => void;
}

const WorldBible: React.FC<WorldBibleProps> = ({ project, onUpdate }) => {
  return (
    <div className="h-full bg-white overflow-y-auto">
      <div className="max-w-4xl mx-auto p-12">
        <div className="mb-12">
          <h2 className="text-3xl font-black text-slate-900 mb-4 tracking-tight">Bối cảnh & Thiết lập Thế giới</h2>
          <p className="text-slate-500 leading-relaxed italic">
            "Cuốn thánh kinh" của dự án. Mọi thông tin bạn điền ở đây sẽ được AI ghi nhớ để đảm bảo tính nhất quán của câu chuyện, phong cách viết blog hoặc logic thế giới.
          </p>
        </div>

        <div className="space-y-10">
          <div className="bg-slate-50 p-8 rounded-[32px] border border-slate-100 shadow-inner">
             <label className="block text-[10px] font-black text-indigo-600 uppercase tracking-[0.2em] mb-4">
               Cơ sở dữ liệu (Markdown được hỗ trợ)
             </label>
             <textarea 
               className="w-full h-[500px] bg-transparent border-none outline-none text-slate-700 leading-relaxed font-medium placeholder:text-slate-300 resize-none"
               placeholder="Mô tả bối cảnh, các quy tắc phép thuật, lịch sử thế giới, hoặc phong cách blog cá nhân tại đây..."
               value={project.worldBible}
               onChange={(e) => onUpdate({ ...project, worldBible: e.target.value })}
             />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-6 bg-indigo-50 rounded-2xl border border-indigo-100">
               <h4 className="text-sm font-bold text-indigo-900 mb-2">💡 Mẹo cho Blog</h4>
               <p className="text-xs text-indigo-700 leading-relaxed">Hãy liệt kê các từ khóa cần dùng, tone giọng (hài hước hay chuyên sâu) và đối tượng độc giả mục tiêu.</p>
            </div>
            <div className="p-6 bg-slate-50 rounded-2xl border border-slate-200">
               <h4 className="text-sm font-bold text-slate-900 mb-2">💡 Mẹo cho Tiểu thuyết</h4>
               <p className="text-xs text-slate-600 leading-relaxed">Liệt kê các mốc thời gian lớn, các vùng đất và luật lệ của thế giới để AI không bao giờ viết sai logic.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WorldBible;
