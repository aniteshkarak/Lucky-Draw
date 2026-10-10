import React, { useState, useEffect, useCallback } from 'react';
import { Navbar } from './components/Navbar';
import { DrawStatusBanner } from './components/DrawStatusBanner';
import { HeroSection } from './components/HeroSection';
import { ParticipationForm } from './components/ParticipationForm';
import { WinnerRevealSection } from './components/WinnerRevealSection';
import { PublicParticipantList } from './components/PublicParticipantList';
import { WeddingWishesSection } from './components/WeddingWishesSection';
import { LuckyTicketModal } from './components/LuckyTicketModal';
import { AdminModal } from './components/AdminModal';
import { Footer } from './components/Footer';

import { DrawSettings, Participant, WinnersData } from './types';
import { apiService } from './services/supabase';
import {
  calculateTimeRemaining,
  parseISTDate,
  TimeRemaining,
} from './utils/time';
import {
  getEventParticipation,
  saveEventParticipation,
  handleNewEventTransition,
} from './utils/storage';

export const App: React.FC = () => {
  // State
  const [drawSettings, setDrawSettings] = useState<DrawSettings>({
    event_date: '2026-10-10',
    start_time: '20:00:00',
    end_time: '21:00:00',
    timezone: 'Asia/Kolkata',
    status: 'BEFORE_DRAW',
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

  // Cached user ticket for current event
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
        apiService.getPublicParticipants('', 1000, 0),
        apiService.getPublicWinners(),
      ]);

      const eventId =
        settings.event_id ||
        `event_${settings.event_date}_${settings.start_time.replace(/:/g, '').slice(0, 4)}_${settings.end_time.replace(/:/g, '').slice(0, 4)}`;

      // Ensure new event transition handles previous events
      handleNewEventTransition(eventId);

      setDrawSettings(settings);
      setParticipants(partData.participants);
      setTotalCount(partData.total_count);
      setWinnersData(winData);

      // Check localStorage for participation record for THIS specific event ID
      const localRecord = getEventParticipation(eventId);
      if (localRecord) {
        setLastUserTicket({
          serial_no: 0,
          event_id: localRecord.event_id,
          name: localRecord.name,
          lucky_number: localRecord.lucky_number,
          played_at: localRecord.played_at,
        });
      } else {
        setLastUserTicket(null);
      }
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

    return () => {
      unsubscribe();
    };
  }, [fetchData]);

  // Update countdown every second and handle automatic transitions
  useEffect(() => {
    const updateCountdown = () => {
      let target: Date;

      if (drawSettings.status === 'BEFORE_DRAW' || drawSettings.status === 'SCHEDULED') {
        target = parseISTDate(drawSettings.event_date, drawSettings.start_time);
      } else {
        // LIVE, LIVE_DRAW or other
        target = parseISTDate(drawSettings.event_date, drawSettings.end_time);
      }

      const remaining = calculateTimeRemaining(target);
      setTimeRemaining(remaining);

      // Automatic real-time status transitions:
      // 1. When start countdown reaches 0: auto-unlock from BEFORE_DRAW to LIVE_DRAW
      // 2. When live draw countdown reaches 0: auto-lock from LIVE_DRAW to DRAW_CLOSED and select winners
      if (remaining.isPast) {
        if (drawSettings.status === 'BEFORE_DRAW' || drawSettings.status === 'SCHEDULED') {
          fetchData();
        } else if (drawSettings.status === 'LIVE_DRAW' || drawSettings.status === 'LIVE' || drawSettings.status === 'DRAW_CLOSED') {
          if (!winnersData.winners_exist && totalCount > 0) {
            apiService.selectWinners().finally(() => {
              fetchData();
            });
          } else {
            fetchData();
          }
        }
      }
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, [
    drawSettings.status,
    drawSettings.event_date,
    drawSettings.start_time,
    drawSettings.end_time,
    winnersData.winners_exist,
    totalCount,
    fetchData,
  ]);

  const handleParticipationSuccess = (
    participant: { name: string; lucky_number: number; played_at: string },
    isAlready: boolean
  ) => {
    const currentEventId =
      drawSettings.event_id ||
      `event_${drawSettings.event_date}_${drawSettings.start_time.replace(/:/g, '').slice(0, 4)}_${drawSettings.end_time.replace(/:/g, '').slice(0, 4)}`;

    // Save participation record to localStorage under lucky_draw_participation_<event_id>
    saveEventParticipation(currentEventId, {
      name: participant.name,
      lucky_number: participant.lucky_number,
      played_at: participant.played_at,
    });

    setActiveTicket(participant);
    setIsAlreadyTicket(isAlready);
    setIsTicketOpen(true);

    const ticketObj: Participant = {
      serial_no: totalCount + 1,
      event_id: currentEventId,
      name: participant.name,
      lucky_number: participant.lucky_number,
      played_at: participant.played_at,
    };
    setLastUserTicket(ticketObj);

    fetchData();
  };

  const handleCtaClick = () => {
    if (drawSettings.status === 'WINNERS_PUBLISHED' || winnersData.winners_exist) {
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

  const countdownText =
    timeRemaining.days > 0
      ? `${timeRemaining.days}d ${timeRemaining.hours}h ${timeRemaining.minutes}m ${timeRemaining.seconds}s`
      : `${String(timeRemaining.hours).padStart(2, '0')}:${String(timeRemaining.minutes).padStart(
          2,
          '0'
        )}:${String(timeRemaining.seconds).padStart(2, '0')}`;

  const isLive = drawSettings.status === 'LIVE_DRAW' || drawSettings.status === 'LIVE';
  const isBefore = drawSettings.status === 'BEFORE_DRAW' || drawSettings.status === 'SCHEDULED';
  const isWinners = drawSettings.status === 'WINNERS_PUBLISHED' || winnersData.winners_exist;

  return (
    <div className="min-h-screen bg-[#090810] text-[#FAFAF9] flex flex-col relative overflow-x-hidden selection:bg-gold-500 selection:text-black">
      {/* Background Ambient Glow */}
      <div className="aurora-bg" />

      {/* Navigation Bar */}
      <Navbar
        onOpenAdmin={() => setIsAdminOpen(true)}
        statusText={
          isLive
            ? '🔴 LIVE DRAW'
            : isBefore
              ? 'Draw Scheduled'
              : isWinners
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
          eventDate={drawSettings.event_date}
          startTime={drawSettings.start_time}
          endTime={drawSettings.end_time}
          onCtaClick={handleCtaClick}
        />

        {/* 2. Winner Announcement Podium */}
        <WinnerRevealSection
          winnersData={winnersData}
          status={drawSettings.status}
          endTime={drawSettings.end_time}
          startTime={drawSettings.start_time}
          eventDate={drawSettings.event_date}
          totalParticipants={totalCount}
          isLoading={isLoading}
        />

        {/* 3. Participation Form */}
        <ParticipationForm
          status={drawSettings.status}
          onSuccess={handleParticipationSuccess}
          lastParticipant={lastUserTicket}
          startTime={drawSettings.start_time}
          endTime={drawSettings.end_time}
          eventDate={drawSettings.event_date}
        />

        {/* 4. Live Participant Board */}
        <PublicParticipantList
          participants={participants}
          totalCount={totalCount}
          isLoading={isLoading}
          onRefresh={fetchData}
        />

        {/* 5. Wedding Wishes & Blessings */}
        <WeddingWishesSection />
      </main>

      {/* Footer */}
      <Footer
        eventDate={drawSettings.event_date}
        startTime={drawSettings.start_time}
        endTime={drawSettings.end_time}
      />

      {/* Modals */}
      <LuckyTicketModal
        isOpen={isTicketOpen}
        onClose={() => setIsTicketOpen(false)}
        participant={activeTicket}
        isAlreadyRegistered={isAlreadyTicket}
        eventDate={drawSettings.event_date}
        startTime={drawSettings.start_time}
        endTime={drawSettings.end_time}
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
