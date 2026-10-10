import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import { X, Copy, Check, Sparkles, ShieldCheck } from 'lucide-react';
import { formatPlayedAt, formatDisplayDate, formatTimeRange, formatDisplayTime } from '../utils/time';
import { soundFx } from '../utils/audio';

interface LuckyTicketModalProps {
  isOpen: boolean;
  onClose: () => void;
  participant: {
    name: string;
    lucky_number: number;
    played_at: string;
  } | null;
  isAlreadyRegistered?: boolean;
  eventDate?: string;
  startTime?: string;
  endTime?: string;
}

export const LuckyTicketModal: React.FC<LuckyTicketModalProps> = ({
  isOpen,
  onClose,
  participant,
  isAlreadyRegistered,
  eventDate,
  startTime,
  endTime,
}) => {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (isOpen && participant) {
      // Trigger festive confetti burst
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#ffd054', '#f5b516', '#d9940b', '#ffffff', '#e11d48'],
        });
      } catch {
        // Ignore if confetti not supported
      }
    }
  }, [isOpen, participant]);

  if (!isOpen || !participant) return null;

  const handleCopy = async () => {
    soundFx.playClick();
    const textToCopy = String(participant.lucky_number);
    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(textToCopy);
      } else {
        const textarea = document.createElement('textarea');
        textarea.value = textToCopy;
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      try {
        const textarea = document.createElement('textarea');
        textarea.value = textToCopy;
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
        setCopied(true);
        setTimeout(() => setCopied(false), 2500);
      } catch {
        // ignore
      }
    }
  };

  const formattedTime = formatPlayedAt(participant.played_at);

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.85, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.85, y: 20 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="relative w-full max-w-md my-8"
        >
          {/* Close button */}
          <button
            onClick={() => {
              soundFx.playClick();
              onClose();
            }}
            aria-label="Close ticket dialog"
            className="absolute -top-3 -right-3 z-10 w-9 h-9 rounded-full bg-[#1e1b33] border border-gold-500/40 text-gold-300 hover:text-white flex items-center justify-center cursor-pointer shadow-lg hover:scale-110 transition-all"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Ticket Card Container */}
          <div className="ticket-card rounded-3xl p-6 sm:p-8 text-center text-white relative overflow-hidden shadow-2xl">
            {/* Ticket Notches */}
            <div className="ticket-notch-left hidden sm:block" />
            <div className="ticket-notch-right hidden sm:block" />

            {/* Top Badge */}
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gold-500/20 border border-gold-500/40 text-gold-300 text-[11px] font-bold uppercase tracking-wider mb-4">
              <Sparkles className="w-3.5 h-3.5 text-gold-400" />
              <span>
                {isAlreadyRegistered ? 'Existing Ticket Retrieved' : 'Official Entry Pass'}
              </span>
            </div>

            {/* Header */}
            <h3 className="font-serif-luxury text-2xl sm:text-3xl font-bold text-white tracking-wide">
              Reon & Priyanka Wedding Lucky Draw
            </h3>
            <p className="text-xs text-gold-300/80 mt-0.5">
              {formatDisplayDate(eventDate)} • {formatTimeRange(startTime, endTime)}
            </p>

            {/* Dashed Separator */}
            <div className="my-5 border-t border-dashed border-gold-500/40 relative">
              <div className="absolute left-1/2 -top-2.5 -translate-x-1/2 bg-[#17142c] px-3 text-[10px] uppercase font-mono tracking-widest text-gold-400/80">
                LUCKY TICKET
              </div>
            </div>

            {/* Lucky Number Display */}
            <div className="py-2 space-y-1">
              <div className="text-[11px] uppercase tracking-widest text-gray-400 font-semibold">
                Your Official Lucky Number
              </div>
              <motion.div
                initial={{ scale: 0.9 }}
                animate={{ scale: [0.9, 1.05, 1] }}
                transition={{ duration: 0.5 }}
                className="font-mono text-4xl sm:text-5xl font-black gold-text-gradient tracking-widest drop-shadow-md py-2"
              >
                {participant.lucky_number}
              </motion.div>
            </div>

            {/* Participant Details */}
            <div className="mt-4 p-3.5 rounded-2xl bg-[#0e0c1a]/80 border border-gold-500/20 text-left space-y-1 text-xs">
              <div className="flex justify-between items-center">
                <span className="text-gray-400">Participant:</span>
                <span className="font-semibold text-white truncate max-w-[180px]">
                  {participant.name}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-400">Issued At:</span>
                <span className="font-mono text-gold-300">{formattedTime} IST</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-400">Status:</span>
                <span className="text-emerald-400 font-semibold flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5" /> Valid & Confirmed
                </span>
              </div>
            </div>

            {/* Keep Safe Advice */}
            <p className="mt-4 text-xs text-gray-300 leading-relaxed">
              "Keep this number safe until the lucky draw results are announced at {formatDisplayTime(endTime || '21:00:00')} IST."
            </p>

            {/* Actions */}
            <div className="mt-6 flex flex-col sm:flex-row gap-3">
              <button
                onClick={handleCopy}
                className="flex-1 py-3 px-4 rounded-xl bg-gold-500 hover:bg-gold-400 text-black font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all cursor-pointer shadow-gold-glow"
              >
                {copied ? (
                  <>
                    <Check className="w-4 h-4" />
                    <span>Number Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    <span>Copy Lucky Number</span>
                  </>
                )}
              </button>

              <button
                onClick={() => {
                  soundFx.playClick();
                  onClose();
                }}
                className="py-3 px-4 rounded-xl bg-festive-card hover:bg-[#221f3a] border border-gold-500/30 text-gold-300 font-semibold text-xs sm:text-sm transition-all cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
