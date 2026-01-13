
import React, { useState, useRef } from 'react';
import { Project, ProjectType } from '../types';

interface DashboardProps {
  projects: Project[];
  onCreate: (title: string, type: ProjectType) => void;
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
  onImport: (project: Project) => void;
  onExportAll: () => void;
}

const Dashboard: React.FC<DashboardProps> = ({ projects, onCreate, onSelect, onDelete, onImport, onExportAll }) => {
  const [showModal, setShowModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newType, setNewType] = useState<ProjectType>(ProjectType.NOVEL);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    onCreate(newTitle, newType);
    setNewTitle('');
    setShowModal(false);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const project = JSON.parse(event.target?.result as string);
        if (project.title && project.chapters) {
          onImport(project);
        }
      } catch (err) {
        alert("File không đúng định dạng dự án.");
      }
    };
    reader.readAsText(file);
    if (e.target) e.target.value = '';
  };

  return (
    <div className="max-w-6xl mx-auto p-8 md:p-12 w-full fade-in">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-16 gap-8">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <div className="bg-indigo-600 p-2 rounded-xl shadow-lg">
               <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
               </svg>
            </div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">Co-Author Studio</h1>
          </div>
          <p className="text-slate-500 font-medium italic">Nơi những ý tưởng vĩ đại trở thành hiện thực.</p>
        </div>
        
        <div className="flex flex-wrap gap-3">
          <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept=".json" />
          {projects.length > 0 && (
            <button onClick={onExportAll} className="bg-slate-900 text-white px-5 py-3 rounded-2xl font-bold hover:bg-slate-800 transition-all text-xs shadow-lg">
              Sao lưu toàn bộ
            </button>
          )}
          <button onClick={() => fileInputRef.current?.click()} className="bg-white border border-slate-200 text-slate-600 px-5 py-3 rounded-2xl font-bold hover:bg-slate-50 transition-all text-xs">
            Nhập file
          </button>
          <button onClick={() => setShowModal(true)} className="bg-indigo-600 text-white px-6 py-3 rounded-2xl font-bold hover:bg-indigo-700 transition-all shadow-xl text-xs">
            + Tạo tác phẩm mới
          </button>
        </div>
      </header>

      {projects.length === 0 ? (
        <div className="bg-white rounded-[40px] p-20 text-center border border-slate-100 shadow-xl flex flex-col items-center">
          <div className="mb-8 p-6 bg-indigo-50 rounded-full">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-7.714 2.143L11 21l-2.286-6.857L1 12l7.714-2.143L11 3z" />
            </svg>
          </div>
          <h2 className="text-3xl font-black text-slate-900 mb-4 tracking-tight">Thế giới của bạn đang chờ được khai bút</h2>
          <p className="text-slate-400 mb-10 max-w-sm font-medium leading-relaxed">Hãy bắt đầu hành trình sáng tạo cùng đồng tác giả AI chuyên nghiệp ngay hôm nay.</p>
          <button onClick={() => setShowModal(true)} className="bg-indigo-600 text-white px-10 py-5 rounded-2xl font-black hover:bg-indigo-700 transition-all shadow-2xl shadow-indigo-200 text-sm uppercase tracking-widest">
            Khai bút ngay
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {projects.map(project => (
            <div 
              key={project.id}
              className="bg-white rounded-[32px] border border-slate-100 shadow-sm hover:shadow-2xl transition-all group relative flex flex-col h-full overflow-hidden"
            >
              {/* VÙNG NÚT XÓA - CÔ LẬP SỰ KIỆN */}
              <div className="absolute top-5 right-5 z-50">
                {deletingId === project.id ? (
                  <div className="flex gap-1 animate-in slide-in-from-right-2 duration-200">
                    <button 
                      onClick={(e) => { e.stopPropagation(); onDelete(project.id); setDeletingId(null); }}
                      className="bg-red-600 text-white px-3 py-2 rounded-lg text-[9px] font-black uppercase hover:bg-red-700 shadow-lg"
                    >
                      Xác nhận xóa
                    </button>
                    <button 
                      onClick={(e) => { e.stopPropagation(); setDeletingId(null); }}
                      className="bg-slate-200 text-slate-600 px-3 py-2 rounded-lg text-[9px] font-black uppercase hover:bg-slate-300"
                    >
                      Hủy
                    </button>
                  </div>
                ) : (
                  <button 
                    onClick={(e) => { e.stopPropagation(); setDeletingId(project.id); }}
                    className="p-2.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                )}
              </div>

              {/* VÙNG CLICK CHÍNH */}
              <div 
                onClick={() => onSelect(project.id)}
                className="p-8 cursor-pointer flex flex-col flex-1"
              >
                <div className="text-[9px] font-black text-indigo-600 uppercase tracking-widest bg-indigo-50 w-fit px-3 py-1 rounded-lg mb-4">
                  {project.type}
                </div>
                <h3 className="text-xl font-black text-slate-900 leading-tight mb-4 group-hover:text-indigo-600 transition-colors">
                  {project.title}
                </h3>
                <div className="mt-auto pt-6 border-t border-slate-50 flex justify-between items-center">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">
                    {project.chapters.length} chương • {project.genre}
                  </span>
                  <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center group-hover:bg-indigo-600 group-hover:text-white transition-all shadow-sm">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* MODAL TẠO MỚI */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-md flex items-center justify-center z-[100] p-6">
          <div className="bg-white rounded-[32px] p-10 max-w-md w-full shadow-2xl animate-in zoom-in duration-200">
            <h2 className="text-2xl font-black text-slate-900 mb-8">Bắt đầu hành trình mới</h2>
            <form onSubmit={handleCreate}>
              <div className="space-y-6">
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Tên dự án</label>
                  <input autoFocus type="text" value={newTitle} onChange={e => setNewTitle(e.target.value)} className="w-full px-5 py-4 rounded-xl bg-slate-50 border-none outline-none focus:ring-2 focus:ring-indigo-600 transition-all font-bold" placeholder="Tên tác phẩm..." />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Loại hình</label>
                  <div className="grid grid-cols-2 gap-2">
                    {Object.values(ProjectType).map(type => (
                      <button key={type} type="button" onClick={() => setNewType(type)} className={`px-4 py-3 rounded-xl border-2 text-[11px] font-black transition-all ${newType === type ? 'bg-indigo-600 border-indigo-600 text-white' : 'bg-white border-slate-100 text-slate-400 hover:border-slate-200'}`}>
                        {type}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              <div className="flex gap-3 mt-10">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 px-4 py-4 rounded-xl font-bold text-slate-400 hover:bg-slate-50 text-xs">Bỏ qua</button>
                <button type="submit" disabled={!newTitle.trim()} className="flex-1 bg-indigo-600 text-white px-4 py-4 rounded-xl font-black hover:bg-indigo-700 transition-all disabled:opacity-30 text-xs shadow-lg">Tạo dự án</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
