
import React, { useState } from 'react';
import { Project } from '../types';

interface PublishViewProps {
  project: Project;
}

const PublishView: React.FC<PublishViewProps> = ({ project }) => {
  const [isExporting, setIsExporting] = useState(false);

  const handleDownloadPDF = () => {
    const element = document.getElementById('publish-preview');
    if (!element) return;

    setIsExporting(true);

    const opt = {
      margin: 0,
      filename: `${project.title.replace(/\s+/g, '_')}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true, letterRendering: true },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
      pagebreak: { mode: ['avoid-all', 'css', 'legacy'] }
    };

    // @ts-ignore
    html2pdf().set(opt).from(element).save().then(() => {
      setIsExporting(false);
    });
  };

  const downloadTextFile = () => {
    let fullText = `${project.title.toUpperCase()}\n`;
    fullText += `Thể loại: ${project.genre}\n`;
    fullText += `------------------------------------------\n\n`;

    project.chapters.forEach((chap, idx) => {
      fullText += `CHƯƠNG ${idx + 1}: ${chap.title.toUpperCase()}\n\n`;
      fullText += `${chap.content}\n\n`;
      fullText += `==========================================\n\n`;
    });

    const blob = new Blob([fullText], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${project.title.replace(/\s+/g, '_')}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="h-full bg-slate-100 overflow-y-auto">
      {/* Thanh công cụ */}
      <div className="sticky top-0 z-20 bg-white border-b border-slate-200 px-8 py-4 flex justify-between items-center shadow-md">
        <div className="flex items-center gap-4">
          <div className="bg-indigo-600 p-2 rounded-lg">
             <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
          </div>
          <h3 className="text-sm font-black text-slate-800 uppercase">Xuất bản: {project.title}</h3>
        </div>
        
        <div className="flex gap-3">
          <button 
            onClick={downloadTextFile} 
            className="bg-white border-2 border-slate-200 text-slate-600 px-4 py-2 rounded-xl font-bold text-xs hover:bg-slate-50"
          >
            Tải File .TXT
          </button>
          <button 
            onClick={handleDownloadPDF} 
            disabled={isExporting}
            className={`bg-slate-900 text-white px-6 py-2 rounded-xl font-bold text-xs shadow-lg flex items-center gap-2 ${isExporting ? 'opacity-50 cursor-not-allowed' : 'hover:bg-slate-800'}`}
          >
            {isExporting ? (
              <>
                <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                Đang xử lý...
              </>
            ) : 'Tải PDF'}
          </button>
        </div>
      </div>

      {/* Vùng nội dung truyện */}
      <div className="p-8 md:p-12">
        <div className="max-w-[210mm] mx-auto bg-white shadow-xl" id="publish-preview">
          
          {/* Trang bìa */}
          <div className="pdf-page h-[296mm] flex flex-col items-center justify-center text-center">
            <h1 className="text-5xl font-black text-slate-900 mb-6 serif uppercase">{project.title}</h1>
            <div className="w-16 h-1 bg-indigo-600 mb-8"></div>
            <p className="text-xl font-medium text-slate-500 italic mb-2">Tác giả: AI Co-Author & Bạn</p>
            <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">Thể loại: {project.genre}</p>
          </div>

          {/* Nội dung từng chương */}
          {project.chapters.map((chap, idx) => (
            <div key={chap.id} className="pdf-page page-break book-content min-h-[296mm]">
              <div className="text-center mb-12 mt-10">
                <p className="text-[10px] font-black text-indigo-500 uppercase tracking-widest mb-2">Chương {idx + 1}</p>
                <h2 className="text-3xl font-black text-slate-900 serif">{chap.title.toUpperCase()}</h2>
              </div>
              <div className="text-[16px] text-slate-800 leading-[1.8] chat-serif whitespace-pre-wrap">
                {chap.content || "Chương này chưa có nội dung."}
              </div>
            </div>
          ))}

          {/* Trang kết thúc */}
          <div className="pdf-page page-break flex items-center justify-center h-[296mm]">
            <p className="text-slate-300 font-black text-3xl serif uppercase tracking-[0.5em]">- HẾT -</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PublishView;
