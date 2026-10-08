import React from 'react';
import { Heart, Sparkles } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="w-full border-t border-gold-500/20 bg-[#07060d] py-10 px-4 text-center text-gray-400 space-y-3">
      <div className="flex items-center justify-center gap-2">
        <Sparkles className="w-4 h-4 text-gold-400" />
        <h4 className="font-serif-luxury text-lg font-bold text-white tracking-wide">
          Dada's Birthday Lucky Draw
        </h4>
        <Sparkles className="w-4 h-4 text-gold-400" />
      </div>

      <p className="text-xs sm:text-sm text-gold-300/80 font-medium">
        25 October • 8:00 PM – 9:00 PM IST
      </p>

      <div className="flex items-center justify-center gap-1.5 text-xs text-gray-400 pt-2">
        <span>Made with</span>
        <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500 inline" />
        <span>for the celebration</span>
      </div>

      <p className="text-[10px] text-gray-400 max-w-md mx-auto pt-1">
        Official server-side unique random number allocation and permanent cryptographic winner verification.
      </p>
    </footer>
  );
};
