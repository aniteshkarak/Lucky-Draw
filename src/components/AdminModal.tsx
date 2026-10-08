import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Shield,
  Lock,
  Trophy,
  AlertTriangle,
  Download,
  Power,
  RotateCcw,
  CheckCircle2,
  Settings2
} from 'lucide-react';
import { DrawSettings, Participant, WinnersData, DrawState } from '../types';
import { apiService } from '../services/supabase';
import { soundFx } from '../utils/audio';

interface AdminModalProps {
  isOpen: boolean;
  onClose: () => void;
  drawSettings: DrawSettings;
  participants: Participant[];
  winnersData: WinnersData;
  onSettingsUpdated: () => void;
}

export const AdminModal: React.FC<AdminModalProps> = ({
  isOpen,
  onClose,
  drawSettings,
  participants,
  winnersData,
  onSettingsUpdated,
}) => {
  const [pin, setPin] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [isActionLoading, setIsActionLoading] = useState(false);
  const [showConfirmWinners, setShowConfirmWinners] = useState(false);

  if (!isOpen) return null;

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    const validPin = import.meta.env.VITE_ADMIN_PIN || 'dada2026';
    if (pin.trim() === validPin) {
      soundFx.playClick();
      setIsAuthenticated(true);
      setErrorMsg(null);
    } else {
      soundFx.playError();
      setErrorMsg('Invalid Admin Security PIN.');
    }
  };

  const handleSelectWinners = async () => {
    setIsActionLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);
    soundFx.playClick();

    try {
      const res = await apiService.selectWinners(pin, true);
      if (res.success) {
        soundFx.playWinnerFanfare();
        setSuccessMsg(res.message || 'Winners have been drawn successfully!');
        setShowConfirmWinners(false);
        onSettingsUpdated();
      } else {
        soundFx.playError();
        setErrorMsg(res.message || 'Failed to select winners.');
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error executing winner selection.';
      setErrorMsg(message);
      soundFx.playError();
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleChangeStatus = async (status: DrawState | 'AUTO') => {
    setIsActionLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);
    soundFx.playClick();

    try {
      const res = await apiService.adminUpdateSettings(pin, status);
      if (res.success) {
        setSuccessMsg(`Draw status changed to ${status}`);
        onSettingsUpdated();
      } else {
        setErrorMsg(res.message);
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error updating status.';
      setErrorMsg(message);
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleToggleEmergencyClose = async () => {
    setIsActionLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);
    soundFx.playClick();

    try {
      const res = await apiService.adminUpdateSettings(
        pin,
        undefined,
        !drawSettings.emergency_closed
      );
      if (res.success) {
        setSuccessMsg(
          drawSettings.emergency_closed
            ? 'Emergency close removed.'
            : 'Draw is now EMERGENCY CLOSED.'
        );
        onSettingsUpdated();
      } else {
        setErrorMsg(res.message);
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error updating emergency state.';
      setErrorMsg(message);
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleResetWinners = async () => {
    if (!window.confirm('⚠️ Are you sure you want to reset winners? This will unlock the draw.')) {
      return;
    }
    setIsActionLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const res = await apiService.adminUpdateSettings(pin, 'LIVE_DRAW', false, true);
      if (res.success) {
        setSuccessMsg('Winners reset successfully. Draw reopened.');
        onSettingsUpdated();
      } else {
        setErrorMsg(res.message);
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error resetting winners.';
      setErrorMsg(message);
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleExportCSV = () => {
    soundFx.playClick();
    if (participants.length === 0) {
      alert('No participants to export.');
      return;
    }

    const headers = ['Serial No', 'Name', 'Lucky Number', 'Played At'];
    const rows = participants.map((p) => [
      p.serial_no,
      `"${p.name.replace(/"/g, '""')}"`,
      p.lucky_number,
      `"${p.played_at}"`,
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `dada_lucky_draw_participants_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          className="relative w-full max-w-2xl my-8 glass-panel-glow rounded-3xl p-6 sm:p-8 text-white overflow-hidden shadow-2xl"
        >
          {/* Close button */}
          <button
            onClick={() => {
              soundFx.playClick();
              onClose();
            }}
            aria-label="Close admin modal"
            className="absolute top-4 right-4 z-10 w-9 h-9 rounded-full bg-[#1e1b33] border border-gold-500/30 text-gold-300 hover:text-white flex items-center justify-center cursor-pointer transition-all"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Header */}
          <div className="flex items-center gap-3 border-b border-gold-500/20 pb-4 mb-6">
            <div className="w-10 h-10 rounded-xl bg-gold-500/20 border border-gold-500/40 flex items-center justify-center text-gold-400">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-serif-luxury text-xl sm:text-2xl font-bold text-white">
                Admin Control Center
              </h3>
              <p className="text-xs text-gold-300/80">
                Organizer management & server-side draw controls
              </p>
            </div>
          </div>

          {!isAuthenticated ? (
            /* PIN Login Form */
            <form onSubmit={handleLogin} className="space-y-4 max-w-sm mx-auto py-6">
              <div className="text-center space-y-1 mb-4">
                <Lock className="w-8 h-8 text-gold-400 mx-auto mb-2" />
                <h4 className="text-base font-bold text-white">Enter Security PIN</h4>
                <p className="text-xs text-gray-400">
                  Authentication is required to access administrative operations.
                </p>
              </div>

              {errorMsg && (
                <div className="p-3 rounded-xl bg-red-950/80 border border-red-500/50 text-red-200 text-xs text-center font-medium">
                  {errorMsg}
                </div>
              )}

              <input
                type="password"
                placeholder="Enter PIN (Default: dada2026)"
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                autoFocus
                className="w-full px-4 py-3 rounded-xl bg-[#121022] border border-gold-500/30 text-white placeholder-gray-500 text-center font-mono tracking-widest text-lg focus:outline-none focus:border-gold-400"
              />

              <button
                type="submit"
                className="w-full py-3 rounded-xl gold-button-gradient font-bold text-sm cursor-pointer shadow-gold-glow"
              >
                Authenticate & Unlock
              </button>
            </form>
          ) : (
            /* Authenticated Admin Dashboard */
            <div className="space-y-6">
              {/* Alert Feedback */}
              {successMsg && (
                <div className="p-3.5 rounded-2xl bg-emerald-950/80 border border-emerald-500/50 flex items-center gap-2 text-emerald-200 text-xs font-semibold">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>{successMsg}</span>
                </div>
              )}
              {errorMsg && (
                <div className="p-3.5 rounded-2xl bg-red-950/80 border border-red-500/50 flex items-center gap-2 text-red-200 text-xs font-semibold">
                  <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {/* Status Overview Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3.5 rounded-2xl bg-[#141224] border border-gold-500/20">
                  <div className="text-[10px] uppercase text-gray-400 font-semibold">
                    Current Status
                  </div>
                  <div className="text-sm font-bold text-gold-300 font-mono mt-1">
                    {drawSettings.status}
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-[#141224] border border-gold-500/20">
                  <div className="text-[10px] uppercase text-gray-400 font-semibold">
                    Participants
                  </div>
                  <div className="text-sm font-bold text-white font-mono mt-1">
                    {drawSettings.total_participants} Registered
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-[#141224] border border-gold-500/20">
                  <div className="text-[10px] uppercase text-gray-400 font-semibold">
                    Winners Drawn
                  </div>
                  <div className="text-sm font-bold text-gold-400 font-mono mt-1">
                    {winnersData.winners_exist ? 'YES (Locked)' : 'NO'}
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-[#141224] border border-gold-500/20">
                  <div className="text-[10px] uppercase text-gray-400 font-semibold">
                    Emergency Lock
                  </div>
                  <div
                    className={`text-sm font-bold font-mono mt-1 ${
                      drawSettings.emergency_closed ? 'text-red-400' : 'text-emerald-400'
                    }`}
                  >
                    {drawSettings.emergency_closed ? 'ACTIVE' : 'OFF'}
                  </div>
                </div>
              </div>

              {/* Action 1: Winner Selection */}
              <div className="p-5 rounded-2xl bg-[#141224] border border-gold-500/30 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Trophy className="w-5 h-5 text-gold-400" />
                    <span className="text-sm font-bold text-white">Winner Selection Engine</span>
                  </div>
                  {winnersData.winners_exist && (
                    <span className="px-2.5 py-0.5 rounded-full bg-gold-500/20 text-gold-300 text-[10px] font-bold border border-gold-500/30">
                      Permanent Record Locked
                    </span>
                  )}
                </div>

                <p className="text-xs text-gray-400">
                  Selects 3 unique winners randomly from the verified participant list on the server.
                  Once selected, the results are immutable and permanent.
                </p>

                {showConfirmWinners ? (
                  <div className="p-4 rounded-xl bg-amber-950/80 border border-amber-500/40 space-y-3">
                    <div className="flex items-center gap-2 text-amber-300 text-xs font-bold">
                      <AlertTriangle className="w-4 h-4" />
                      <span>Confirm Official Winner Selection</span>
                    </div>
                    <p className="text-[11px] text-amber-200/90">
                      This will randomly draw and permanently lock 1st, 2nd, and 3rd prize winners.
                      Are you sure you want to proceed?
                    </p>
                    <div className="flex gap-2">
                      <button
                        onClick={handleSelectWinners}
                        disabled={isActionLoading}
                        className="px-4 py-2 rounded-lg bg-gold-500 text-black font-bold text-xs cursor-pointer shadow-gold-glow"
                      >
                        {isActionLoading ? 'Drawing...' : 'Yes, Draw Official Winners'}
                      </button>
                      <button
                        onClick={() => setShowConfirmWinners(false)}
                        className="px-4 py-2 rounded-lg bg-gray-800 text-gray-300 text-xs font-semibold cursor-pointer"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => setShowConfirmWinners(true)}
                    disabled={isActionLoading || winnersData.winners_exist}
                    className={`w-full py-3 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all cursor-pointer ${
                      winnersData.winners_exist
                        ? 'bg-gray-800/80 text-gray-400 border border-gray-700 cursor-not-allowed'
                        : 'gold-button-gradient shadow-gold-glow'
                    }`}
                  >
                    <Trophy className="w-4 h-4" />
                    <span>
                      {winnersData.winners_exist ? 'Winners Already Selected' : '👑 SELECT WINNERS NOW'}
                    </span>
                  </button>
                )}
              </div>

              {/* Action 2: Draw Status Switcher (Testing & Overrides) */}
              <div className="p-5 rounded-2xl bg-[#141224] border border-gold-500/20 space-y-3">
                <div className="flex items-center gap-2">
                  <Settings2 className="w-5 h-5 text-gold-400" />
                  <span className="text-sm font-bold text-white">Event State Override (Testing)</span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <button
                    onClick={() => handleChangeStatus('AUTO')}
                    disabled={isActionLoading}
                    className={`p-2.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                      drawSettings.manual_override === 'AUTO'
                        ? 'bg-gold-500/20 border-gold-400 text-gold-200'
                        : 'bg-[#18162c] border-gray-700 text-gray-300 hover:border-gold-500/40'
                    }`}
                  >
                    Auto (Time-Based)
                  </button>
                  <button
                    onClick={() => handleChangeStatus('LIVE_DRAW')}
                    disabled={isActionLoading}
                    className={`p-2.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                      drawSettings.status === 'LIVE_DRAW'
                        ? 'bg-gold-500/20 border-gold-400 text-gold-200'
                        : 'bg-[#18162c] border-gray-700 text-gray-300 hover:border-gold-500/40'
                    }`}
                  >
                    🔴 Force Live
                  </button>
                  <button
                    onClick={() => handleChangeStatus('BEFORE_DRAW')}
                    disabled={isActionLoading}
                    className={`p-2.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                      drawSettings.status === 'BEFORE_DRAW'
                        ? 'bg-blue-500/20 border-blue-400 text-blue-200'
                        : 'bg-[#18162c] border-gray-700 text-gray-300 hover:border-gold-500/40'
                    }`}
                  >
                    🔵 Force Before
                  </button>
                  <button
                    onClick={() => handleChangeStatus('DRAW_CLOSED')}
                    disabled={isActionLoading}
                    className={`p-2.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                      drawSettings.status === 'DRAW_CLOSED'
                        ? 'bg-purple-500/20 border-purple-400 text-purple-200'
                        : 'bg-[#18162c] border-gray-700 text-gray-300 hover:border-gold-500/40'
                    }`}
                  >
                    🔒 Force Closed
                  </button>
                </div>
              </div>

              {/* Action 3: Utilities & Emergency Controls */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-gold-500/20">
                <button
                  onClick={handleExportCSV}
                  className="px-4 py-2.5 rounded-xl bg-[#18162c] hover:bg-gold-500/10 border border-gold-500/30 text-gold-300 text-xs font-semibold flex items-center gap-2 cursor-pointer transition-all"
                >
                  <Download className="w-4 h-4" />
                  <span>Export CSV</span>
                </button>

                <div className="flex gap-2">
                  <button
                    onClick={handleToggleEmergencyClose}
                    disabled={isActionLoading}
                    className={`px-4 py-2.5 rounded-xl border text-xs font-semibold flex items-center gap-2 cursor-pointer transition-all ${
                      drawSettings.emergency_closed
                        ? 'bg-emerald-950/80 border-emerald-500 text-emerald-300'
                        : 'bg-red-950/80 border-red-500 text-red-300'
                    }`}
                  >
                    <Power className="w-4 h-4" />
                    <span>
                      {drawSettings.emergency_closed ? 'Re-open Draw' : 'Emergency Close'}
                    </span>
                  </button>

                  <button
                    onClick={handleResetWinners}
                    disabled={isActionLoading}
                    title="Reset Winners (For testing only)"
                    className="p-2.5 rounded-xl bg-gray-900 border border-gray-700 text-gray-400 hover:text-red-300 hover:border-red-500/40 transition-all cursor-pointer"
                  >
                    <RotateCcw className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
