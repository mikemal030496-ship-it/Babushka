
import React from 'react';

interface MatryoshkaProps {
  className?: string;
  isOpen?: boolean;
}

const Matryoshka: React.FC<MatryoshkaProps> = ({ className = "w-16 h-16", isOpen = false }) => {
  return (
    <svg 
      viewBox="0 0 100 120" 
      className={`${className} transition-transform duration-700 ${isOpen ? 'rotate-12 scale-110' : ''}`}
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Outer Body */}
      <path 
        d="M50 10 C30 10, 20 30, 20 50 C20 65, 30 70, 30 85 C30 100, 20 110, 50 110 C80 110, 70 100, 70 85 C70 70, 80 65, 80 50 C80 30, 70 10, 50 10 Z" 
        fill="#D62828" 
        stroke="#800000" 
        strokeWidth="2"
      />
      
      {/* Face Area */}
      <circle cx="50" cy="40" r="18" fill="#FFD1B3" stroke="#800000" strokeWidth="1" />
      
      {/* Scarf / Kerchief Details */}
      <path d="M35 28 Q50 20 65 28" stroke="#F9C74F" strokeWidth="3" fill="none" />
      <path d="M35 52 Q50 60 65 52" stroke="#F9C74F" strokeWidth="3" fill="none" />

      {/* Eyes */}
      <circle cx="44" cy="38" r="1.5" fill="#333" />
      <circle cx="56" cy="38" r="1.5" fill="#333" />
      
      {/* Mouth */}
      <path d="M46 46 Q50 49 54 46" stroke="#D62828" strokeWidth="1.5" fill="none" />
      
      {/* Decorative Flower on Tummy */}
      <circle cx="50" cy="85" r="10" fill="#F9C74F" opacity="0.8" />
      <path d="M50 75 L50 95 M40 85 L60 85" stroke="#D62828" strokeWidth="1" />
      <path d="M43 78 L57 92 M43 92 L57 78" stroke="#D62828" strokeWidth="1" />
    </svg>
  );
};

export default Matryoshka;
