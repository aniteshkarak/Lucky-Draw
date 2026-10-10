import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import confetti from 'canvas-confetti';
import { Trophy, Crown, Medal, Lock, ShieldCheck, Loader2 } from 'lucide-react';
import { WinnersData, DrawState } from '../types';
import { formatPlayedAt, formatDisplayTime } from '../utils/time';
import { soundFx } from '../utils/audio';

interface WinnerRevealSectionProps {
  winnersData: WinnersData;
  status?: DrawState;
  endTime?: string;
  startTime?: string;
  eventDate?: string;
  totalParticipants?: number;
  isLoading?: boolean;
}

// Rolling digit component for dramatic winner reveal
const RollingNumber: React.FC<{ value: number }> = ({ value }) => {
  const [displayNum, setDisplayNum] = useState(10000);

  useEffect(() => {
    let frame = 0;
    const totalFrames = 30;
    const interval = setInterval(() => {
      frame++;
      if (frame >= totalFrames) {
        setDisplayNum(value);
        clearInterval(interval);
      } else {
        setDisplayNum(Math.floor(10000 + Math.random() * 90000));
      }
    }, 40);
    return () => clearInterval(interval);
  }, [value]);

  return <span className="font-mono tracking-widest">{displayNum}</span>;
};

export const WinnerRevealSection: React.FC<WinnerRevealSectionProps> = ({
  winnersData,
  status,
  endTime,
  totalParticipants = 0,
  isLoading = false,
}) => {
  const hasWinners = winnersData.winners_exist;
  const isClosed = status === 'DRAW_CLOSED' || status === 'CLOSED';
  const endFormatted = formatDisplayTime(endTime || '21:00:00');

  useEffect(() => {
    if (hasWinners) {
      soundFx.playWinnerFanfare();
      try {
        confetti({
          particleCount: 120,
          spread: 80,
          origin: { y: 0.5 },
          colors: ['#ffd054', '#f5b516', '#ffffff', '#e11d48', '#38bdf8'],
        });
      } catch {
        // ignore
      }
    }
  }, [hasWinners]);

  return (
    <section id="winners-section" className="w-full max-w-5xl mx-auto px-4 py-12">
      <div className="text-center space-y-3 mb-10">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-gold-500/15 border border-gold-500/30 text-gold-300 text-xs font-bold uppercase tracking-widest">
          <Trophy className="w-4 h-4 text-gold-400" />
          <span>Official Prize Podium</span>
        </div>

        <h3 className="font-serif-luxury text-3xl sm:text-5xl font-extrabold text-white tracking-tight">
          {hasWinners ? (
            <>
              🎉 <span className="gold-text-gradient">LUCKY DRAW WINNERS</span> 🎉
            </>
          ) : isClosed ? (
            'WINNER ANNOUNCEMENT'
          ) : (
            'UPCOMING WINNER ANNOUNCEMENT'
          )}
        </h3>

        <p className="text-xs sm:text-sm text-gray-400 max-w-xl mx-auto">
          {hasWinners
            ? 'Congratulations to the official winners of Reon & Priyanka\'s Wedding Lucky Draw! All prizes are permanently locked.'
            : isClosed && totalParticipants > 0
            ? `The lucky draw concluded at ${endFormatted} IST! Announcing winners drawn from registered entries.`
            : isClosed && totalParticipants === 0
            ? `The lucky draw concluded at ${endFormatted} IST with 0 registered participants.`
            : `Winners will be randomly drawn from all registered participants at ${endFormatted} IST.`}
        </p>
      </div>

      {isLoading ? (
        <div className="p-12 text-center rounded-3xl glass-panel border border-gold-500/20 max-w-md mx-auto space-y-3">
          <Loader2 className="w-8 h-8 text-gold-400 animate-spin mx-auto" />
          <p className="text-sm font-semibold text-gold-200">Loading Official Results...</p>
        </div>
      ) : !hasWinners ? (
        /* Pre-Winner / Pending Draw Cards */
        isClosed && totalParticipants === 0 ? (
          <div className="max-w-md mx-auto p-6 rounded-3xl bg-[#141224] border border-gold-500/30 text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center mx-auto text-amber-400">
              <Trophy className="w-6 h-6" />
            </div>
            <h4 className="text-lg font-bold text-white">Draw Session Concluded</h4>
            <p className="text-xs text-gray-400 leading-relaxed">
              No participants joined during this session before {endFormatted} IST. You can open the <strong>Admin Panel</strong> (lock icon in navbar) to schedule a new draw time or add participants.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            {/* 2nd Prize Teaser */}
            <div className="glass-panel rounded-3xl p-6 text-center border-slate-400/20 opacity-80 order-2 md:order-1">
              <div className="w-12 h-12 rounded-2xl bg-slate-500/10 border border-slate-400/30 flex items-center justify-center mx-auto mb-3 text-slate-300">
                <Medal className="w-6 h-6" />
              </div>
              <span className="text-xs font-bold text-slate-300 uppercase tracking-widest block">
                🥈 2nd Prize
              </span>
              <div className="my-4 py-3 rounded-xl bg-[#121020] border border-slate-500/20 font-mono text-gray-500 text-lg flex items-center justify-center gap-2">
                <Lock className="w-4 h-4" />
                <span>?????</span>
              </div>
              <p className="text-[11px] text-gray-400">
                {isClosed ? 'Drawing Winner...' : `Revealing at ${endFormatted} IST`}
              </p>
            </div>

            {/* 1st Prize Teaser */}
            <div className="glass-panel-glow rounded-3xl p-8 text-center border-gold-500/40 relative order-1 md:order-2 md:-translate-y-4 shadow-gold-glow">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-gold-500 text-black font-extrabold text-[10px] uppercase tracking-wider">
                Grand Prize
              </div>
              <div className="w-14 h-14 rounded-2xl bg-gold-500/20 border border-gold-500/40 flex items-center justify-center mx-auto mb-3 text-gold-400 animate-bounce">
                <Crown className="w-8 h-8" />
              </div>
              <span className="text-sm font-extrabold text-gold-300 uppercase tracking-widest block">
                🥇 1st Prize
              </span>
              <div className="my-4 py-4 rounded-xl bg-[#121020] border border-gold-500/40 font-mono text-gold-500/60 text-2xl flex items-center justify-center gap-2">
                <Lock className="w-5 h-5" />
                <span>?????</span>
              </div>
              <p className="text-xs text-gold-300/80 font-medium">
                {isClosed ? 'Selecting Grand Champion...' : 'Grand Champion Winner'}
              </p>
            </div>

            {/* 3rd Prize Teaser */}
            <div className="glass-panel rounded-3xl p-6 text-center border-amber-700/30 opacity-80 order-3">
              <div className="w-12 h-12 rounded-2xl bg-amber-700/10 border border-amber-700/30 flex items-center justify-center mx-auto mb-3 text-amber-400">
                <Medal className="w-6 h-6" />
              </div>
              <span className="text-xs font-bold text-amber-400 uppercase tracking-widest block">
                🥉 3rd Prize
              </span>
              <div className="my-4 py-3 rounded-xl bg-[#121020] border border-amber-700/20 font-mono text-gray-500 text-lg flex items-center justify-center gap-2">
                <Lock className="w-4 h-4" />
                <span>?????</span>
              </div>
              <p className="text-[11px] text-gray-400">
                {isClosed ? 'Drawing Winner...' : `Revealing at ${endFormatted} IST`}
              </p>
            </div>
          </div>
        )
      ) : (
        /* Actual Revealed Winners Podium */
        <div className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end">
            {/* 2nd Prize Winner */}
            {winnersData.second_prize ? (
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="glass-panel rounded-3xl p-6 text-center border-slate-300/40 relative order-2 md:order-1"
              >
                <div className="w-12 h-12 rounded-2xl bg-slate-400/20 border border-slate-300/40 flex items-center justify-center mx-auto mb-2 text-slate-200">
                  <Medal className="w-6 h-6" />
                </div>
                <span className="text-xs font-extrabold text-slate-300 uppercase tracking-wider block">
                  🥈 2nd Prize
                </span>
                <div className="my-3 py-2 px-3 rounded-xl bg-[#110f1e] border border-slate-400/30">
                  <div className="text-[10px] text-gray-400 uppercase tracking-widest">Winning Number</div>
                  <div className="text-2xl sm:text-3xl font-black text-slate-200 py-1">
                    <RollingNumber value={winnersData.second_prize.lucky_number} />
                  </div>
                </div>
                <div className="text-base font-bold text-white truncate">
                  {winnersData.second_prize.name}
                </div>
              </motion.div>
            ) : null}

            {/* 1st Prize Winner (Center Grand Podium) */}
            {winnersData.first_prize ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.85 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.7 }}
                className="glass-panel-glow rounded-3xl p-8 text-center border-gold-400/60 relative order-1 md:order-2 md:-translate-y-6 shadow-gold-intense bg-gradient-to-b from-[#241f3d] to-[#141224]"
              >
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-gradient-to-r from-gold-400 via-gold-500 to-amber-600 text-black font-black text-xs uppercase tracking-widest shadow-lg">
                  👑 Grand Winner
                </div>

                <div className="w-16 h-16 rounded-2xl bg-gold-500/20 border border-gold-500/50 flex items-center justify-center mx-auto mb-3 text-gold-400 shadow-gold-glow animate-pulse">
                  <Crown className="w-10 h-10 text-gold-300" />
                </div>

                <span className="text-sm sm:text-base font-extrabold gold-text-gradient uppercase tracking-widest block">
                  🥇 1ST PRIZE CHAMPION
                </span>

                <div className="my-4 py-3 px-4 rounded-2xl bg-[#0c0a18] border border-gold-500/40 shadow-inner">
                  <div className="text-[10px] uppercase font-mono tracking-widest text-gold-400/80">
                    Grand Winning Number
                  </div>
                  <div className="text-4xl sm:text-5xl font-black gold-text-gradient py-1">
                    <RollingNumber value={winnersData.first_prize.lucky_number} />
                  </div>
                </div>

                <div className="text-lg sm:text-xl font-black text-white truncate drop-shadow">
                  {winnersData.first_prize.name}
                </div>
              </motion.div>
            ) : null}

            {/* 3rd Prize Winner */}
            {winnersData.third_prize ? (
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.4 }}
                className="glass-panel rounded-3xl p-6 text-center border-amber-600/40 relative order-3"
              >
                <div className="w-12 h-12 rounded-2xl bg-amber-700/20 border border-amber-600/40 flex items-center justify-center mx-auto mb-2 text-amber-300">
                  <Medal className="w-6 h-6" />
                </div>
                <span className="text-xs font-extrabold text-amber-300 uppercase tracking-wider block">
                  🥉 3rd Prize
                </span>
                <div className="my-3 py-2 px-3 rounded-xl bg-[#110f1e] border border-amber-600/30">
                  <div className="text-[10px] text-gray-400 uppercase tracking-widest">Winning Number</div>
                  <div className="text-2xl sm:text-3xl font-black text-amber-200 py-1">
                    <RollingNumber value={winnersData.third_prize.lucky_number} />
                  </div>
                </div>
                <div className="text-base font-bold text-white truncate">
                  {winnersData.third_prize.name}
                </div>
              </motion.div>
            ) : null}
          </div>

          {/* Verification Stamp */}
          <div className="p-4 rounded-2xl bg-[#121020] border border-gold-500/20 max-w-xl mx-auto text-center space-y-1">
            <div className="flex items-center justify-center gap-2 text-xs font-semibold text-emerald-400">
              <ShieldCheck className="w-4 h-4" />
              <span>Official Database Verification Passed</span>
            </div>
            <p className="text-[11px] text-gray-400">
              {winnersData.selected_at && `Selected and permanently locked at ${formatPlayedAt(winnersData.selected_at)} IST. `}
              Results are immutable and verified.
            </p>
          </div>
        </div>
      )}
    </section>
  );
};
