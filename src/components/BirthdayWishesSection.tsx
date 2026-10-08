import React from 'react';
import { motion } from 'framer-motion';
import { Heart, Cake, Gift, Star } from 'lucide-react';

export const BirthdayWishesSection: React.FC = () => {
  return (
    <section className="w-full max-w-4xl mx-auto px-4 py-10">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
        className="relative rounded-3xl p-8 sm:p-10 text-center overflow-hidden bg-gradient-to-br from-[#201a38] via-[#161327] to-[#251323] border border-gold-500/30 shadow-card-elevated"
      >
        {/* Floating background decorative icons */}
        <div className="absolute -top-6 -left-6 text-gold-500/10 pointer-events-none">
          <Cake className="w-32 h-32" />
        </div>
        <div className="absolute -bottom-6 -right-6 text-rose-500/10 pointer-events-none">
          <Gift className="w-32 h-32" />
        </div>

        <div className="relative z-10 space-y-4 max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-rose-500/20 border border-rose-500/40 text-rose-300 text-xs font-bold uppercase tracking-wider">
            <Heart className="w-3.5 h-3.5 text-rose-400 fill-rose-400" />
            <span>Celebration Tribute</span>
          </div>

          <h3 className="font-serif-luxury text-3xl sm:text-4xl font-bold text-white tracking-wide">
            Wishing Dada A Very Happy Birthday! 🎂
          </h3>

          <p className="text-xs sm:text-sm text-gray-300 leading-relaxed font-normal">
            May this special birthday bring infinite joy, vibrant health, prosperity, and blessings!
            Thank you to all friends and family for joining this celebratory live lucky draw and making Dada's birthday unforgettable.
          </p>

          <div className="pt-2 flex items-center justify-center gap-2 text-gold-400">
            <Star className="w-4 h-4 fill-gold-400" />
            <span className="font-mono text-xs font-semibold tracking-wider uppercase text-gold-300">
              25 October Special Celebration
            </span>
            <Star className="w-4 h-4 fill-gold-400" />
          </div>
        </div>
      </motion.div>
    </section>
  );
};
