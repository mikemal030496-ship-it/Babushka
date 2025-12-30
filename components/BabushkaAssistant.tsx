
import React, { useState } from 'react';
import { askBabushka } from '../services/gemini';
import Matryoshka from './Matryoshka';

interface BabushkaAssistantProps {
  currentWord: string;
}

const BabushkaAssistant: React.FC<BabushkaAssistantProps> = ({ currentWord }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [answer, setAnswer] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleAsk = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    const result = await askBabushka(query, currentWord);
    setAnswer(result);
    setLoading(false);
    setQuery('');
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {isOpen && (
        <div className="bg-white rounded-2xl shadow-2xl w-80 mb-4 overflow-hidden border border-red-100 animate-in fade-in slide-in-from-bottom-4 duration-300">
          <div className="bg-red-600 p-4 flex items-center gap-3">
            <Matryoshka className="w-8 h-8" />
            <h3 className="text-white font-bold">Ask Babushka</h3>
          </div>
          
          <div className="p-4 h-64 overflow-y-auto bg-stone-50 flex flex-col gap-3">
            {answer ? (
              <div className="text-sm text-slate-700 leading-relaxed italic bg-white p-3 rounded-lg border border-stone-200">
                "{answer}"
              </div>
            ) : (
              <p className="text-xs text-slate-400 text-center mt-12">
                "Hello, dearie! Want to know how to pronounce '{currentWord}' or what it means in Moscow?"
              </p>
            )}
            {loading && <div className="text-xs text-red-500 animate-pulse text-center">Babushka is thinking...</div>}
          </div>

          <form onSubmit={handleAsk} className="p-3 bg-white border-t flex gap-2">
            <input 
              type="text" 
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Ask a question..."
              className="flex-1 text-sm border-none focus:ring-0 outline-none"
            />
            <button 
              type="submit" 
              disabled={loading}
              className="bg-red-600 text-white p-2 rounded-lg hover:bg-red-700 transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                <path d="M15.854.146a.5.5 0 0 1 .11.54l-5.819 14.547a.75.75 0 0 1-1.329.124l-3.178-4.995L.643 7.184a.75.75 0 0 1 .124-1.33L15.314.037a.5.5 0 0 1 .54.11ZM6.636 10.07l2.761 4.338L14.13 2.576zm6.787-8.201L1.591 6.602l4.339 2.76z"/>
              </svg>
            </button>
          </form>
        </div>
      )}
      
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="w-16 h-16 rounded-full bg-red-600 flex items-center justify-center shadow-xl hover:scale-110 active:scale-95 transition-all group"
      >
        <Matryoshka className="w-10 h-10" />
        <span className="absolute -top-2 -right-2 bg-yellow-400 text-red-900 text-[10px] font-bold px-2 py-1 rounded-full border-2 border-white shadow-sm opacity-0 group-hover:opacity-100 transition-opacity">
          Chat!
        </span>
      </button>
    </div>
  );
};

export default BabushkaAssistant;
