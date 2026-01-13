
import React, { useState, useRef } from 'react';
import { Project, Character } from '../types';
import { generateCharacterPortrait } from '../services/geminiService';

interface CharacterManagerProps {
  project: Project;
  onUpdate: (project: Project) => void;
}

const CharacterManager: React.FC<CharacterManagerProps> = ({ project, onUpdate }) => {
  const [selectedCharacterId, setSelectedCharacterId] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isGeneratingImg, setIsGeneratingImg] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const selectedCharacter = project.characters.find(c => c.id === selectedCharacterId);

  const handleAddCharacter = () => {
    const newChar: Character = {
      id: crypto.randomUUID(),
      name: 'Nhân vật mới',
      role: 'Nhân vật chính',
      age: '',
      personality: '',
      backstory: '',
      appearance: '',
      notes: ''
    };
    onUpdate({
      ...project,
      characters: [...project.characters, newChar],
      lastUpdated: Date.now()
    });
    setSelectedCharacterId(newChar.id);
    setIsEditing(true);
  };

  const handleUpdateCharacter = (updated: Character) => {
    onUpdate({
      ...project,
      characters: project.characters.map(c => c.id === updated.id ? updated : c),
      lastUpdated: Date.now()
    });
  };

  const handleGenPortrait = async () => {
    if (!selectedCharacter || isGeneratingImg) return;
    if (!selectedCharacter.appearance) {
      alert("Vui lòng nhập mô tả ngoại hình trước để AI phác họa.");
      return;
    }
    setIsGeneratingImg(true);
    const imgBase64 = await generateCharacterPortrait(selectedCharacter, project.title);
    if (imgBase64) {
      handleUpdateCharacter({ ...selectedCharacter, imageUrl: imgBase64 });
    }
    setIsGeneratingImg(false);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedCharacter) return;

    if (file.size > 2 * 1024 * 1024) {
      alert("Dung lượng ảnh quá lớn (vui lòng chọn ảnh dưới 2MB).");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      handleUpdateCharacter({ ...selectedCharacter, imageUrl: base64 });
    };
    reader.readAsDataURL(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleDeleteCharacter = (id: string) => {
    if (window.confirm('Xóa hồ sơ nhân vật này?')) {
      onUpdate({
        ...project,
        characters: project.characters.filter(c => c.id !== id),
        lastUpdated: Date.now()
      });
      setSelectedCharacterId(null);
    }
  };

  return (
    <div className="flex h-full bg-slate-50 overflow-hidden">
      <div className="w-80 border-r border-slate-200 flex flex-col shrink-0 bg-white">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center">
          <h3 className="font-bold text-slate-800">Dàn nhân vật ({project.characters.length})</h3>
          <button onClick={handleAddCharacter} className="p-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 shadow-md transition-all">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" /></svg>
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {project.characters.map(char => (
            <button
              key={char.id}
              onClick={() => { setSelectedCharacterId(char.id); setIsEditing(false); }}
              className={`w-full p-4 rounded-xl text-left border flex items-center gap-3 transition-all ${
                selectedCharacterId === char.id ? 'bg-indigo-50 border-indigo-200 text-indigo-700 shadow-sm' : 'bg-white border-transparent hover:border-slate-200 text-slate-600'
              }`}
            >
              <div className="w-10 h-10 rounded-full bg-slate-100 shrink-0 overflow-hidden border border-slate-200">
                {char.imageUrl ? <img src={char.imageUrl} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-xs text-slate-300 uppercase">{char.name[0]}</div>}
              </div>
              <div className="truncate">
                <div className="font-bold text-sm truncate">{char.name}</div>
                <div className="text-[9px] font-bold uppercase opacity-60">{char.role}</div>
              </div>
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto bg-white">
        {selectedCharacter ? (
          <div className="max-w-4xl mx-auto p-12">
            <div className="flex gap-12 items-start mb-16">
              <div className="relative group shrink-0">
                 <div className="w-48 h-48 rounded-[40px] bg-slate-50 border-2 border-slate-100 overflow-hidden shadow-2xl relative">
                    {selectedCharacter.imageUrl ? (
                      <img src={selectedCharacter.imageUrl} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-slate-200">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                      </div>
                    )}
                    {isGeneratingImg && (
                      <div className="absolute inset-0 bg-indigo-600/80 backdrop-blur-sm flex items-center justify-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-4 border-white border-t-transparent"></div>
                      </div>
                    )}
                 </div>
                 
                 <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 flex gap-2 opacity-0 group-hover:opacity-100 transition-all">
                   <button 
                    onClick={handleGenPortrait}
                    disabled={isGeneratingImg}
                    className="bg-indigo-600 text-white text-[10px] font-black uppercase tracking-tighter px-3 py-2 rounded-full shadow-lg hover:bg-indigo-700 disabled:opacity-50 whitespace-nowrap"
                    title="AI tự động phác họa"
                   >
                     {isGeneratingImg ? '...' : 'Vẽ AI'}
                   </button>
                   <button 
                    onClick={() => fileInputRef.current?.click()}
                    className="bg-slate-900 text-white text-[10px] font-black uppercase tracking-tighter px-3 py-2 rounded-full shadow-lg hover:bg-slate-800 whitespace-nowrap"
                    title="Tải ảnh từ máy tính"
                   >
                     Tải ảnh
                   </button>
                   <input 
                    type="file" 
                    ref={fileInputRef} 
                    className="hidden" 
                    accept="image/*" 
                    onChange={handleFileUpload} 
                   />
                 </div>
              </div>

              <div className="flex-1 pt-4">
                <div className="flex justify-between items-start mb-4">
                  <div className="w-full">
                    {isEditing ? (
                      <input className="text-4xl font-black text-slate-900 border-b-2 border-indigo-600 outline-none w-full bg-transparent pb-1" value={selectedCharacter.name} onChange={e => handleUpdateCharacter({...selectedCharacter, name: e.target.value})} />
                    ) : (
                      <h2 className="text-4xl font-black text-slate-900 tracking-tight">{selectedCharacter.name}</h2>
                    )}
                    <div className="mt-4">
                      <select disabled={!isEditing} className="text-xs font-bold bg-indigo-50 text-indigo-700 px-4 py-2 rounded-xl border-none appearance-none cursor-pointer disabled:cursor-default" value={selectedCharacter.role} onChange={e => handleUpdateCharacter({...selectedCharacter, role: e.target.value})}>
                        <option>Nhân vật chính</option><option>Phản diện</option><option>Nhân vật phụ</option><option>Mentor</option><option>Love Interest</option>
                      </select>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => setIsEditing(!isEditing)} className={`px-6 py-2.5 rounded-xl font-bold text-xs transition-all ${isEditing ? 'bg-indigo-600 text-white shadow-xl' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
                      {isEditing ? 'Lưu' : 'Sửa'}
                    </button>
                    <button onClick={() => handleDeleteCharacter(selectedCharacter.id)} className="p-2.5 text-slate-300 hover:text-red-500 transition-all"><svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg></button>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-12 mt-8">
              <div className="space-y-10">
                <div><label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Ngoại hình</label>
                {isEditing ? <textarea className="w-full px-5 py-4 rounded-2xl border border-slate-200 h-48 resize-none outline-none focus:ring-2 focus:ring-indigo-500 transition-all" value={selectedCharacter.appearance} onChange={e => handleUpdateCharacter({...selectedCharacter, appearance: e.target.value})} placeholder="AI sẽ dựa vào mô tả này để phác họa ảnh sạch, không có chữ..." /> : <p className="text-slate-700 leading-relaxed font-medium">{selectedCharacter.appearance || 'Chưa mô tả.'}</p>}</div>
                <div><label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Tính cách</label>
                {isEditing ? <textarea className="w-full px-5 py-4 rounded-2xl border border-slate-200 h-48 resize-none outline-none focus:ring-2 focus:ring-indigo-500 transition-all" value={selectedCharacter.personality} onChange={e => handleUpdateCharacter({...selectedCharacter, personality: e.target.value})} /> : <p className="text-slate-700 leading-relaxed font-medium">{selectedCharacter.personality || 'Chưa liệt kê.'}</p>}</div>
              </div>
              <div className="space-y-10">
                <div><label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Tiểu sử</label>
                {isEditing ? <textarea className="w-full px-5 py-4 rounded-2xl border border-slate-200 h-48 resize-none outline-none focus:ring-2 focus:ring-indigo-500 transition-all" value={selectedCharacter.backstory} onChange={e => handleUpdateCharacter({...selectedCharacter, backstory: e.target.value})} /> : <p className="text-slate-700 leading-relaxed font-medium">{selectedCharacter.backstory || 'Một ẩn số.'}</p>}</div>
                <div><label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Tuổi & Ghi chú</label>
                {isEditing ? <input className="w-full px-5 py-4 rounded-2xl border border-slate-200 outline-none focus:ring-2 focus:ring-indigo-500 transition-all" value={selectedCharacter.age} onChange={e => handleUpdateCharacter({...selectedCharacter, age: e.target.value})} /> : <p className="text-slate-700 font-bold">{selectedCharacter.age || 'Chưa xác định'}</p>}</div>
              </div>
            </div>
          </div>
        ) : (
          <div className="h-full flex items-center justify-center text-slate-300 flex-col p-10 text-center"><h3 className="text-xl font-bold text-slate-400 uppercase tracking-wider">Hồ sơ nhân vật</h3><p className="max-w-xs mt-3 text-sm text-slate-400">Chọn hoặc tạo mới một nhân vật để quản lý.</p></div>
        )}
      </div>
    </div>
  );
};

export default CharacterManager;
