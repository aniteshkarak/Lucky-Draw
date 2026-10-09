import React from 'react';
import { Heart, Sparkles, Phone } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="w-full border-t border-gold-500/20 bg-[#07060d] py-10 px-4 text-center text-gray-400 space-y-4">
      {/* Wedding Branding */}
      <div className="flex items-center justify-center gap-2">
        <Sparkles className="w-4 h-4 text-gold-400" />
        <h4 className="font-serif-luxury text-lg font-bold text-white tracking-wide">
          Reon & Priyanka Wedding Lucky Draw
        </h4>
        <Sparkles className="w-4 h-4 text-gold-400" />
      </div>

      <p className="text-xs sm:text-sm text-gold-300/80 font-medium">
        25 October 2026 • 8:00 PM – 9:00 PM IST
      </p>

      <div className="flex items-center justify-center gap-1.5 text-xs text-gray-300">
        <span>Made with</span>
        <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500 inline" />
        <span>for the celebration</span>
      </div>

      {/* Copyright & Team Credit with Phone */}
      <div className="pt-3 border-t border-gold-500/10 max-w-lg mx-auto space-y-1.5">
        <p className="text-xs font-semibold text-gray-300">
          © All Rights Reserved under <span className="text-gold-300 font-bold">Reon Team</span>
        </p>
        <div className="flex items-center justify-center gap-1.5 text-xs text-gray-400">
          <Phone className="w-3 h-3 text-gold-400" />
          <a
            href="tel:+918918074950"
            className="text-gold-400 hover:text-gold-200 transition-colors font-mono font-medium"
          >
            +91 8918074950
          </a>
        </div>
      </div>
    </footer>
  );
};
