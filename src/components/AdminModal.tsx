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
  Settings2,
  Trash2,
  UserX,
  Users,
  Calendar,
  Zap,
  Check
} from 'lucide-react';
import { DrawSettings, Participant, WinnersData, DrawState } from '../types';
import { apiService } from '../services/supabase';
import { soundFx } from '../utils/audio';
import { formatPlayedAt, formatDisplayDate } from '../utils/time';

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

  // Schedule Management State
  const [scheduleDate, setScheduleDate] = useState(drawSettings.event_date || '2026-10-09');
  const [scheduleStartTime, setScheduleStartTime] = useState(drawSettings.start_time?.slice(0, 5) || '09:00');
  const [scheduleEndTime, setScheduleEndTime] = useState(drawSettings.end_time?.slice(0, 5) || '20:00');
  const [autoCleanup, setAutoCleanup] = useState(drawSettings.auto_cleanup_after_end ?? true);

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

  const handleDeleteParticipant = async (participant: Participant) => {
    if (
      !window.confirm(
        `Are you sure you want to delete participant "${participant.name}" (#${participant.lucky_number})?`
      )
    ) {
      return;
    }
    setIsActionLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);
    soundFx.playClick();

    try {
      const res = await apiService.adminDeleteParticipant(
        pin,
        participant.id,
        participant.lucky_number
      );
      if (res.success) {
        soundFx.playClick();
        setSuccessMsg(res.message);
        onSettingsUpdated();
      } else {
        soundFx.playError();
        setErrorMsg(res.message);
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to delete participant.';
      setErrorMsg(message);
      soundFx.playError();
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleClearAllParticipants = async () => {
    if (!window.confirm('⚠️ Are you sure you want to delete ALL participants and reset test data?')) return;
    setIsActionLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);
    soundFx.playClick();

    try {
      const res = await apiService.adminClearAllParticipants(pin);
      if (res.success) {
        setSuccessMsg(res.message);
        onSettingsUpdated();
      } else {
        setErrorMsg(res.message);
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to clear participants.';
      setErrorMsg(message);
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleSaveSchedule = async (
    date: string,
    start: string,
    end: string,
    cleanup: boolean
  ) => {
    setIsActionLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);
    soundFx.playClick();

    const formattedStart = start.length === 5 ? `${start}:00` : start;
    const formattedEnd = end.length === 5 ? `${end}:00` : end;

    try {
      const res = await apiService.adminConfigureSchedule(
        pin,
        date,
        formattedStart,
        formattedEnd,
        cleanup
      );
      if (res.success) {
        soundFx.playClick();
        setSuccessMsg(res.message);
        onSettingsUpdated();
      } else {
        soundFx.playError();
        setErrorMsg(res.message);
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to update schedule.';
      setErrorMsg(message);
      soundFx.playError();
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleApplyPreset = (preset: 'TEST_TOMORROW' | 'OFFICIAL_WEDDING') => {
    if (preset === 'TEST_TOMORROW') {
      const tomorrowStr = '2026-10-09';
      setScheduleDate(tomorrowStr);
      setScheduleStartTime('09:00');
      setScheduleEndTime('20:00');
      setAutoCleanup(true);
      handleSaveSchedule(tomorrowStr, '09:00:00', '20:00:00', true);
    } else {
      const weddingDate = '2026-10-25';
      setScheduleDate(weddingDate);
      setScheduleStartTime('20:00');
      setScheduleEndTime('21:00');
      setAutoCleanup(false);
      handleSaveSchedule(weddingDate, '20:00:00', '21:00:00', false);
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
    link.setAttribute('download', `wedding_lucky_draw_participants_${Date.now()}.csv`);
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
          className="relative w-full max-w-2xl my-8 glass-panel-glow rounded-3xl p-6 sm:p-8 text-white overflow-hidden shadow-2xl max-h-[90vh] overflow-y-auto"
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
                Organizer management, participant deletion & winner controls
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
                placeholder="Enter PIN (Default: 2026)"
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
                    className={`text-sm font-bold font-mono mt-1 ${drawSettings.emergency_closed ? 'text-red-400' : 'text-emerald-400'
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
                    className={`w-full py-3 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all cursor-pointer ${winnersData.winners_exist
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

              {/* Action 2: Manage & Delete Participants */}
              <div className="p-5 rounded-2xl bg-[#141224] border border-gold-500/20 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Users className="w-5 h-5 text-gold-400" />
                    <span className="text-sm font-bold text-white">Manage & Delete Participants</span>
                  </div>
                  {participants.length > 0 && (
                    <button
                      onClick={handleClearAllParticipants}
                      disabled={isActionLoading}
                      className="px-2.5 py-1 rounded-lg bg-red-950/80 hover:bg-red-900 border border-red-500/40 text-red-300 text-[11px] font-bold flex items-center gap-1 cursor-pointer transition-all"
                    >
                      <UserX className="w-3.5 h-3.5" />
                      <span>Clear All Test Data</span>
                    </button>
                  )}
                </div>

                {participants.length === 0 ? (
                  <p className="text-xs text-gray-400 italic py-2">No participants registered yet.</p>
                ) : (
                  <div className="max-h-48 overflow-y-auto space-y-1.5 pr-1 divide-y divide-gray-800/60">
                    {participants.map((p) => (
                      <div
                        key={p.id || p.lucky_number}
                        className="flex items-center justify-between py-2 px-2 hover:bg-white/5 rounded-lg transition-colors text-xs"
                      >
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-gray-400">#{p.serial_no}</span>
                          <span className="font-semibold text-white">{p.name}</span>
                          <span className="font-mono text-gold-300 bg-gold-500/10 px-1.5 py-0.5 rounded border border-gold-500/30">
                            {p.lucky_number}
                          </span>
                          <span className="text-[10px] text-gray-400 hidden sm:inline">
                            {formatPlayedAt(p.played_at)}
                          </span>
                        </div>
                        <button
                          onClick={() => handleDeleteParticipant(p)}
                          disabled={isActionLoading}
                          title={`Delete participant ${p.name}`}
                          className="p-1.5 rounded-md hover:bg-red-500/20 text-gray-400 hover:text-red-400 transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Action 3: Event Schedule & Automatic Data Wipe */}
              <div className="p-5 rounded-2xl bg-[#141224] border border-gold-500/30 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-gold-400" />
                    <span className="text-sm font-bold text-white">Event Schedule & Auto-Wipe</span>
                  </div>
                  <span className="px-2.5 py-0.5 rounded-full bg-gold-500/10 text-gold-300 text-[10px] font-bold border border-gold-500/30">
                    Asia/Kolkata (IST)
                  </span>
                </div>

                {/* Quick 1-Click Preset Buttons */}
                <div className="space-y-1.5">
                  <div className="text-[10px] uppercase font-bold tracking-wider text-gray-400">
                    ⚡ Quick 1-Click Presets:
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <button
                      onClick={() => handleApplyPreset('TEST_TOMORROW')}
                      disabled={isActionLoading}
                      className="p-2.5 rounded-xl bg-gradient-to-r from-amber-950/60 to-gold-950/60 hover:from-amber-900/80 hover:to-gold-900/80 border border-gold-500/40 text-gold-200 text-xs font-bold text-left flex items-start gap-2 cursor-pointer transition-all"
                    >
                      <Zap className="w-4 h-4 text-gold-400 shrink-0 mt-0.5" />
                      <div>
                        <div className="font-bold text-white">⚡ Tomorrow Test Schedule</div>
                        <div className="text-[10px] text-gold-300/80 font-normal">
                          9:00 AM – 8:00 PM IST • Auto-Wipe ON
                        </div>
                      </div>
                    </button>

                    <button
                      onClick={() => handleApplyPreset('OFFICIAL_WEDDING')}
                      disabled={isActionLoading}
                      className="p-2.5 rounded-xl bg-[#18162c] hover:bg-[#201d3a] border border-rose-500/30 text-rose-200 text-xs font-bold text-left flex items-start gap-2 cursor-pointer transition-all"
                    >
                      <Trophy className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                      <div>
                        <div className="font-bold text-white">💒 Official Wedding Day</div>
                        <div className="text-[10px] text-rose-300/80 font-normal">
                          25 Oct 2026 • 8:00 PM – 9:00 PM IST
                        </div>
                      </div>
                    </button>
                  </div>
                </div>

                {/* Custom Schedule Inputs */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                  <div>
                    <label className="text-[10px] font-semibold text-gray-400 block mb-1">
                      Event Date (YYYY-MM-DD)
                    </label>
                    <input
                      type="date"
                      value={scheduleDate}
                      onChange={(e) => setScheduleDate(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-[#0e0c1a] border border-gold-500/30 text-white text-xs font-mono focus:border-gold-400 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-semibold text-gray-400 block mb-1">
                      Start Time (IST)
                    </label>
                    <input
                      type="time"
                      value={scheduleStartTime}
                      onChange={(e) => setScheduleStartTime(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-[#0e0c1a] border border-gold-500/30 text-white text-xs font-mono focus:border-gold-400 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-semibold text-gray-400 block mb-1">
                      End Time (IST)
                    </label>
                    <input
                      type="time"
                      value={scheduleEndTime}
                      onChange={(e) => setScheduleEndTime(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-[#0e0c1a] border border-gold-500/30 text-white text-xs font-mono focus:border-gold-400 focus:outline-none"
                    />
                  </div>
                </div>

                {/* Auto Data Wipe Toggle */}
                <label className="flex items-center gap-2 p-3 rounded-xl bg-[#0e0c1a] border border-gold-500/20 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={autoCleanup}
                    onChange={(e) => setAutoCleanup(e.target.checked)}
                    className="w-4 h-4 rounded text-gold-500 accent-gold-500 cursor-pointer"
                  />
                  <div className="text-xs">
                    <span className="font-bold text-white">
                      Auto-delete all participants & winners when draw ends
                    </span>
                    <p className="text-[11px] text-gray-400">
                      Instantly cleans test database right after {formatDisplayDate(scheduleDate)} at {scheduleEndTime} IST.
                    </p>
                  </div>
                </label>

                <button
                  onClick={() => handleSaveSchedule(scheduleDate, scheduleStartTime, scheduleEndTime, autoCleanup)}
                  disabled={isActionLoading}
                  className="w-full py-2.5 rounded-xl bg-gold-500/20 hover:bg-gold-500/30 border border-gold-400 text-gold-200 font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer transition-all"
                >
                  <Check className="w-4 h-4" />
                  <span>Save Custom Schedule</span>
                </button>
              </div>

              {/* Action 4: Draw Status Switcher (Testing & Overrides) */}
              <div className="p-5 rounded-2xl bg-[#141224] border border-gold-500/20 space-y-3">
                <div className="flex items-center gap-2">
                  <Settings2 className="w-5 h-5 text-gold-400" />
                  <span className="text-sm font-bold text-white">Event State Override (Testing)</span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <button
                    onClick={() => handleChangeStatus('AUTO')}
                    disabled={isActionLoading}
                    className={`p-2.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${drawSettings.manual_override === 'AUTO'
                        ? 'bg-gold-500/20 border-gold-400 text-gold-200'
                        : 'bg-[#18162c] border-gray-700 text-gray-300 hover:border-gold-500/40'
                      }`}
                  >
                    Auto (Time-Based)
                  </button>
                  <button
                    onClick={() => handleChangeStatus('LIVE_DRAW')}
                    disabled={isActionLoading}
                    className={`p-2.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${drawSettings.status === 'LIVE_DRAW' || drawSettings.status === 'LIVE'
                        ? 'bg-gold-500/20 border-gold-400 text-gold-200'
                        : 'bg-[#18162c] border-gray-700 text-gray-300 hover:border-gold-500/40'
                      }`}
                  >
                    🔴 Force Live
                  </button>
                  <button
                    onClick={() => handleChangeStatus('BEFORE_DRAW')}
                    disabled={isActionLoading}
                    className={`p-2.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${drawSettings.status === 'BEFORE_DRAW' || drawSettings.status === 'SCHEDULED'
                        ? 'bg-blue-500/20 border-blue-400 text-blue-200'
                        : 'bg-[#18162c] border-gray-700 text-gray-300 hover:border-gold-500/40'
                      }`}
                  >
                    🔵 Force Before
                  </button>
                  <button
                    onClick={() => handleChangeStatus('DRAW_CLOSED')}
                    disabled={isActionLoading}
                    className={`p-2.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${drawSettings.status === 'DRAW_CLOSED' || drawSettings.status === 'CLOSED'
                        ? 'bg-purple-500/20 border-purple-400 text-purple-200'
                        : 'bg-[#18162c] border-gray-700 text-gray-300 hover:border-gold-500/40'
                      }`}
                  >
                    🔒 Force Closed
                  </button>
                </div>
              </div>

              {/* Action 4: Utilities & Emergency Controls */}
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
                    className={`px-4 py-2.5 rounded-xl border text-xs font-semibold flex items-center gap-2 cursor-pointer transition-all ${drawSettings.emergency_closed
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
