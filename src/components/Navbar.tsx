import React, { useState, useEffect } from 'react';
import { Volume2, VolumeX, Shield, Clock, Heart } from 'lucide-react';
import { soundFx } from '../utils/audio';
import { formatISTTime } from '../utils/time';

interface NavbarProps {
  onOpenAdmin: () => void;
  statusText: string;
}

export const Navbar: React.FC<NavbarProps> = ({ onOpenAdmin, statusText }) => {
  const [isMuted, setIsMuted] = useState(soundFx.getMuted());
  const [currentTimeStr, setCurrentTimeStr] = useState(formatISTTime());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTimeStr(formatISTTime());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const handleToggleSound = () => {
    const newMuted = soundFx.toggleMute();
    setIsMuted(newMuted);
    if (!newMuted) {
      soundFx.playClick();
    }
  };

  return (
    <header className="sticky top-0 z-40 w-full backdrop-blur-xl bg-[#090810]/85 border-b border-gold-500/20 px-4 sm:px-8 py-3 transition-all">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-rose-400 via-rose-500 to-amber-500 flex items-center justify-center text-white text-lg shadow-md">
            💍
          </div>
          <div>
            <span className="block text-[10px] font-semibold tracking-widest text-rose-300 uppercase flex items-center gap-1">
              <span>Wedding Celebration</span>
              <Heart className="w-2.5 h-2.5 fill-rose-400 text-rose-400" />
            </span>
            <h1 className="text-xs sm:text-base font-bold text-white tracking-wide">
              Reon <span className="text-rose-300 font-serif italic font-normal">&</span> Priyanka <span className="text-gold-400">Lucky Draw</span>
            </h1>
          </div>
        </div>

        {/* Live IST Clock & Actions */}
        <div className="flex items-center gap-2 sm:gap-4">
          {/* IST Clock */}
          <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#161424] border border-gold-500/20 text-xs text-gold-200">
            <Clock className="w-3.5 h-3.5 text-gold-400 animate-spin" style={{ animationDuration: '8s' }} />
            <span className="font-mono">{currentTimeStr}</span>
          </div>

          {/* Status Badge */}
          <div className="hidden sm:inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-[#161424] border border-gold-500/30 text-gold-300">
            <span className="w-2 h-2 rounded-full bg-gold-400 mr-2 animate-ping" />
            {statusText}
          </div>

          {/* Sound Toggle Button */}
          <button
            onClick={handleToggleSound}
            aria-label={isMuted ? "Unmute sound" : "Mute sound"}
            title={isMuted ? "Sound Muted (Click to enable)" : "Sound On"}
            className="p-2 sm:px-3 sm:py-2 rounded-xl bg-[#161424] hover:bg-[#201d36] border border-gold-500/20 text-gold-400 hover:text-gold-200 transition-all flex items-center gap-1.5 text-xs font-medium cursor-pointer"
          >
            {isMuted ? (
              <>
                <VolumeX className="w-4 h-4 text-gray-400" />
                <span className="hidden sm:inline text-gray-400">Muted</span>
              </>
            ) : (
              <>
                <Volume2 className="w-4 h-4 text-gold-400" />
                <span className="hidden sm:inline text-gold-300">Sound On</span>
              </>
            )}
          </button>

          {/* Admin Button */}
          <button
            onClick={() => {
              soundFx.playClick();
              onOpenAdmin();
            }}
            aria-label="Open Admin Control Center"
            title="Organizer / Admin Panel"
            className="p-2 sm:px-3 sm:py-2 rounded-xl bg-[#161424] hover:bg-gold-500/10 border border-gold-500/20 text-gold-400/80 hover:text-gold-300 transition-all flex items-center gap-1.5 text-xs font-medium cursor-pointer"
          >
            <Shield className="w-4 h-4" />
            <span className="hidden sm:inline">Admin</span>
          </button>
        </div>
      </div>
    </header>
  );
};
