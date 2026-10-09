import React, { useState } from 'react';
import { AlertCircle, CheckCircle2 } from 'lucide-react';
import { DrawState, Participant } from '../types';
import { apiService } from '../services/supabase';
import { soundFx } from '../utils/audio';

import { formatDisplayTime, formatDisplayDate } from '../utils/time';

interface ParticipationFormProps {
  status: DrawState;
  onSuccess: (participant: { name: string; lucky_number: number; played_at: string }, isAlready: boolean) => void;
  lastParticipant?: Participant | null;
  startTime?: string;
  endTime?: string;
  eventDate?: string;
}

export const ParticipationForm: React.FC<ParticipationFormProps> = ({
  status,
  onSuccess,
  lastParticipant,
  startTime,
  endTime,
  eventDate,
}) => {
  const [name, setName] = useState('');
  const [mobile, setMobile] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const isLive = status === 'LIVE_DRAW' || status === 'LIVE';
  const isBefore = status === 'BEFORE_DRAW' || status === 'SCHEDULED';
  const isClosed = status === 'DRAW_CLOSED' || status === 'CLOSED' || status === 'WINNERS_PUBLISHED';

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

    // Prevent duplicate participation if this browser already participated in this event (Requirement 3)
    if (lastParticipant) {
      soundFx.playTicketReveal();
      onSuccess(lastParticipant, true);
      return;
    }

    const validationError = validateInputs();
    if (validationError) {
      setErrorMsg(validationError);
      soundFx.playError();
      return;
    }

    if (!isLive) {
      setErrorMsg(
        isBefore
          ? `The lucky draw is locked. Participation automatically opens at ${formatDisplayTime(startTime)} IST.`
          : `The lucky draw is closed. Entries closed at ${formatDisplayTime(endTime)} IST.`
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
        setErrorMsg(res.message || 'Unable to register. Please try again.');
        soundFx.playError();
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Network error. Please try again.';
      setErrorMsg(message);
      soundFx.playError();
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div id="participate-section" className="w-full max-w-lg mx-auto px-4">
      <div className="bg-[#141224] border border-gold-500/25 rounded-2xl p-6 sm:p-7 shadow-xl space-y-5">
        {/* Header */}
        <div className="text-center space-y-1">
          <h3 className="text-xl sm:text-2xl font-bold text-white">
            Get Your Lucky Number
          </h3>
          <p className="text-xs text-gray-400">
            One entry per mobile number • Lucky numbers are generated securely
          </p>
        </div>

        {/* Phase 1: Locked Before Start Time Banner */}
        {isBefore && !lastParticipant && (
          <div className="p-3.5 rounded-xl bg-amber-950/60 border border-amber-500/40 flex items-start gap-2.5 text-xs text-amber-200">
            <span className="text-base mt-0.5">🔒</span>
            <div>
              <span className="font-bold block text-white">Input Fields Locked (Draw Has Not Started)</span>
              <p className="text-[11px] text-amber-300/90 mt-0.5">
                Inputs will <strong className="text-gold-300">automatically unlock</strong> at <strong className="text-gold-300">{formatDisplayTime(startTime)} IST</strong> on {formatDisplayDate(eventDate)}. No entries can be typed or submitted before start time.
              </p>
            </div>
          </div>
        )}

        {/* Phase 2: Live Unlocked Banner */}
        {isLive && !lastParticipant && (
          <div className="p-3 rounded-xl bg-emerald-950/50 border border-emerald-500/40 flex items-center gap-2.5 text-xs text-emerald-200">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping shrink-0" />
            <span className="text-emerald-100 font-medium">
              🟢 <strong>Lucky Draw is LIVE!</strong> Input fields are unlocked. Fill your details below.
            </span>
          </div>
        )}

        {/* Phase 3: Closed After End Time Banner */}
        {isClosed && !lastParticipant && (
          <div className="p-3.5 rounded-xl bg-red-950/60 border border-red-500/40 flex items-start gap-2.5 text-xs text-red-200">
            <span className="text-base mt-0.5">🔒</span>
            <div>
              <span className="font-bold block text-white">Input Fields Locked (Draw Has Ended)</span>
              <p className="text-[11px] text-red-300/90 mt-0.5">
                Lucky draw entries closed at {formatDisplayTime(endTime)} IST. Check the prize podium above for winner results!
              </p>
            </div>
          </div>
        )}

        {/* Existing Participation Banner */}
        {lastParticipant && (
          <div className="p-3.5 rounded-xl bg-gold-500/10 border border-gold-500/30 flex items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2 text-gold-300">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-gold-400" />
              <span>
                Your Lucky Number: <strong className="font-mono text-sm font-bold">#{lastParticipant.lucky_number}</strong>
              </span>
            </div>
            <button
              onClick={() => {
                soundFx.playClick();
                onSuccess(lastParticipant, true);
              }}
              className="px-2.5 py-1 rounded-lg bg-gold-500 text-black font-bold text-xs cursor-pointer"
            >
              View Ticket
            </button>
          </div>
        )}

        {/* Error Feedback */}
        {errorMsg && (
          <div className="p-3 rounded-xl bg-red-950/80 border border-red-500/50 flex items-center gap-2 text-red-200 text-xs">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <div className="flex justify-between items-center mb-1">
              <label htmlFor="p-name" className="block text-xs font-semibold text-gray-300">
                Full Name
              </label>
              {isBefore && !lastParticipant && (
                <span className="text-[10px] text-amber-400 font-mono flex items-center gap-1">
                  🔒 Locked until {formatDisplayTime(startTime)}
                </span>
              )}
            </div>
            <input
              id="p-name"
              type="text"
              required
              readOnly={!isLive}
              disabled={!isLive || isLoading || Boolean(lastParticipant)}
              placeholder={
                lastParticipant
                  ? lastParticipant.name
                  : isBefore
                  ? `Locked until ${formatDisplayTime(startTime)} IST`
                  : "e.g. Rahul Sharma"
              }
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-[#0e0d1a] border border-gold-500/20 text-white placeholder-gray-500 focus:outline-none focus:border-gold-400 text-sm disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-[#0a0814] disabled:border-gray-800 disabled:text-gray-500 transition-all"
            />
          </div>

          <div>
            <div className="flex justify-between items-center mb-1">
              <label htmlFor="p-mobile" className="block text-xs font-semibold text-gray-300">
                10-Digit Mobile Number
              </label>
              <span className="text-[10px] text-gray-400">
                {isBefore ? '🔒 Locked' : '🔒 Never shown publicly'}
              </span>
            </div>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-xs font-bold text-gray-400 font-mono">
                +91
              </span>
              <input
                id="p-mobile"
                type="tel"
                inputMode="numeric"
                maxLength={10}
                required
                readOnly={!isLive}
                disabled={!isLive || isLoading || Boolean(lastParticipant)}
                placeholder={
                  lastParticipant
                    ? "Already Registered"
                    : isBefore
                    ? "Locked"
                    : "9876543210"
                }
                value={mobile}
                onChange={(e) => setMobile(e.target.value.replace(/[^0-9]/g, ''))}
                className="w-full pl-11 pr-4 py-3 rounded-xl bg-[#0e0d1a] border border-gold-500/20 text-white placeholder-gray-500 font-mono text-sm focus:outline-none focus:border-gold-400 disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-[#0a0814] disabled:border-gray-800 disabled:text-gray-500 transition-all"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={!isLive || isLoading || Boolean(lastParticipant)}
            className="w-full py-3.5 px-4 rounded-xl bg-gold-500 hover:bg-gold-400 disabled:bg-[#151322] disabled:border disabled:border-gray-700/60 disabled:text-gray-400 text-black font-bold text-sm sm:text-base flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg shadow-gold-500/10 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                <span>Generating number...</span>
              </>
            ) : lastParticipant ? (
              <span>✓ Already Entered (#{lastParticipant.lucky_number})</span>
            ) : isBefore ? (
              <span>🔒 Locked • Opens at {formatDisplayTime(startTime)} IST</span>
            ) : !isLive ? (
              <span>🔒 Draw Closed</span>
            ) : (
              <span>🎲 Get My Lucky Number</span>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};
