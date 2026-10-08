import React from 'react';
import { motion } from 'framer-motion';
import { Sparkles, Calendar, Clock, Ticket, Trophy, ArrowDown } from 'lucide-react';
import { DrawState } from '../types';
import { TimeRemaining } from '../utils/time';
import { soundFx } from '../utils/audio';

interface HeroSectionProps {
  status: DrawState;
  timeRemaining: TimeRemaining;
  totalParticipants: number;
  onCtaClick: () => void;
}

export const HeroSection: React.FC<HeroSectionProps> = ({
  status,
  timeRemaining,
  totalParticipants,
  onCtaClick,
}) => {
  const getCtaLabel = () => {
    switch (status) {
      case 'BEFORE_DRAW':
        return 'STARTS AT 8:00 PM IST';
      case 'LIVE_DRAW':
        return '🎲 PLAY LUCKY DRAW NOW';
      case 'DRAW_CLOSED':
        return '🔒 DRAW CLOSED';
      case 'WINNERS_PUBLISHED':
        return '🏆 VIEW WINNERS';
      default:
        return 'PARTICIPATE NOW';
    }
  };

  const isCtaDisabled = status === 'BEFORE_DRAW' || status === 'DRAW_CLOSED';

  return (
    <section className="relative pt-12 pb-16 px-4 sm:px-6 lg:px-8 text-center overflow-hidden">
      {/* Decorative Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[350px] sm:w-[600px] h-[350px] sm:h-[600px] bg-gradient-to-br from-gold-500/10 via-festive-purple/30 to-festive-crimson/20 rounded-full blur-3xl pointer-events-none -z-10" />

      <div className="max-w-4xl mx-auto space-y-6">
        {/* Birthday Badge */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-festive-card border border-gold-500/30 text-gold-300 text-xs sm:text-sm font-semibold tracking-wider uppercase shadow-gold-glow"
        >
          <Sparkles className="w-4 h-4 text-gold-400 animate-spin" style={{ animationDuration: '6s' }} />
          <span>Dada's Birthday Celebration Special</span>
          <Sparkles className="w-4 h-4 text-gold-400" />
        </motion.div>

        {/* Grand Title */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.7, delay: 0.1 }}
          className="space-y-2"
        >
          <h2 className="font-serif-luxury text-4xl sm:text-6xl md:text-7xl font-extrabold tracking-tight text-white leading-tight">
            DADA'S BIRTHDAY <br />
            <span className="gold-text-gradient font-black">LUCKY DRAW</span>
          </h2>
          <p className="text-base sm:text-xl font-medium text-gray-300 max-w-2xl mx-auto leading-relaxed">
            "Your Lucky Number Could Be Your Winning Number!"
          </p>
        </motion.div>

        {/* Date & Time Pillars */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="flex flex-wrap items-center justify-center gap-3 sm:gap-6 text-xs sm:text-sm font-semibold text-gold-200"
        >
          <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#161424]/90 border border-gold-500/20 backdrop-blur-md">
            <Calendar className="w-4 h-4 text-gold-400" />
            <span>25 OCTOBER 2026</span>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#161424]/90 border border-gold-500/20 backdrop-blur-md">
            <Clock className="w-4 h-4 text-gold-400" />
            <span>8:00 PM – 9:00 PM IST</span>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#161424]/90 border border-gold-500/20 backdrop-blur-md">
            <Ticket className="w-4 h-4 text-gold-400" />
            <span>
              {totalParticipants} {totalParticipants === 1 ? 'Participant' : 'Participants'} Joined
            </span>
          </div>
        </motion.div>

        {/* Live Countdown Clock */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="pt-2 pb-4"
        >
          <div className="text-xs uppercase tracking-widest text-gold-400/80 font-bold mb-3">
            {status === 'BEFORE_DRAW'
              ? 'Draw Starts In'
              : status === 'LIVE_DRAW'
              ? 'Participation Window Closes In'
              : status === 'WINNERS_PUBLISHED'
              ? 'Draw Completed'
              : 'Draw Window Ended'}
          </div>

          <div className="flex items-center justify-center gap-2 sm:gap-4 font-mono">
            {timeRemaining.days > 0 && (
              <div className="flex flex-col items-center p-3 sm:p-4 rounded-2xl bg-[#161424] border border-gold-500/25 min-w-[65px] sm:min-w-[85px] shadow-card-elevated">
                <span className="text-2xl sm:text-4xl font-black text-white">
                  {String(timeRemaining.days).padStart(2, '0')}
                </span>
                <span className="text-[10px] sm:text-xs text-gold-400 font-semibold uppercase tracking-wider mt-1">
                  Days
                </span>
              </div>
            )}
            <div className="flex flex-col items-center p-3 sm:p-4 rounded-2xl bg-[#161424] border border-gold-500/25 min-w-[65px] sm:min-w-[85px] shadow-card-elevated">
              <span className="text-2xl sm:text-4xl font-black text-white">
                {String(timeRemaining.hours).padStart(2, '0')}
              </span>
              <span className="text-[10px] sm:text-xs text-gold-400 font-semibold uppercase tracking-wider mt-1">
                Hours
              </span>
            </div>
            <span className="text-2xl font-bold text-gold-500/60 pb-4">:</span>
            <div className="flex flex-col items-center p-3 sm:p-4 rounded-2xl bg-[#161424] border border-gold-500/25 min-w-[65px] sm:min-w-[85px] shadow-card-elevated">
              <span className="text-2xl sm:text-4xl font-black text-white">
                {String(timeRemaining.minutes).padStart(2, '0')}
              </span>
              <span className="text-[10px] sm:text-xs text-gold-400 font-semibold uppercase tracking-wider mt-1">
                Mins
              </span>
            </div>
            <span className="text-2xl font-bold text-gold-500/60 pb-4">:</span>
            <div className="flex flex-col items-center p-3 sm:p-4 rounded-2xl bg-[#161424] border border-gold-500/25 min-w-[65px] sm:min-w-[85px] shadow-card-elevated">
              <span className="text-2xl sm:text-4xl font-black text-gold-400">
                {String(timeRemaining.seconds).padStart(2, '0')}
              </span>
              <span className="text-[10px] sm:text-xs text-gold-400 font-semibold uppercase tracking-wider mt-1">
                Secs
              </span>
            </div>
          </div>
        </motion.div>

        {/* Primary CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="pt-2 flex flex-col items-center justify-center gap-3"
        >
          <button
            onClick={() => {
              soundFx.playClick();
              onCtaClick();
            }}
            disabled={isCtaDisabled}
            className={`w-full sm:w-auto px-8 py-4 rounded-2xl text-base sm:text-lg font-bold tracking-wide transition-all duration-300 flex items-center justify-center gap-3 cursor-pointer ${
              status === 'LIVE_DRAW'
                ? 'gold-button-gradient animate-bounce'
                : status === 'WINNERS_PUBLISHED'
                ? 'bg-gradient-to-r from-gold-500 to-amber-600 text-black font-extrabold shadow-gold-glow'
                : 'bg-gray-800/80 text-gray-400 border border-gray-700 cursor-not-allowed'
            }`}
          >
            {status === 'WINNERS_PUBLISHED' ? (
              <Trophy className="w-5 h-5 text-black" />
            ) : (
              <Ticket className="w-5 h-5" />
            )}
            <span>{getCtaLabel()}</span>
            <ArrowDown className="w-4 h-4" />
          </button>

          <p className="text-xs text-gray-400">
            {status === 'LIVE_DRAW'
              ? '⚡ Exactly ONE entry per mobile number. Free to participate.'
              : status === 'BEFORE_DRAW'
              ? 'Registration opens at exactly 8:00 PM IST on 25 October.'
              : 'Winner selection is verified and permanent.'}
          </p>
        </motion.div>
      </div>
    </section>
  );
};
