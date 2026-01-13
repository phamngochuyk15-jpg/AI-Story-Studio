
import React, { useState } from 'react';
import { Project } from '../types';
import CoAuthorChat from './CoAuthorChat';
import CharacterManager from './CharacterManager';
import WritingDesk from './WritingDesk';
import WorldBible from './WorldBible';
import PublishView from './PublishView';

interface ProjectViewProps {
  project: Project;
  onUpdate: (project: Project) => void;
  onBack: () => void;
}

enum Tab {
  CHAT = 'Đồng tác giả AI',
  CHARACTERS = 'Hồ sơ nhân vật',
  BIBLE = 'Bối cảnh & Thiết lập',
  WRITING = 'Bàn viết',
  PUBLISH = 'Xuất bản'
}

const ProjectView: React.FC<ProjectViewProps> = ({ project, onUpdate, onBack }) => {
  const [activeTab, setActiveTab] = useState<Tab>(Tab.CHAT);

  const renderContent = () => {
    switch (activeTab) {
      case Tab.CHAT:
        return <CoAuthorChat project={project} onUpdate={onUpdate} />;
      case Tab.CHARACTERS:
        return <CharacterManager project={project} onUpdate={onUpdate} />;
      case Tab.BIBLE:
        return <WorldBible project={project} onUpdate={onUpdate} />;
      case Tab.WRITING:
        return <WritingDesk project={project} onUpdate={onUpdate} />;
      case Tab.PUBLISH:
        return <PublishView project={project} />;
      default:
        return null;
    }
  };

  const exportToJson = () => {
    const dataStr = JSON.stringify(project, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    const exportFileDefaultName = `${project.title.replace(/\s+/g, '-').toLowerCase()}-backup.json`;
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  const downloadManuscript = () => {
    let fullText = `${project.title.toUpperCase()}\n`;
    fullText += `Thể loại: ${project.genre}\n`;
    fullText += `==============================\n\n`;
    project.chapters.forEach((chap, idx) => {
      fullText += `CHƯƠNG ${idx + 1}: ${chap.title.toUpperCase()}\n\n`;
      fullText += `${chap.content}\n\n`;
      fullText += `------------------------------\n\n`;
    });
    const dataUri = 'data:text/plain;charset=utf-8,'+ encodeURIComponent(fullText);
    const filename = `${project.title.replace(/\s+/g, '-').toLowerCase()}-ban-thao.txt`;
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', filename);
    linkElement.click();
  };

  const lastUpdatedStr = new Date(project.lastUpdated).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-white">
      <aside className="w-80 bg-slate-900 text-white flex flex-col shrink-0 border-r border-slate-800">
        <div className="p-8 border-b border-slate-800 shrink-0">
          <button onClick={onBack} className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors mb-8 text-xs font-bold uppercase tracking-widest group">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 transform group-hover:-translate-x-1 transition-transform" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" /></svg>
            Quay lại thư viện
          </button>
          <div className="space-y-3">
            <h2 className="text-2xl font-black leading-tight break-words tracking-tight">{project.title}</h2>
            <div className="flex flex-col gap-2">
              <div className="inline-flex w-fit px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 text-[10px] font-bold uppercase tracking-widest">{project.type}</div>
              <span className="text-[10px] text-slate-500 font-bold uppercase">Cập nhật lúc: {lastUpdatedStr}</span>
            </div>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-8 space-y-10 custom-scrollbar">
          <section>
            <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-6">Thiết lập gốc</h4>
            <div className="space-y-6 text-sm">
              <div className="group">
                <span className="text-slate-500 block mb-2 text-[10px] font-bold uppercase">Thể loại</span>
                <input className="bg-transparent border-b border-slate-800 hover:border-slate-700 focus:border-indigo-500 outline-none text-slate-200 w-full pb-2 transition-all" value={project.genre} onChange={(e) => onUpdate({...project, genre: e.target.value})} placeholder="Đặt thể loại..." />
              </div>
              <div className="group">
                <span className="text-slate-500 block mb-2 text-[10px] font-bold uppercase">Giọng văn</span>
                <input className="bg-transparent border-b border-slate-800 hover:border-slate-700 focus:border-indigo-500 outline-none text-slate-200 w-full pb-2 transition-all" value={project.tone} onChange={(e) => onUpdate({...project, tone: e.target.value})} placeholder="Đặt giọng văn..." />
              </div>
            </div>
          </section>
          <section>
            <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-6">Hệ thống</h4>
            <div className="space-y-3">
              <button onClick={exportToJson} className="w-full text-left px-4 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 transition-all flex items-center gap-3 group"><svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-slate-500 group-hover:text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg><span className="text-xs font-bold text-slate-300">Sao lưu (.json)</span></button>
              <button onClick={downloadManuscript} className="w-full text-left px-4 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 transition-all flex items-center gap-3 group"><svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-slate-500 group-hover:text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg><span className="text-xs font-bold text-slate-300">Tải bản thảo (.txt)</span></button>
            </div>
          </section>
        </div>
        <div className="p-8 border-t border-slate-800 bg-slate-900 shrink-0">
          <div className="flex items-center gap-3">
            <div className="relative flex h-2 w-2"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span><span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span></div>
            <div className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Co-Author Engine</div>
          </div>
        </div>
      </aside>
      <main className="flex-1 flex flex-col h-full overflow-hidden bg-slate-50">
        <header className="bg-white border-b border-slate-200 px-8 py-0 shrink-0 z-10 shadow-sm">
          <div className="flex gap-10">
            {Object.values(Tab).map(tab => (
              <button key={tab} onClick={() => setActiveTab(tab)} className={`py-6 text-xs font-black uppercase tracking-widest transition-all relative ${activeTab === tab ? 'text-indigo-600' : 'text-slate-400 hover:text-slate-600'}`}>
                {tab}
                {activeTab === tab && <div className="absolute bottom-0 left-0 right-0 h-1 bg-indigo-600 rounded-t-full"></div>}
              </button>
            ))}
          </div>
        </header>
        <div className="flex-1 overflow-hidden relative">{renderContent()}</div>
      </main>
    </div>
  );
};

export default ProjectView;
