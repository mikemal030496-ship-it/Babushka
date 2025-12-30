
export interface FlashCardItem {
  f: string; // front (Russian)
  t: string; // translation
  p: string; // phonetic
  c: string; // context/example
}

export type DeckCategory = 
  | 'alphabet' 
  | 'basics' 
  | 'numbers' 
  | 'family' 
  | 'colors' 
  | 'food' 
  | 'places' 
  | 'verbs' 
  | 'questions' 
  | 'emergency'
  | 'custom';

export interface Decks {
  [key: string]: FlashCardItem[];
}
