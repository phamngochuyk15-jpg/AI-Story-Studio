
import React, { useState } from 'react';
import { Project } from '../types';
import CoAuthorChat from './CoAuthorChat';
import CharacterManager from './CharacterManager';
import WritingDesk from './WritingDesk';
import WorldBible from './WorldBible';
import PublishView from './PublishView';
import RelationshipMap from './RelationshipMap';

interface ProjectViewProps {
  project: Project;
  onUpdate: (project: Project) => void;
  onBack: () => void;
}

enum Tab {
  CHAT = 'Đồng tác giả AI',
  CHARACTERS = 'Nhân vật',
  RELATIONS = 'Sơ đồ quan hệ',
  BIBLE = 'Bối cảnh',
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
      case Tab.RELATIONS:
        return <RelationshipMap project={project} onUpdate={onUpdate} />;
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

  const lastUpdatedStr = new Date(project.lastUpdated).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-white">
      <aside className="w-72 bg-slate-900 text-white flex flex-col shrink-0 border-r border-slate-800">
        <div className="p-8 border-b border-slate-800 shrink-0">
          <button onClick={onBack} className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors mb-8 text-xs font-bold uppercase tracking-widest group">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 transform group-hover:-translate-x-1 transition-transform" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" /></svg>
            Thư viện
          </button>
          <div className="space-y-2">
            <h2 className="text-xl font-black leading-tight break-words tracking-tight">{project.title}</h2>
            <div className="inline-flex w-fit px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 text-[9px] font-bold uppercase tracking-widest">{project.type}</div>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-8 space-y-10 custom-scrollbar">
          <section>
            <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-6">Thiết lập</h4>
            <div className="space-y-4 text-sm">
              <div>
                <span className="text-slate-500 block mb-2 text-[10px] font-bold uppercase">Thể loại</span>
                <input className="bg-transparent border-b border-slate-800 focus:border-indigo-500 outline-none text-slate-200 w-full pb-1 text-xs" value={project.genre} onChange={(e) => onUpdate({...project, genre: e.target.value})} />
              </div>
              <div>
                <span className="text-slate-500 block mb-2 text-[10px] font-bold uppercase">Giọng văn</span>
                <input className="bg-transparent border-b border-slate-800 focus:border-indigo-500 outline-none text-slate-200 w-full pb-1 text-xs" value={project.tone} onChange={(e) => onUpdate({...project, tone: e.target.value})} />
              </div>
            </div>
          </section>
        </div>
        <div className="p-8 border-t border-slate-800 bg-slate-900 shrink-0">
          <div className="flex items-center gap-3">
            <div className="relative flex h-2 w-2"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span><span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span></div>
            <div className="text-[9px] text-slate-400 font-black uppercase tracking-widest">AI Engine Active</div>
          </div>
        </div>
      </aside>
      <main className="flex-1 flex flex-col h-full overflow-hidden bg-slate-50">
        <header className="bg-white border-b border-slate-200 px-8 py-0 shrink-0 z-10 shadow-sm flex items-center justify-between">
          <div className="flex gap-8">
            {Object.values(Tab).map(tab => (
              <button key={tab} onClick={() => setActiveTab(tab)} className={`py-6 text-[11px] font-black uppercase tracking-widest transition-all relative ${activeTab === tab ? 'text-indigo-600' : 'text-slate-400 hover:text-slate-600'}`}>
                {tab}
                {activeTab === tab && <div className="absolute bottom-0 left-0 right-0 h-1 bg-indigo-600 rounded-t-full"></div>}
              </button>
            ))}
          </div>
          <div className="text-[10px] font-bold text-slate-400 uppercase">Lưu lần cuối: {lastUpdatedStr}</div>
        </header>
        <div className="flex-1 overflow-hidden relative">{renderContent()}</div>
      </main>
    </div>
  );
};

export default ProjectView;
