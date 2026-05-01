"use client";

import { useState } from "react";

interface FaqItemProps {
  question: string;
  answer: string;
}

export default function FaqItem({ question, answer }: FaqItemProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="border-b border-brand-border last:border-0 overflow-hidden">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between py-6 text-left focus:outline-none group"
      >
        <span className="text-base font-semibold text-brand-dark group-hover:text-brand-teal transition-colors pr-8">
          {question}
        </span>
        
        {/* Plus / Cross Icon */}
        <div className="relative flex-shrink-0 w-3.5 h-3.5 flex items-center justify-center">
          <div 
            className={`absolute w-full h-0.5 bg-brand-dark transition-all duration-300 rounded-full ${isOpen ? 'rotate-45' : 'rotate-0'}`} 
          />
          <div 
            className={`absolute w-0.5 h-full bg-brand-dark transition-all duration-300 rounded-full ${isOpen ? 'rotate-45' : 'rotate-0'}`} 
          />
        </div>
      </button>

      <div
        className={`grid transition-all duration-300 ease-in-out ${
          isOpen ? "grid-rows-[1fr] opacity-100 pb-6" : "grid-rows-[0fr] opacity-0 pb-0"
        }`}
      >
        <div className="overflow-hidden text-[0.9rem] text-brand-sage leading-relaxed">
          {answer}
        </div>
      </div>
    </div>
  );
}
