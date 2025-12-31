import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { INITIAL_DECKS, CATEGORY_LABELS } from './constants';
import { Decks, FlashCardItem } from './types';
import Matryoshka from './components/Matryoshka';
import BabushkaAssistant from './components/BabushkaAssistant';
import LibraryModal from './components/LibraryModal';
import { generateDeck, speakRussian } from './services/gemini';

interface CustomUnit {
  id: string;
  name: string;
  icon?: string;
  cards: FlashCardItem[];
}

// Audio Decoding Helpers
function decodeBase64(base64: string) {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

async function decodeAudioData(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number,
  numChannels: number,
): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
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
  const [showSummary, setShowSummary] = useState(false);
  const [aiTopic, setAiTopic] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [shareToast, setShareToast] = useState<string | null>(null);

  const audioContext = useMemo(() => new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 }), []);

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
          const newUnit = { id: newId, name: decoded.name, cards: decoded.cards, icon: decoded.icon || '🎁' };
          
          setCustomStore(prev => {
            const updated = { ...prev, [newId]: newUnit };
            localStorage.setItem(STORAGE_KEY_CUSTOM, JSON.stringify(updated));
            return updated;
          });
          
          setCurrentCategory(newId);
          setShareToast(`Dedushka: "A gift! '${decoded.name}' is in your bag!"`);
          window.history.replaceState({}, document.title, window.location.pathname);
          setTimeout(() => setShareToast(null), 4000);
        }
      } catch (e) {
        console.error("Shared deck invalid", e);
      }
    }
  }, []);

  useEffect(() => {
    if (Object.keys(customStore).length > 0) {
      localStorage.setItem(STORAGE_KEY_CUSTOM, JSON.stringify(customStore));
    }
  }, [customStore]);

  const allDecksSource = useMemo((): Decks => {
    const merged: Decks = { ...INITIAL_DECKS };
    Object.values(customStore).forEach((unit: CustomUnit) => {
      merged[unit.id] = unit.cards;
    });
    return merged;
  }, [customStore]);

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
    setShareToast("Dedushka: 'Cards mixed up! Let's go!'");
    setTimeout(() => setShareToast(null), 2000);
  };

  const handlePlayAudio = async (e: React.MouseEvent, text: string) => {
    e.stopPropagation();
    if (isPlayingAudio) return;
    setIsPlayingAudio(true);
    try {
      const base64 = await speakRussian(text);
      if (base64) {
        const bytes = decodeBase64(base64);
        const buffer = await decodeAudioData(bytes, audioContext, 24000, 1);
        const source = audioContext.createBufferSource();
        source.buffer = buffer;
        source.connect(audioContext.destination);
        source.onended = () => setIsPlayingAudio(false);
        source.start();
      } else {
        setIsPlayingAudio(false);
      }
    } catch (err) {
      console.error(err);
      setIsPlayingAudio(false);
    }
  };

  const handleShareUnit = (id: string) => {
    const unit = customStore[id];
    if (!unit) return;
    const payload = btoa(JSON.stringify({ name: unit.name, cards: unit.cards, icon: unit.icon }));
    const shareUrl = `${window.location.origin}${window.location.pathname}?deck=${payload}`;
    
    navigator.clipboard.writeText(shareUrl).then(() => {
      setShareToast("Magic link copied! Send it over! ❤️");
      setTimeout(() => setShareToast(null), 3000);
    });
  };

  const handleDeleteUnit = (idToDelete: string) => {
    if (!customStore[idToDelete]) return;
    if (window.confirm(`Dedushka: "Forget '${customStore[idToDelete].name}'?"`)) {
      if (currentCategory === idToDelete) setCurrentCategory('alphabet');
      setCustomStore(prev => {
        const next = { ...prev };
        delete next[idToDelete];
        return next;
      });
    }
  };

  const handleAddUnit = (name: string, cards: FlashCardItem[], icon: string = '✨') => {
    const newId = `custom_${Date.now()}`;
    setCustomStore(prev => ({
      ...prev,
      [newId]: { id: newId, name, cards, icon }
    }));
    setCurrentCategory(newId);
    setShowCustomModal(false);
    setShowLibraryModal(false);
  };

  const handleAiGenerate = async (topicToUse?: string, iconToUse?: string) => {
    const topic = (topicToUse || aiTopic).trim();
    if (!topic) return;
    setIsGenerating(true);
    try {
      const newDeckData = await generateDeck(topic);
      if (newDeckData && newDeckData.length > 0) {
        handleAddUnit(topic, newDeckData, iconToUse || '✨');
        setAiTopic('');
      } else {
        throw new Error("EMPTY_RESPONSE");
      }
    } catch (e: any) {
      console.error("AI Generation Error:", e);
      alert("Dedushka: 'My brain is a bit fuzzy. Let's try again in a moment!'");
    } finally {
      setIsGenerating(false);
    }
  };

  const getLabel = (key: string) => {
    if (CATEGORY_LABELS[key] && key !== 'custom') return CATEGORY_LABELS[key];
    if (customStore[key]) {
      const icon = customStore[key].icon || '📂';
      return `Unit ${icon}: ${customStore[key].name}`;
    }
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
            <h1 className="text-4xl font-serif font-black text-red-600 tracking-tight text-shadow">Babushka</h1>
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
          <h2 className="text-2xl font-black text-red-600 mb-2 italic">Dedushka is typing...</h2>
          <p className="text-stone-400 max-w-xs font-medium italic">"Hang on, making sure these words are just right for you."</p>
        </div>
      )}

      <main className="w-full max-w-sm relative h-[420px] perspective-1000">
        {currentItem ? (
          <div 
            onClick={() => setIsFlipped(!isFlipped)}
            className={`relative w-full h-full transition-all duration-700 cursor-pointer transform-style-3d ${isFlipped ? 'rotate-y-180' : ''}`}
          >
            <div className="absolute inset-0 backface-hidden bg-white rounded-[40px] shadow-[0_30px_60px_rgba(0,0,0,0.1)] flex flex-col items-center justify-center p-8 border border-stone-100">
              <div className="absolute top-8 text-[10px] font-black text-stone-300 uppercase tracking-widest">{getLabel(currentCategory)}</div>
              
              <button 
                onClick={(e) => handlePlayAudio(e, currentItem.f)}
                disabled={isPlayingAudio}
                className="absolute top-12 right-12 w-10 h-10 rounded-full bg-red-50 text-red-600 flex items-center justify-center hover:bg-red-100 disabled:opacity-50"
              >
                {isPlayingAudio ? (
                  <span className="w-4 h-4 rounded-full border-2 border-red-600 border-t-transparent animate-spin"></span>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 16 16">
                    <path d="M11.536 14.01A8.47 8.47 0 0 0 14.026 8a8.47 8.47 0 0 0-2.49-6.01l-.708.707A7.48 7.48 0 0 1 13.025 8c0 2.071-.84 3.946-2.197 5.303z"/>
                    <path d="M10.121 12.596A6.48 6.48 0 0 0 12.025 8a6.48 6.48 0 0 0-1.904-4.596l-.707.707A5.48 5.48 0 0 1 11.025 8a5.48 5.48 0 0 1-1.61 3.89z"/>
                    <path d="M8.707 11.182A4.5 4.5 0 0 0 10.025 8a4.5 4.5 0 0 0-1.318-3.182L8 5.525A3.5 3.5 0 0 1 9.025 8a3.5 3.5 0 0 1-1.025 2.475z"/>
                    <path d="M6.717 3.55A.5.5 0 0 1 7 4v8a.5.5 0 0 1-.812.39L3.825 10.5H1.5A.5.5 0 0 1 1 10V6a.5.5 0 0 1 .5-.5h2.325l2.363-1.89a.5.5 0 0 1 .529-.06z"/>
                  </svg>
                )}
              </button>

              <div className={`font-bold text-slate-800 text-center leading-tight break-words px-4 ${currentItem.f.length > 12 ? 'text-4xl' : 'text-6xl'}`}>
                {currentItem.f}
              </div>
              <div className="absolute bottom-10 text-stone-300 text-[10px] font-bold tracking-widest uppercase">Tap to reveal</div>
            </div>

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
          <button 
            onClick={() => setShowSummary(true)}
            className="text-[10px] font-black text-red-600 underline tracking-widest uppercase hover:text-red-700"
          >
            Unit Summary
          </button>
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

      {showSummary && (
        <div className="fixed inset-0 bg-stone-900/60 backdrop-blur-md z-[250] flex items-center justify-center p-4">
          <div className="bg-white rounded-[40px] w-full max-w-lg h-[80vh] flex flex-col shadow-2xl overflow-hidden animate-in slide-in-from-bottom-8">
            <div className="p-8 border-b border-stone-100 flex justify-between items-center bg-stone-50/50">
              <div>
                <h2 className="text-2xl font-serif font-black text-slate-800">Unit Summary</h2>
                <p className="text-stone-400 text-[10px] font-bold uppercase tracking-widest mt-1">{getLabel(currentCategory)}</p>
              </div>
              <button onClick={() => setShowSummary(false)} className="w-10 h-10 rounded-full bg-white shadow-sm flex items-center justify-center text-stone-400">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 16 16"><path d="M4.646 4.646a.5.5 0 0 1 .708 0L8 7.293l2.646-2.647a.5.5 0 0 1 .708.708L8.707 8l2.647 2.646a.5.5 0 0 1-.708.708L8 8.707l-2.646 2.647a.5.5 0 0 1-.708-.708L7.293 8 4.646 5.354a.5.5 0 0 1 0-.708"/></svg>
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {displayedCards.map((card, idx) => (
                <div key={idx} className="p-4 bg-white border border-stone-100 rounded-2xl flex items-center gap-4 hover:border-red-100 transition-colors">
                  <div className="w-8 h-8 rounded-full bg-stone-50 text-[10px] font-black text-stone-300 flex items-center justify-center shrink-0">
                    {idx + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-lg font-bold text-slate-800">{card.f}</div>
                    <div className="text-sm text-stone-400 italic">[{card.p}]</div>
                  </div>
                  <div className="text-right font-medium text-red-600 truncate max-w-[120px]">
                    {card.t}
                  </div>
                </div>
              ))}
            </div>
            <div className="p-6 bg-stone-50 border-t border-stone-100 text-center">
               <p className="text-[10px] font-black text-stone-300 uppercase tracking-widest">Dedushka says: "Repetition is the mother of learning!"</p>
            </div>
          </div>
        </div>
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
        .text-shadow { text-shadow: 0 4px 8px rgba(214, 40, 40, 0.1); }
      `}</style>
    </div>
  );
};

export default App;