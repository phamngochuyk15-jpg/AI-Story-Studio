
import React from 'react';
import { Project } from '../types';

interface PublishViewProps {
  project: Project;
}

const PublishView: React.FC<PublishViewProps> = ({ project }) => {
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="h-full bg-slate-100 overflow-y-auto">
      {/* Thanh điều khiển */}
      <div className="sticky top-0 z-20 bg-white/80 backdrop-blur-md border-b border-slate-200 px-12 py-4 flex justify-between items-center no-print shadow-sm">
        <div>
          <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">Chế độ xuất bản</h3>
          <p className="text-[10px] text-slate-500 font-bold uppercase">A4 Layout • Book Format • High Quality</p>
        </div>
        <button 
          onClick={handlePrint}
          className="bg-indigo-600 text-white px-8 py-3 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all flex items-center gap-3"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg>
          Xuất PDF chuyên nghiệp
        </button>
      </div>

      {/* Khu vực xem trước dàn trang */}
      <div className="max-w-[210mm] mx-auto my-12 bg-white shadow-2xl p-[2cm] min-h-[297mm] transition-all" id="publish-preview">
        
        {/* TRANG LÓT (TITLE PAGE) */}
        <div className="h-[25cm] flex flex-col items-center justify-center text-center border-4 border-slate-900 p-12 mb-[2cm]">
          <div className="text-[10px] font-black tracking-[0.4em] uppercase text-slate-400 mb-20">Tác phẩm của AI Co-Author Studio</div>
          <h1 className="text-6xl font-black text-slate-900 mb-8 leading-tight tracking-tighter serif">{project.title.toUpperCase()}</h1>
          <div className="w-24 h-1 bg-indigo-600 mb-12"></div>
          <div className="text-xl font-bold text-slate-600 tracking-widest uppercase mb-4">Thể loại: {project.genre}</div>
          <div className="text-sm text-slate-400 italic">Dự án: {project.type}</div>
          <div className="mt-auto text-sm font-bold text-slate-900 uppercase tracking-[0.2em]">© 2025 Sáng tác cùng AI</div>
        </div>

        {/* MỤC LỤC (TABLE OF CONTENTS) */}
        <div className="page-break py-16">
          <h2 className="text-3xl font-black text-slate-900 mb-12 border-b-2 border-slate-900 pb-4 serif">MỤC LỤC</h2>
          <div className="space-y-6">
            {project.chapters.map((chap, idx) => (
              <div key={chap.id} className="flex items-end gap-2 group">
                <span className="text-slate-400 font-bold uppercase text-[10px] tracking-widest whitespace-nowrap">Chương {idx + 1}</span>
                <span className="text-slate-800 font-bold text-lg leading-none border-b border-slate-100 flex-1 pb-1">{chap.title}</span>
                <span className="text-slate-300 font-mono">...........</span>
              </div>
            ))}
          </div>
        </div>

        {/* NỘI DUNG CHI TIẾT */}
        {project.chapters.map((chap, idx) => (
          <div key={chap.id} className="page-break py-20 book-content">
            <div className="text-center mb-16">
              <span className="text-[10px] font-black text-indigo-600 uppercase tracking-[0.5em] mb-4 block">Chương {idx + 1}</span>
              <h2 className="text-4xl font-black text-slate-900 serif leading-tight">{chap.title.toUpperCase()}</h2>
              <div className="flex justify-center mt-6">
                <div className="w-12 h-px bg-slate-200"></div>
                <div className="mx-4 text-slate-300">⬥</div>
                <div className="w-12 h-px bg-slate-200"></div>
              </div>
            </div>
            
            <div className="text-lg text-slate-800 leading-[2] chat-serif whitespace-pre-wrap">
              {chap.content || <p className="italic text-slate-400">Nội dung chương này đang được để trống...</p>}
            </div>
          </div>
        ))}

        {/* TRANG CUỐI */}
        <div className="page-break flex items-center justify-center h-[20cm]">
          <div className="text-center space-y-4">
            <div className="text-4xl font-black text-slate-200 serif">- HẾT -</div>
            <p className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">Tác phẩm được hoàn thiện vào ngày {new Date().toLocaleDateString('vi-VN')}</p>
          </div>
        </div>
      </div>
      
      {/* Tip Box */}
      <div className="max-w-[210mm] mx-auto mb-12 p-8 bg-indigo-50 rounded-3xl border border-indigo-100 no-print flex items-center gap-6">
        <div className="text-4xl">🖨️</div>
        <div>
          <h4 className="font-bold text-indigo-900">Mẹo xuất bản chuyên nghiệp</h4>
          <p className="text-sm text-indigo-700 leading-relaxed">
            Khi hộp thoại in hiện lên, hãy chọn <b>"Save as PDF"</b>. Trong mục <b>More settings</b>, hãy đảm bảo đã tắt <b>Headers and footers</b> và bật <b>Background graphics</b> để có kết quả đẹp nhất.
          </p>
        </div>
      </div>
    </div>
  );
};

export default PublishView;
