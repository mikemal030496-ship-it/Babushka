import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { INITIAL_DECKS, CATEGORY_LABELS } from './constants';
import { Decks, FlashCardItem } from './types';
import Matryoshka from './components/Matryoshka';
import BabushkaAssistant from './components/BabushkaAssistant';
import LibraryModal from './components/LibraryModal';
import { generateDeck } from './services/gemini';

interface CustomUnit {
  id: string;
  name: string;
  cards: FlashCardItem[];
}

const App: React.FC = () => {
  const STORAGE_KEY_CUSTOM = 'babushka_custom_store_v2';

  const [customStore, setCustomStore] = useState<Record<string, CustomUnit>>({});
  const [currentCategory, setCurrentCategory] = useState<string>('alphabet');
  const [displayedCards, setDisplayedCards] = useState<FlashCardItem[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [showCustomModal, setShowCustomModal] = useState(false);
  const [showLibraryModal, setShowLibraryModal] = useState(false);
  const [aiTopic, setAiTopic] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [shareToast, setShareToast] = useState<string | null>(null);

  // 1. Initial Load & Shared Link Check
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY_CUSTOM);
    if (saved) {
      try {
        setCustomStore(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to load saved progress", e);
      }
    }

    const params = new URLSearchParams(window.location.search);
    const sharedData = params.get('deck');
    if (sharedData) {
      try {
        const decoded = JSON.parse(atob(sharedData));
        if (decoded.name && Array.isArray(decoded.cards)) {
          const newId = `shared_${Date.now()}`;
          const newUnit = { id: newId, name: decoded.name, cards: decoded.cards };
          
          setCustomStore(prev => {
            const updated = { ...prev, [newId]: newUnit };
            localStorage.setItem(STORAGE_KEY_CUSTOM, JSON.stringify(updated));
            return updated;
          });
          
          setCurrentCategory(newId);
          setShareToast(`Babushka: "A gift! '${decoded.name}' is in your bag!"`);
          window.history.replaceState({}, document.title, window.location.pathname);
          setTimeout(() => setShareToast(null), 4000);
        }
      } catch (e) {
        console.error("Shared deck invalid", e);
      }
    }
  }, []);

  // 2. Persist Custom Units
  useEffect(() => {
    if (Object.keys(customStore).length > 0) {
      localStorage.setItem(STORAGE_KEY_CUSTOM, JSON.stringify(customStore));
    }
  }, [customStore]);

  // 3. Computed Decks Source
  const allDecksSource = useMemo((): Decks => {
    const merged: Decks = { ...INITIAL_DECKS };
    Object.values(customStore).forEach((unit: CustomUnit) => {
      merged[unit.id] = unit.cards;
    });
    return merged;
  }, [customStore]);

  // 4. Update displayed cards when category changes
  useEffect(() => {
    const source = allDecksSource[currentCategory] || [];
    setDisplayedCards([...source]);
    setCurrentIndex(0);
    setIsFlipped(false);
  }, [currentCategory, allDecksSource]);

  const currentItem = displayedCards[currentIndex];

  const handleNext = useCallback(() => {
    if (displayedCards.length <= 1) return;
    setIsFlipped(false);
    setTimeout(() => {
      setCurrentIndex((prev) => (prev + 1) % displayedCards.length);
    }, 150);
  }, [displayedCards.length]);

  const handlePrev = useCallback(() => {
    if (displayedCards.length <= 1) return;
    setIsFlipped(false);
    setTimeout(() => {
      setCurrentIndex((prev) => (prev - 1 + displayedCards.length) % displayedCards.length);
    }, 150);
  }, [displayedCards.length]);

  const handleShuffle = () => {
    if (displayedCards.length <= 1) return;
    const arr = [...displayedCards];
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    setDisplayedCards(arr);
    setCurrentIndex(0);
    setIsFlipped(false);
    setShareToast("Babushka: 'Cards mixed up! Let's go!'");
    setTimeout(() => setShareToast(null), 2000);
  };

  const handleShareUnit = (id: string) => {
    const unit = customStore[id];
    if (!unit) return;
    const payload = btoa(JSON.stringify({ name: unit.name, cards: unit.cards }));
    const shareUrl = `${window.location.origin}${window.location.pathname}?deck=${payload}`;
    
    navigator.clipboard.writeText(shareUrl).then(() => {
      setShareToast("Magic link copied! Send it to her! ❤️");
      setTimeout(() => setShareToast(null), 3000);
    });
  };

  const handleDeleteUnit = (idToDelete: string) => {
    if (!customStore[idToDelete]) return;
    if (window.confirm(`Babushka: "Forget '${customStore[idToDelete].name}'?"`)) {
      if (currentCategory === idToDelete) setCurrentCategory('alphabet');
      setCustomStore(prev => {
        const next = { ...prev };
        delete next[idToDelete];
        return next;
      });
    }
  };

  const handleAddUnit = (name: string, cards: FlashCardItem[]) => {
    const newId = `custom_${Date.now()}`;
    setCustomStore(prev => ({
      ...prev,
      [newId]: { id: newId, name, cards }
    }));
    setCurrentCategory(newId);
    setShowCustomModal(false);
    setShowLibraryModal(false);
  };

  const handleAiGenerate = async (topicToUse?: string) => {
    const topic = (topicToUse || aiTopic).trim();
    if (!topic) return;
    setIsGenerating(true);
    try {
      const newDeckData = await generateDeck(topic);
      if (newDeckData && newDeckData.length > 0) {
        handleAddUnit(topic, newDeckData);
        setAiTopic('');
      } else {
        throw new Error("EMPTY_RESPONSE");
      }
    } catch (e: any) {
      console.error("AI Generation Error:", e);
      if (e.message === 'API_KEY_MISSING') {
        alert("Babushka: 'The samovar is cold! You forgot to put the secret API key in the Vercel project settings!'");
      } else {
        alert("Babushka: 'My brain is a bit fuzzy. Let's try again later! Check your browser console to see what happened.'");
      }
    } finally {
      setIsGenerating(false);
    }
  };

  const getLabel = (key: string) => {
    if (CATEGORY_LABELS[key] && key !== 'custom') return CATEGORY_LABELS[key];
    if (customStore[key]) return `Unit 📂: ${customStore[key].name}`;
    return key;
  };

  const deckOptions = [
    ...Object.keys(CATEGORY_LABELS).filter(k => k !== 'custom'),
    ...Object.keys(customStore).sort()
  ];

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space') { e.preventDefault(); setIsFlipped(prev => !prev); }
      if (e.code === 'ArrowRight') handleNext();
      if (e.code === 'ArrowLeft') handlePrev();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleNext, handlePrev]);

  return (
    <div className="min-h-screen flex flex-col items-center bg-stone-50 py-8 px-4 relative overflow-x-hidden">
      {shareToast && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[300] bg-slate-900 text-white px-6 py-3 rounded-2xl shadow-2xl font-bold text-sm animate-in slide-in-from-top-10 duration-300">
          {shareToast}
        </div>
      )}

      <header className="w-full max-w-md flex flex-col items-center mb-10 text-center">
        <div className="flex items-center gap-3 mb-2">
            <Matryoshka className="w-12 h-12" />
            <h1 className="text-4xl font-serif font-black text-red-600 tracking-tight">Babushka</h1>
        </div>
        <p className="text-stone-500 text-xs font-bold mb-6 uppercase tracking-[0.3em]">Russian Language Trainer</p>
        
        <div className="flex w-full gap-2">
          <select 
            value={currentCategory}
            onChange={(e) => setCurrentCategory(e.target.value)}
            className="flex-1 h-12 bg-white border border-stone-200 rounded-2xl px-4 text-sm font-bold shadow-sm outline-none appearance-none cursor-pointer"
          >
            {deckOptions.map((key) => <option key={key} value={key}>{getLabel(key)}</option>)}
          </select>
          <button onClick={() => setShowLibraryModal(true)} className="w-12 h-12 flex items-center justify-center bg-white border border-stone-200 rounded-2xl shadow-sm text-red-600">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 16 16"><path d="M1 2.5A1.5 1.5 0 0 1 2.5 1h3A1.5 1.5 0 0 1 7 2.5v9A1.5 1.5 0 0 1 5.5 13h-3A1.5 1.5 0 0 1 1 11.5zM2.5 2a.5.5 0 0 0-.5.5v9a.5.5 0 0 0 .5.5h3a.5.5 0 0 0 .5-.5v-9a.5.5 0 0 0-.5-.5z"/><path d="M9 2.5A1.5 1.5 0 0 1 10.5 1h3A1.5 1.5 0 0 1 15 2.5v9a1.5 1.5 0 0 1-1.5 1.5h-3A1.5 1.5 0 0 1 9 11.5zM10.5 2a.5.5 0 0 0-.5.5v9a.5.5 0 0 0 .5.5h3a.5.5 0 0 0 .5-.5v-9a.5.5 0 0 0-.5-.5z"/></svg>
          </button>
          <button onClick={() => setShowCustomModal(true)} className="w-12 h-12 flex items-center justify-center bg-white border border-stone-200 rounded-2xl shadow-sm text-slate-800">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 16 16"><path d="M8 4a.5.5 0 0 1 .5.5v3h3a.5.5 0 0 1 0 1h-3v3a.5.5 0 0 1-1 0v-3h-3a.5.5 0 0 1 0-1h3v-3A.5.5 0 0 1 8 4"/></svg>
          </button>
        </div>
      </header>

      {isGenerating && (
        <div className="fixed inset-0 bg-white/95 backdrop-blur-md z-[200] flex flex-col items-center justify-center text-center p-8">
          <Matryoshka className="w-24 h-24 mb-6 animate-bounce" />
          <h2 className="text-2xl font-black text-red-600 mb-2 italic">Babushka is typing...</h2>
          <p className="text-stone-400 max-w-xs font-medium italic">"Hang on dearie, making sure these words are just right for you."</p>
        </div>
      )}

      <main className="w-full max-w-sm relative h-[420px] perspective-1000">
        {currentItem ? (
          <div 
            onClick={() => setIsFlipped(!isFlipped)}
            className={`relative w-full h-full transition-all duration-700 cursor-pointer transform-style-3d ${isFlipped ? 'rotate-y-180' : ''}`}
          >
            {/* Front */}
            <div className="absolute inset-0 backface-hidden bg-white rounded-[40px] shadow-[0_30px_60px_rgba(0,0,0,0.1)] flex flex-col items-center justify-center p-8 border border-stone-100">
              <div className="absolute top-8 text-[10px] font-black text-stone-300 uppercase tracking-widest">{getLabel(currentCategory)}</div>
              <div className={`font-bold text-slate-800 text-center leading-tight break-words px-4 ${currentItem.f.length > 12 ? 'text-4xl' : 'text-6xl'}`}>
                {currentItem.f}
              </div>
              <div className="absolute bottom-10 text-stone-300 text-[10px] font-bold tracking-widest uppercase">Tap to reveal</div>
            </div>

            {/* Back */}
            <div className="absolute inset-0 backface-hidden rotate-y-180 matryoshka-gradient rounded-[40px] shadow-[0_30px_60px_rgba(0,0,0,0.2)] flex flex-col items-center justify-center p-8 text-white text-center border-4 border-white/10">
              <div className="text-4xl font-black mb-2 drop-shadow-lg">{currentItem.t}</div>
              <div className="text-xl font-medium text-red-100 italic mb-6">[{currentItem.p}]</div>
              <div className="w-12 h-1 bg-white/20 rounded-full mb-6"></div>
              <div className="bg-black/10 rounded-2xl p-4 w-full overflow-y-auto max-h-[140px]">
                <p className="text-sm font-medium leading-relaxed italic">"{currentItem.c}"</p>
              </div>
            </div>
          </div>
        ) : (
          <div className="w-full h-full bg-white rounded-[40px] border-2 border-dashed border-stone-200 flex items-center justify-center text-stone-300 font-bold italic">
            Empty unit, dearie.
          </div>
        )}
      </main>

      <section className="flex flex-col items-center gap-6 mt-10 w-full max-w-sm">
        <div className="flex items-center gap-4 w-full">
          <button onClick={handlePrev} className="w-14 h-14 rounded-full bg-white shadow-md flex items-center justify-center text-slate-400 hover:text-red-600 transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" viewBox="0 0 16 16"><path fillRule="evenodd" d="M11.354 1.646a.5.5 0 0 1 0 .708L5.707 8l5.647 5.646a.5.5 0 0 1-.708.708l-6-6a.5.5 0 0 1 0-.708l6-6a.5.5 0 0 1 .708 0"/></svg>
          </button>
          <button onClick={handleShuffle} className="flex-1 h-14 bg-slate-900 text-white rounded-full font-black text-sm tracking-widest shadow-xl hover:scale-[1.02] active:scale-95 transition-all">SHUFFLE</button>
          <button onClick={handleNext} className="w-14 h-14 rounded-full bg-white shadow-md flex items-center justify-center text-slate-400 hover:text-red-600 transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" viewBox="0 0 16 16"><path fillRule="evenodd" d="M4.646 1.646a.5.5 0 0 1 .708 0l6 6a.5.5 0 0 1 0 .708l-6 6a.5.5 0 0 1-.708-.708L10.293 8 4.646 2.354a.5.5 0 0 1 0-.708"/></svg>
          </button>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="text-stone-400 font-black text-[10px] tracking-widest uppercase">
            {displayedCards.length > 0 ? `${currentIndex + 1} / ${displayedCards.length}` : '0 / 0'}
          </div>
          {customStore[currentCategory] && (
            <div className="flex gap-2">
              <button onClick={() => handleShareUnit(currentCategory)} className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center hover:bg-blue-100">
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="currentColor" viewBox="0 0 16 16"><path d="M4.715 6.542 3.343 7.914a3 3 0 1 0 4.243 4.243l1.828-1.829A3 3 0 0 0 8.586 5.5L8 6.086a1 1 0 0 0-.154.199 2 2 0 0 1 .861 3.337L6.88 11.45a2 2 0 1 1-2.83-2.83l.793-.792a4 4 0 0 1-.128-1.287z"/><path d="M6.586 4.672A3 3 0 0 0 7.414 9.5l.775-.776a2 2 0 0 1-.896-3.346L9.12 3.55a2 2 0 1 1 2.83 2.83l-.793.792c.112.42.155.855.128 1.287l1.372-1.372a3 3 0 1 0-4.243-4.243z"/></svg>
              </button>
              <button onClick={() => handleDeleteUnit(currentCategory)} className="w-8 h-8 rounded-full bg-red-50 text-red-600 flex items-center justify-center hover:bg-red-100">
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="currentColor" viewBox="0 0 16 16"><path d="M5.5 5.5A.5.5 0 0 1 6 6v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5m2.5 0a.5.5 0 0 1 .5.5v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5m3 .5a.5.5 0 0 0-1 0v6a.5.5 0 0 0 1 0z"/><path d="M14.5 3a1 1 0 0 1-1 1H13v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4h-.5a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1H6a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1h3.5a1 1 0 0 1 1 1zM4.118 4 4 4.059V13a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V4.059L11.882 4zM2.5 3h11V2h-11z"/></svg>
              </button>
            </div>
          )}
        </div>
      </section>

      <BabushkaAssistant currentWord={currentItem?.f || "Russian"} />

      {showLibraryModal && (
        <LibraryModal 
          onClose={() => setShowLibraryModal(false)} 
          onSelectTopic={handleAiGenerate}
          customUnits={Object.values(customStore)}
          onDeleteUnit={handleDeleteUnit}
        />
      )}

      {showCustomModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-[32px] w-full max-w-sm p-8 shadow-2xl animate-in zoom-in-95">
            <h2 className="text-2xl font-black text-slate-900 mb-6">New Unit</h2>
            <div className="space-y-6">
              <div>
                <label className="text-[10px] font-black text-stone-400 uppercase tracking-widest mb-2 block">AI Topic</label>
                <div className="flex gap-2">
                  <input type="text" value={aiTopic} onChange={(e) => setAiTopic(e.target.value)} placeholder="e.g. Love, Space, Food" className="flex-1 h-12 bg-stone-50 border border-stone-200 rounded-xl px-4 text-sm outline-none font-medium" onKeyDown={(e) => e.key === 'Enter' && handleAiGenerate()} />
                  <button onClick={() => handleAiGenerate()} disabled={isGenerating || !aiTopic} className="bg-red-600 text-white px-4 rounded-xl font-bold text-xs disabled:opacity-50">Create</button>
                </div>
              </div>
            </div>
            <div className="flex gap-3 mt-10">
              <button onClick={() => setShowCustomModal(false)} className="flex-1 h-12 rounded-xl text-stone-400 font-bold text-sm">Cancel</button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .perspective-1000 { perspective: 1000px; }
        .transform-style-3d { transform-style: preserve-3d; }
        .backface-hidden { backface-visibility: hidden; }
        .rotate-y-180 { transform: rotateY(180deg); }
      `}</style>
    </div>
  );
};

export default App;