import React from 'react';
import { Sparkles, Lock } from 'lucide-react';
import { DrawState } from '../types';

interface DrawStatusBannerProps {
  status: DrawState;
  countdownText: string;
}

export const DrawStatusBanner: React.FC<DrawStatusBannerProps> = ({ status, countdownText }) => {
  switch (status) {
    case 'BEFORE_DRAW':
      return (
        <div className="w-full bg-gradient-to-r from-blue-950/70 via-indigo-950/80 to-blue-950/70 border-y border-blue-500/30 py-2.5 px-4 text-center">
          <div className="flex items-center justify-center gap-2 text-xs sm:text-sm font-semibold text-blue-200">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-400 animate-ping inline-block" />
            <span>🔵 DRAW STARTS SOON</span>
            <span className="text-blue-400/60">•</span>
            <span className="font-mono text-blue-300">Opens in: {countdownText}</span>
          </div>
        </div>
      );

    case 'LIVE_DRAW':
      return (
        <div className="w-full bg-gradient-to-r from-amber-950/80 via-rose-950/90 to-amber-950/80 border-y border-gold-500/40 py-2.5 px-4 text-center shadow-lg shadow-gold-500/5">
          <div className="flex items-center justify-center gap-2 text-xs sm:text-sm font-bold text-gold-300">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping inline-block" />
            <span className="text-red-400">🔴 LIVE NOW</span>
            <span className="text-gold-400/60">•</span>
            <span>LUCKY DRAW IS OPEN</span>
            <span className="text-gold-400/60">•</span>
            <span className="font-mono text-gold-200">Closes in: {countdownText}</span>
          </div>
        </div>
      );

    case 'DRAW_CLOSED':
      return (
        <div className="w-full bg-gradient-to-r from-purple-950/80 via-slate-900/90 to-purple-950/80 border-y border-purple-500/30 py-2.5 px-4 text-center">
          <div className="flex items-center justify-center gap-2 text-xs sm:text-sm font-semibold text-purple-200">
            <Lock className="w-4 h-4 text-purple-400" />
            <span>🔒 DRAW CLOSED</span>
            <span className="text-purple-400/60">•</span>
            <span>Participation is locked. Winners will be announced shortly!</span>
          </div>
        </div>
      );

    case 'WINNERS_PUBLISHED':
      return (
        <div className="w-full bg-gradient-to-r from-gold-950/90 via-amber-900/90 to-gold-950/90 border-y border-gold-500/50 py-2.5 px-4 text-center shadow-gold-glow">
          <div className="flex items-center justify-center gap-2 text-xs sm:text-sm font-bold text-gold-200">
            <Sparkles className="w-4 h-4 text-gold-400 animate-spin" style={{ animationDuration: '4s' }} />
            <span>🎉 LUCKY DRAW WINNERS HAVE BEEN DECLARED! 🎉</span>
          </div>
        </div>
      );

    default:
      return null;
  }
};
