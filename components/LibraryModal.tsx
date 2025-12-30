
import React, { useState } from 'react';
import { LIBRARY_DATA } from '../libraryData';
import { FlashCardItem } from '../types';

interface CustomUnit {
  id: string;
  name: string;
  icon?: string;
  cards: FlashCardItem[];
}

interface LibraryModalProps {
  onClose: () => void;
  onSelectTopic: (topic: string, icon?: string) => void;
  customUnits?: CustomUnit[];
  onDeleteUnit?: (id: string) => void;
}

const LibraryModal: React.FC<LibraryModalProps> = ({ 
  onClose, 
  onSelectTopic, 
  customUnits = [], 
  onDeleteUnit 
}) => {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredCategories = LIBRARY_DATA.filter(cat => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      cat.category.toLowerCase().includes(term) ||
      cat.topics.some(t => t.toLowerCase().includes(term))
    );
  });

  return (
    <div className="fixed inset-0 bg-stone-900/40 backdrop-blur-md z-[150] flex items-center justify-center p-4">
      <div className="bg-white rounded-[40px] w-full max-w-2xl h-[85vh] flex flex-col shadow-2xl overflow-hidden animate-in slide-in-from-bottom-8 duration-300">
        {/* Header */}
        <div className="p-8 border-b border-stone-100 flex flex-col gap-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-3xl font-serif font-black text-slate-800">Unit Archive</h2>
              <p className="text-stone-400 text-sm font-medium uppercase tracking-widest mt-1">Manage Your Curriculum</p>
            </div>
            <button 
              onClick={onClose}
              className="w-10 h-10 rounded-full bg-stone-50 flex items-center justify-center text-stone-400 hover:bg-stone-100 transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 16 16">
                <path d="M4.646 4.646a.5.5 0 0 1 .708 0L8 7.293l2.646-2.647a.5.5 0 0 1 .708.708L8.707 8l2.647 2.646a.5.5 0 0 1-.708.708L8 8.707l-2.646 2.647a.5.5 0 0 1-.708-.708L7.293 8 4.646 5.354a.5.5 0 0 1 0-.708"/>
              </svg>
            </button>
          </div>

          <div className="relative">
            <input 
              type="text" 
              placeholder="Search through hundreds of topics..."
              className="w-full h-14 bg-stone-50 border border-stone-200 rounded-2xl px-12 text-lg focus:ring-2 focus:ring-red-500 outline-none transition-all"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <svg className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-300" xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 16 16">
              <path d="M11.742 10.344a6.5 6.5 0 1 0-1.397 1.398h-.001c.03.04.062.078.098.115l3.85 3.85a1 1 0 0 0 1.415-1.414l-3.85-3.85a1.007 1.007 0 0 0-.115-.1zM12 6.5a5.5 5.5 0 1 1-11 0 5.5 5.5 0 0 1 11 0z"/>
            </svg>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-8 bg-stone-50/30">
          
          {/* Your Collection Section */}
          {customUnits.length > 0 && !searchTerm && (
            <div className="mb-10 animate-in fade-in slide-in-from-top-4 duration-500">
               <div className="flex items-center gap-2 mb-4">
                <div className="w-1.5 h-6 bg-red-600 rounded-full"></div>
                <h3 className="font-bold text-slate-800 uppercase tracking-widest text-sm">Your Collection</h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {customUnits.map((unit) => (
                  <div key={unit.id} className="flex items-center justify-between p-4 bg-white rounded-2xl border border-stone-200 shadow-sm group hover:border-red-200 transition-all">
                    <button 
                      onClick={() => {
                        onSelectTopic(unit.name, unit.icon);
                        onClose();
                      }}
                      className="flex-1 text-left font-bold text-slate-700 truncate mr-2"
                    >
                      {unit.icon || '📂'} {unit.name}
                    </button>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteUnit?.(unit.id);
                      }}
                      className="w-8 h-8 flex items-center justify-center rounded-lg text-stone-300 hover:text-red-500 hover:bg-red-50 transition-all opacity-0 group-hover:opacity-100"
                      title="Delete Unit"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                        <path d="M5.5 5.5A.5.5 0 0 1 6 6v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5m2.5 0a.5.5 0 0 1 .5.5v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5m3 .5a.5.5 0 0 0-1 0v6a.5.5 0 0 0 1 0z"/>
                        <path d="M14.5 3a1 1 0 0 1-1 1H13v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4h-.5a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1H6a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1h3.5a1 1 0 0 1 1 1zM4.118 4 4 4.059V13a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V4.059L11.882 4zM2.5 3h11V2h-11z"/>
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex items-center gap-2 mb-6">
            <div className="w-1.5 h-6 bg-stone-300 rounded-full"></div>
            <h3 className="font-bold text-stone-400 uppercase tracking-widest text-sm">Topic Archive</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {filteredCategories.map((cat, idx) => (
              <div key={idx} className="bg-white rounded-3xl border border-stone-100 shadow-sm overflow-hidden flex flex-col">
                <div className="p-5 bg-stone-50 border-b border-stone-100 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{cat.icon}</span>
                    <h3 className="font-bold text-slate-700 tracking-tight">{cat.category}</h3>
                  </div>
                  <span className="text-[10px] font-bold text-stone-400 bg-white px-2 py-0.5 rounded-full border border-stone-100">
                    {cat.topics.length} TOPICS
                  </span>
                </div>
                <div className="p-4 flex flex-wrap gap-2">
                  {cat.topics.map((topic, tIdx) => (
                    <button
                      key={tIdx}
                      onClick={() => onSelectTopic(topic, cat.icon)}
                      className="px-3 py-1.5 bg-white border border-stone-100 rounded-xl text-xs font-semibold text-stone-500 hover:border-red-200 hover:text-red-600 hover:bg-red-50 transition-all flex items-center gap-1 group"
                    >
                      {topic}
                      <span className="opacity-0 group-hover:opacity-100 transition-opacity">→</span>
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {filteredCategories.length === 0 && (
            <div className="flex flex-col items-center justify-center h-64 text-stone-400 italic">
              <p>Nothing found in the archive, dearie. Try another word?</p>
            </div>
          )}
        </div>

        {/* Footer info */}
        <div className="p-6 bg-white border-t border-stone-100 text-center">
          <p className="text-[10px] font-bold text-stone-300 uppercase tracking-widest">
            Select a topic to generate it using Babushka's AI memory
          </p>
        </div>
      </div>
    </div>
  );
};

export default LibraryModal;
