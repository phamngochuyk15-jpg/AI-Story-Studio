
import React, { useState, useEffect, useCallback } from 'react';
import { Project, ProjectType } from './types';
import Dashboard from './components/Dashboard';
import ProjectView from './components/ProjectView';

const STORAGE_KEY = 'AI_COAUTHOR_STUDIO_PERSISTENT_V1';

const App: React.FC = () => {
  const [projects, setProjects] = useState<Project[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (e) {
      console.error("Lỗi khôi phục dữ liệu:", e);
    }
    return [];
  });
  
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Hàm lưu trữ đồng bộ để đảm bảo an toàn dữ liệu
  const persistToDisk = (data: Project[]) => {
    setIsSaving(true);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (e) {
      console.error("Không thể lưu vào localStorage:", e);
    }
    // Hiệu ứng nhẹ để người dùng an tâm
    setTimeout(() => setIsSaving(false), 800);
  };

  const createProject = (title: string, type: ProjectType) => {
    const newProject: Project = {
      id: crypto.randomUUID(),
      title,
      type,
      genre: 'Chưa xác định',
      worldBible: '',
      tone: 'Tự nhiên',
      characters: [],
      // Fix: Add missing relationships property required by Project type
      relationships: [],
      chapters: [],
      chatHistory: [],
      lastUpdated: Date.now()
    };
    const nextProjects = [newProject, ...projects];
    setProjects(nextProjects);
    persistToDisk(nextProjects);
    setActiveProjectId(newProject.id);
  };

  const importProject = (projectData: Project) => {
    const newProject = { ...projectData, id: crypto.randomUUID(), lastUpdated: Date.now() };
    const nextProjects = [newProject, ...projects];
    setProjects(nextProjects);
    persistToDisk(nextProjects);
  };

  const updateProject = (updatedProject: Project) => {
    const index = projects.findIndex(p => p.id === updatedProject.id);
    if (index === -1) return;
    
    const nextProjects = [...projects];
    nextProjects[index] = { ...updatedProject, lastUpdated: Date.now() };
    
    setProjects(nextProjects);
    persistToDisk(nextProjects);
  };

  const deleteProject = (id: string) => {
    const nextProjects = projects.filter(p => p.id !== id);
    setProjects(nextProjects);
    persistToDisk(nextProjects);
    if (activeProjectId === id) setActiveProjectId(null);
  };

  const exportAllProjects = () => {
    const dataStr = JSON.stringify(projects, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', `all-projects-backup-${new Date().toLocaleDateString()}.json`);
    linkElement.click();
  };

  const activeProject = projects.find(p => p.id === activeProjectId);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col relative selection:bg-indigo-100">
      {/* Chỉ báo trạng thái lưu trữ */}
      <div className="fixed bottom-6 right-6 z-[9999] pointer-events-none">
        <div className={`bg-slate-900 text-white text-[10px] px-4 py-2 rounded-2xl flex items-center gap-3 border border-white/10 shadow-2xl transition-all duration-500 ${isSaving ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
          <div className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-ping"></div>
          <span className="font-black tracking-widest uppercase">Đang đồng bộ đĩa...</span>
        </div>
      </div>

      <div className="fade-in flex-1 flex flex-col">
        {activeProjectId && activeProject ? (
          <ProjectView 
            project={activeProject} 
            onUpdate={updateProject} 
            onBack={() => setActiveProjectId(null)} 
          />
        ) : (
          <Dashboard 
            projects={projects} 
            onCreate={createProject} 
            onSelect={setActiveProjectId} 
            onDelete={deleteProject}
            onImport={importProject}
            onExportAll={exportAllProjects}
          />
        )}
      </div>
    </div>
  );
};

export default App;
