import React from 'react';
import { Heart, Sparkles } from 'lucide-react';

export const WeddingWishesSection: React.FC = () => {
  return (
    <section className="w-full max-w-4xl mx-auto px-4 py-8">
      <div className="relative rounded-3xl p-8 sm:p-10 text-center overflow-hidden bg-gradient-to-br from-[#201528] via-[#161224] to-[#261420] border border-rose-500/30 shadow-2xl">
        {/* Soft decorative background circles */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-rose-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-gold-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 space-y-4 max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-rose-500/20 border border-rose-500/40 text-rose-300 text-xs font-bold uppercase tracking-wider">
            <Heart className="w-3.5 h-3.5 text-rose-400 fill-rose-400" />
            <span>Wedding Blessings & Love</span>
          </div>

          <h3 className="font-serif-luxury text-3xl sm:text-4xl font-bold text-white tracking-wide">
            Wishing Reon <span className="text-rose-300 italic">&</span> Priyanka A Lifetime of Love! 💍
          </h3>

          <p className="text-xs sm:text-sm text-gray-300 leading-relaxed font-normal">
            "May your journey together be filled with boundless joy, laughter, understanding, and lifelong companionship.
            Thank you to all our cherished family and friends for joining this joyful wedding celebration and lucky draw!"
          </p>

          <div className="pt-2 flex items-center justify-center gap-2 text-gold-400">
            <Sparkles className="w-4 h-4 text-gold-400" />
            <span className="font-mono text-xs font-semibold tracking-wider uppercase text-gold-300">
              25 October 2026 • Wedding Lucky Draw
            </span>
            <Sparkles className="w-4 h-4 text-gold-400" />
          </div>
        </div>
      </div>
    </section>
  );
};
