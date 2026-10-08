import React, { useState, useEffect, useCallback } from 'react';
import { Navbar } from './components/Navbar';
import { DrawStatusBanner } from './components/DrawStatusBanner';
import { HeroSection } from './components/HeroSection';
import { ParticipationForm } from './components/ParticipationForm';
import { WinnerRevealSection } from './components/WinnerRevealSection';
import { PublicParticipantList } from './components/PublicParticipantList';
import { BirthdayWishesSection } from './components/BirthdayWishesSection';
import { LuckyTicketModal } from './components/LuckyTicketModal';
import { AdminModal } from './components/AdminModal';
import { Footer } from './components/Footer';

import { DrawSettings, Participant, WinnersData } from './types';
import { apiService } from './services/supabase';
import {
  calculateTimeRemaining,
  getEventStartTime,
  getEventEndTime,
  TimeRemaining,
} from './utils/time';

export const App: React.FC = () => {
  // State
  const [drawSettings, setDrawSettings] = useState<DrawSettings>({
    event_date: '2026-10-25',
    start_time: '20:00:00',
    end_time: '21:00:00',
    timezone: 'Asia/Kolkata',
    status: 'LIVE_DRAW',
    server_time_ist: new Date().toISOString(),
    total_participants: 0,
    winners_selected: false,
    emergency_closed: false,
  });

  const [participants, setParticipants] = useState<Participant[]>([]);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [winnersData, setWinnersData] = useState<WinnersData>({ winners_exist: false });
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Modal states
  const [isAdminOpen, setIsAdminOpen] = useState<boolean>(false);
  const [isTicketOpen, setIsTicketOpen] = useState<boolean>(false);
  const [activeTicket, setActiveTicket] = useState<{
    name: string;
    lucky_number: number;
    played_at: string;
  } | null>(null);
  const [isAlreadyTicket, setIsAlreadyTicket] = useState<boolean>(false);

  // Cached user ticket for convenience
  const [lastUserTicket, setLastUserTicket] = useState<Participant | null>(null);

  // Countdown timer calculation
  const [timeRemaining, setTimeRemaining] = useState<TimeRemaining>({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
    totalMs: 0,
    isPast: false,
  });

  // Fetch all state from backend
  const fetchData = useCallback(async () => {
    try {
      const [settings, partData, winData] = await Promise.all([
        apiService.getDrawStatus(),
        apiService.getPublicParticipants('', 100, 0),
        apiService.getPublicWinners(),
      ]);

      setDrawSettings(settings);
      setParticipants(partData.participants);
      setTotalCount(partData.total_count);
      setWinnersData(winData);
    } catch (err) {
      console.error('Failed to fetch draw data:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Initial load and real-time subscription
  useEffect(() => {
    fetchData();
    const unsubscribe = apiService.subscribeToUpdates(() => {
      fetchData();
    });

    // Check localStorage for previously saved ticket on this browser
    try {
      const stored = localStorage.getItem('dada_my_ticket');
      if (stored) {
        setLastUserTicket(JSON.parse(stored));
      }
    } catch {
      // ignore
    }

    return () => {
      unsubscribe();
    };
  }, [fetchData]);

  // Update countdown every second
  useEffect(() => {
    const updateCountdown = () => {
      let target: Date;

      if (drawSettings.status === 'BEFORE_DRAW') {
        target = getEventStartTime();
      } else {
        // LIVE_DRAW or other
        target = getEventEndTime();
      }

      const remaining = calculateTimeRemaining(target);
      setTimeRemaining(remaining);
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, [drawSettings.status]);

  const handleParticipationSuccess = (
    participant: { name: string; lucky_number: number; played_at: string },
    isAlready: boolean
  ) => {
    setActiveTicket(participant);
    setIsAlreadyTicket(isAlready);
    setIsTicketOpen(true);

    const ticketObj: Participant = {
      serial_no: totalCount + 1,
      name: participant.name,
      lucky_number: participant.lucky_number,
      played_at: participant.played_at,
    };
    setLastUserTicket(ticketObj);
    try {
      localStorage.setItem('dada_my_ticket', JSON.stringify(ticketObj));
    } catch {
      // ignore
    }

    fetchData();
  };

  const handleCtaClick = () => {
    if (drawSettings.status === 'WINNERS_PUBLISHED') {
      const winEl = document.getElementById('winners-section');
      if (winEl) {
        winEl.scrollIntoView({ behavior: 'smooth' });
      }
    } else {
      const partEl = document.getElementById('participate-section');
      if (partEl) {
        partEl.scrollIntoView({ behavior: 'smooth' });
      }
    }
  };

  const countdownText = `${String(timeRemaining.hours).padStart(2, '0')}:${String(
    timeRemaining.minutes
  ).padStart(2, '0')}:${String(timeRemaining.seconds).padStart(2, '0')}`;

  return (
    <div className="min-h-screen bg-[#090810] text-[#FAFAF9] flex flex-col relative overflow-x-hidden selection:bg-gold-500 selection:text-black">
      {/* Background Ambient Glow */}
      <div className="aurora-bg" />

      {/* Navigation Bar */}
      <Navbar
        onOpenAdmin={() => setIsAdminOpen(true)}
        statusText={
          drawSettings.status === 'LIVE_DRAW'
            ? '🔴 LIVE DRAW'
            : drawSettings.status === 'BEFORE_DRAW'
            ? 'Starts 8:00 PM IST'
            : drawSettings.status === 'WINNERS_PUBLISHED'
            ? '🏆 Winners Declared'
            : 'Draw Closed'
        }
      />

      {/* Draw Status Ribbon */}
      <DrawStatusBanner status={drawSettings.status} countdownText={countdownText} />

      {/* Main Content Sections */}
      <main className="flex-1 relative z-10 space-y-8 pb-16">
        {/* 1. Hero Section */}
        <HeroSection
          status={drawSettings.status}
          timeRemaining={timeRemaining}
          totalParticipants={totalCount}
          onCtaClick={handleCtaClick}
        />

        {/* 2. Winner Announcement Podium (If published or closed) */}
        {(drawSettings.status === 'WINNERS_PUBLISHED' || winnersData.winners_exist) && (
          <WinnerRevealSection winnersData={winnersData} status={drawSettings.status} />
        )}

        {/* 3. Participation Form */}
        <ParticipationForm
          status={drawSettings.status}
          onSuccess={handleParticipationSuccess}
          lastParticipant={lastUserTicket}
        />

        {/* 4. Pre-winners preview (if not yet published) */}
        {!winnersData.winners_exist && drawSettings.status !== 'WINNERS_PUBLISHED' && (
          <WinnerRevealSection winnersData={winnersData} status={drawSettings.status} />
        )}

        {/* 5. Live Participant Board */}
        <PublicParticipantList
          participants={participants}
          totalCount={totalCount}
          isLoading={isLoading}
          onRefresh={fetchData}
        />

        {/* 6. Birthday Tribute to Dada */}
        <BirthdayWishesSection />
      </main>

      {/* Footer */}
      <Footer />

      {/* Modals */}
      <LuckyTicketModal
        isOpen={isTicketOpen}
        onClose={() => setIsTicketOpen(false)}
        participant={activeTicket}
        isAlreadyRegistered={isAlreadyTicket}
      />

      <AdminModal
        isOpen={isAdminOpen}
        onClose={() => setIsAdminOpen(false)}
        drawSettings={drawSettings}
        participants={participants}
        winnersData={winnersData}
        onSettingsUpdated={fetchData}
      />
    </div>
  );
};
