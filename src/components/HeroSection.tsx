import React from 'react';
import { Calendar, Clock, Ticket, Trophy, ArrowDown, Heart, Sparkles } from 'lucide-react';
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
  const isBefore = status === 'BEFORE_DRAW' || status === 'SCHEDULED';
  const isLive = status === 'LIVE_DRAW' || status === 'LIVE';
  const isWinners = status === 'WINNERS_PUBLISHED';

  const getCtaLabel = () => {
    if (isBefore) return 'Starts at 8:00 PM IST';
    if (isLive) return 'Get Your Lucky Number';
    if (isWinners) return 'View Winners';
    return 'Draw Closed';
  };

  const isCtaDisabled = isBefore || (!isLive && !isWinners);

  return (
    <section className="pt-6 pb-10 px-4 text-center max-w-4xl mx-auto space-y-6">
      {/* Wedding Badge */}
      <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-gradient-to-r from-rose-500/20 via-gold-500/20 to-rose-500/20 border border-rose-400/40 text-rose-200 text-xs font-semibold tracking-wider uppercase shadow-md">
        <Sparkles className="w-3.5 h-3.5 text-gold-300" />
        <span>Wedding Celebration Special</span>
        <Heart className="w-3.5 h-3.5 text-rose-400 fill-rose-400" />
      </div>

      {/* Couple Portrait Card Showcase */}
      <div className="relative max-w-xs sm:max-w-sm mx-auto my-2">
        <div className="absolute -inset-1.5 bg-gradient-to-r from-rose-500 via-gold-400 to-amber-500 rounded-3xl blur-md opacity-40 animate-pulse" />
        <div className="relative rounded-2xl overflow-hidden border-2 border-gold-400/50 shadow-2xl bg-[#161326]">
          <img
            src="/assets/couple.jpg"
            alt="Reon Merchant & Priyanka Wedding Celebration"
            className="w-full h-auto object-cover max-h-[380px] sm:max-h-[440px] hover:scale-105 transition-transform duration-700"
            loading="eager"
          />
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent p-4 text-center">
            <h3 className="font-serif-luxury text-xl sm:text-2xl font-bold text-white tracking-wide">
              Reon <span className="text-rose-300 font-serif italic">&</span> Priyanka
            </h3>
            <p className="text-[11px] text-gold-300 tracking-widest uppercase font-medium">
              Forever Together • Wedding Celebration
            </p>
          </div>
        </div>
      </div>

      {/* Main Title & Subtitle */}
      <div className="space-y-2 pt-2">
        <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white font-serif-luxury">
          WEDDING <span className="gold-text-gradient">LUCKY DRAW</span>
        </h2>
        <p className="text-sm sm:text-base text-gray-300 max-w-lg mx-auto">
          "Your Lucky Number Could Be Your Winning Gift!"
        </p>
      </div>

      {/* Date, Time & Participants Pills */}
      <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-4 text-xs font-medium text-gold-200">
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#161424] border border-gold-500/20">
          <Calendar className="w-3.5 h-3.5 text-gold-400" />
          <span>25 October 2026</span>
        </div>
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#161424] border border-gold-500/20">
          <Clock className="w-3.5 h-3.5 text-gold-400" />
          <span>8:00 PM – 9:00 PM IST</span>
        </div>
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#161424] border border-gold-500/20">
          <Ticket className="w-3.5 h-3.5 text-gold-400" />
          <span>{totalParticipants} Joined</span>
        </div>
      </div>

      {/* Countdown Timer */}
      <div className="pt-2">
        <div className="text-[11px] uppercase tracking-wider text-gray-400 font-semibold mb-2">
          {isBefore ? 'THE DRAW STARTS SOON' : isLive ? 'LUCKY DRAW IS LIVE' : 'DRAW CLOSED'}
        </div>

        <div className="flex items-center justify-center gap-2 sm:gap-3 font-mono">
          {timeRemaining.days > 0 && (
            <div className="flex flex-col items-center p-2.5 sm:p-3 rounded-xl bg-[#161424] border border-gold-500/20 min-w-[55px] sm:min-w-[70px]">
              <span className="text-xl sm:text-3xl font-bold text-white">
                {String(timeRemaining.days).padStart(2, '0')}
              </span>
              <span className="text-[9px] sm:text-[10px] text-gray-400 uppercase">Days</span>
            </div>
          )}
          <div className="flex flex-col items-center p-2.5 sm:p-3 rounded-xl bg-[#161424] border border-gold-500/20 min-w-[55px] sm:min-w-[70px]">
            <span className="text-xl sm:text-3xl font-bold text-white">
              {String(timeRemaining.hours).padStart(2, '0')}
            </span>
            <span className="text-[9px] sm:text-[10px] text-gray-400 uppercase">Hours</span>
          </div>
          <span className="text-xl font-bold text-gold-500/60 pb-2">:</span>
          <div className="flex flex-col items-center p-2.5 sm:p-3 rounded-xl bg-[#161424] border border-gold-500/20 min-w-[55px] sm:min-w-[70px]">
            <span className="text-xl sm:text-3xl font-bold text-white">
              {String(timeRemaining.minutes).padStart(2, '0')}
            </span>
            <span className="text-[9px] sm:text-[10px] text-gray-400 uppercase">Mins</span>
          </div>
          <span className="text-xl font-bold text-gold-500/60 pb-2">:</span>
          <div className="flex flex-col items-center p-2.5 sm:p-3 rounded-xl bg-[#161424] border border-gold-500/20 min-w-[55px] sm:min-w-[70px]">
            <span className="text-xl sm:text-3xl font-bold text-gold-400">
              {String(timeRemaining.seconds).padStart(2, '0')}
            </span>
            <span className="text-[9px] sm:text-[10px] text-gray-400 uppercase">Secs</span>
          </div>
        </div>
      </div>

      {/* CTA */}
      <div className="pt-2">
        <button
          onClick={() => {
            soundFx.playClick();
            onCtaClick();
          }}
          disabled={isCtaDisabled}
          className={`w-full sm:w-auto px-8 py-3.5 rounded-xl text-base font-bold transition-all flex items-center justify-center gap-2 mx-auto cursor-pointer ${
            isLive
              ? 'bg-gold-500 hover:bg-gold-400 text-black shadow-lg shadow-gold-500/20'
              : isWinners
              ? 'bg-gold-500 text-black font-bold'
              : 'bg-gray-800 text-gray-400 border border-gray-700 cursor-not-allowed'
          }`}
        >
          {isWinners ? (
            <Trophy className="w-4 h-4 text-black" />
          ) : (
            <Ticket className="w-4 h-4" />
          )}
          <span>{getCtaLabel()}</span>
          <ArrowDown className="w-4 h-4" />
        </button>
      </div>
    </section>
  );
};
