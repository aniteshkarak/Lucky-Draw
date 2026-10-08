import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { User, Sparkles, AlertCircle, Lock, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { DrawState, Participant } from '../types';
import { apiService } from '../services/supabase';
import { soundFx } from '../utils/audio';

interface ParticipationFormProps {
  status: DrawState;
  onSuccess: (participant: { name: string; lucky_number: number; played_at: string }, isAlready: boolean) => void;
  lastParticipant?: Participant | null;
}

export const ParticipationForm: React.FC<ParticipationFormProps> = ({
  status,
  onSuccess,
  lastParticipant,
}) => {
  const [name, setName] = useState('');
  const [mobile, setMobile] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const isLive = status === 'LIVE_DRAW';

  const validateInputs = (): string | null => {
    const cleanName = name.trim().replace(/\s+/g, ' ');
    if (!cleanName || cleanName.length < 2) {
      return 'Please enter your full name (minimum 2 characters).';
    }
    if (cleanName.length > 80) {
      return 'Name is too long (maximum 80 characters).';
    }

    let cleanMobile = mobile.replace(/[^0-9]/g, '');
    if (cleanMobile.startsWith('91') && cleanMobile.length === 12) {
      cleanMobile = cleanMobile.slice(2);
    } else if (cleanMobile.startsWith('0') && cleanMobile.length === 11) {
      cleanMobile = cleanMobile.slice(1);
    }

    if (!/^[6-9]\d{9}$/.test(cleanMobile)) {
      return 'Please enter a valid 10-digit Indian mobile number (e.g. 9876543210).';
    }

    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const validationError = validateInputs();
    if (validationError) {
      setErrorMsg(validationError);
      soundFx.playError();
      return;
    }

    if (!isLive) {
      setErrorMsg(
        status === 'BEFORE_DRAW'
          ? 'Lucky draw has not started yet. Starts at 8:00 PM IST.'
          : 'Lucky draw is now closed for new entries.'
      );
      soundFx.playError();
      return;
    }

    setIsLoading(true);
    soundFx.playClick();

    try {
      const res = await apiService.participate(name, mobile);
      if (res.success && res.participant) {
        soundFx.playTicketReveal();
        onSuccess(res.participant, Boolean(res.already_registered));
      } else {
        setErrorMsg(res.message || 'Unable to register at this time. Please try again.');
        soundFx.playError();
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Network error. Please check your connection.';
      setErrorMsg(message);
      soundFx.playError();
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div id="participate-section" className="w-full max-w-xl mx-auto px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
        className="glass-panel-glow rounded-3xl p-6 sm:p-8 relative overflow-hidden"
      >
        {/* Card Header */}
        <div className="text-center mb-6">
          <div className="w-12 h-12 rounded-2xl bg-gold-500/10 border border-gold-500/30 flex items-center justify-center mx-auto mb-3 text-gold-400">
            <Sparkles className="w-6 h-6" />
          </div>
          <h3 className="font-serif-luxury text-2xl sm:text-3xl font-bold text-white tracking-wide">
            Get Your Lucky Number
          </h3>
          <p className="text-xs sm:text-sm text-gray-400 mt-1">
            Enter your details below to generate your unique 5-digit lucky ticket.
          </p>
        </div>

        {/* Existing Participation Quick Notice */}
        {lastParticipant && (
          <div className="mb-6 p-4 rounded-2xl bg-gold-500/10 border border-gold-500/30 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="w-5 h-5 text-gold-400 shrink-0" />
              <div className="text-xs sm:text-sm">
                <span className="text-gray-300">Your Active Number: </span>
                <span className="font-mono font-bold text-gold-300 text-base sm:text-lg">
                  #{lastParticipant.lucky_number}
                </span>
                <span className="block text-[11px] text-gray-400">
                  Registered for {lastParticipant.name}
                </span>
              </div>
            </div>
            <button
              onClick={() => {
                soundFx.playClick();
                onSuccess(lastParticipant, true);
              }}
              className="px-3 py-1.5 rounded-xl bg-gold-500/20 hover:bg-gold-500/30 border border-gold-500/30 text-gold-300 text-xs font-semibold cursor-pointer transition-all"
            >
              View Ticket
            </button>
          </div>
        )}

        {/* Error Alert */}
        {errorMsg && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 p-4 rounded-2xl bg-red-950/80 border border-red-500/50 flex items-start gap-3 text-red-200 text-xs sm:text-sm"
          >
            <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
            <div className="flex-1">
              <span className="font-bold block text-red-300">Participation Notice</span>
              <span>{errorMsg}</span>
            </div>
          </motion.div>
        )}

        {/* Disabled Draw State Banner */}
        {!isLive && (
          <div className="mb-6 p-4 rounded-2xl bg-[#131120] border border-gold-500/20 text-center">
            <div className="flex items-center justify-center gap-2 text-xs sm:text-sm font-semibold text-gold-300 mb-1">
              <Lock className="w-4 h-4 text-gold-400" />
              <span>
                {status === 'BEFORE_DRAW'
                  ? 'Registration Window Not Open Yet'
                  : 'Lucky Draw Participation is Closed'}
              </span>
            </div>
            <p className="text-[11px] text-gray-400">
              {status === 'BEFORE_DRAW'
                ? 'The entry form will automatically unlock at 8:00 PM IST on 25 October.'
                : 'Entries closed at 9:00 PM IST. Stay tuned for the winner announcement!'}
            </p>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
          {/* Full Name */}
          <div className="space-y-1.5">
            <label htmlFor="participant-name" className="block text-xs font-semibold text-gray-300 uppercase tracking-wider">
              Full Name <span className="text-gold-400">*</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gold-500/60">
                <User className="w-5 h-5" />
              </div>
              <input
                id="participant-name"
                type="text"
                required
                disabled={!isLive || isLoading}
                placeholder="e.g. Rahul Sharma"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full pl-12 pr-4 py-3.5 rounded-2xl bg-[#121022] border border-gold-500/25 text-white placeholder-gray-500 focus:outline-none focus:border-gold-400 focus:ring-2 focus:ring-gold-500/20 transition-all text-sm sm:text-base disabled:opacity-50 disabled:cursor-not-allowed"
              />
            </div>
          </div>

          {/* Mobile Number */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label htmlFor="participant-mobile" className="block text-xs font-semibold text-gray-300 uppercase tracking-wider">
                Mobile Number (10 Digits) <span className="text-gold-400">*</span>
              </label>
              <span className="text-[10px] text-gold-400/80 font-medium">🔒 Kept 100% Private</span>
            </div>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gold-500/60 font-mono font-bold text-sm">
                +91
              </div>
              <input
                id="participant-mobile"
                type="tel"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={10}
                required
                disabled={!isLive || isLoading}
                placeholder="9876543210"
                value={mobile}
                onChange={(e) => setMobile(e.target.value.replace(/[^0-9]/g, ''))}
                className="w-full pl-14 pr-4 py-3.5 rounded-2xl bg-[#121022] border border-gold-500/25 text-white placeholder-gray-500 font-mono focus:outline-none focus:border-gold-400 focus:ring-2 focus:ring-gold-500/20 transition-all text-sm sm:text-base tracking-wider disabled:opacity-50 disabled:cursor-not-allowed"
              />
            </div>
            <p className="text-[11px] text-gray-400">
              Only Indian mobile numbers. One entry allowed per number.
            </p>
          </div>

          {/* Submit Button */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={!isLive || isLoading}
              className="w-full py-4 px-6 rounded-2xl font-bold text-base sm:text-lg gold-button-gradient flex items-center justify-center gap-3 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none"
            >
              {isLoading ? (
                <>
                  <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin" />
                  <span>Generating your lucky number...</span>
                </>
              ) : (
                <>
                  <span>🎲 GET MY LUCKY NUMBER</span>
                </>
              )}
            </button>
          </div>

          {/* Privacy Guarantee */}
          <div className="flex items-center justify-center gap-2 pt-1 text-center text-[11px] text-gray-400">
            <ShieldCheck className="w-3.5 h-3.5 text-gold-400" />
            <span>Mobile numbers are never shown publicly on the participant list.</span>
          </div>
        </form>
      </motion.div>
    </div>
  );
};
