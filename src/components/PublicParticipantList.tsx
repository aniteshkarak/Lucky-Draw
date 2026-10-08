import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Search, Users, Ticket, RefreshCw } from 'lucide-react';
import { Participant } from '../types';
import { formatPlayedAt } from '../utils/time';
import { soundFx } from '../utils/audio';

interface PublicParticipantListProps {
  participants: Participant[];
  totalCount: number;
  isLoading: boolean;
  onRefresh: () => void;
}

export const PublicParticipantList: React.FC<PublicParticipantListProps> = ({
  participants,
  totalCount,
  isLoading,
  onRefresh,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const itemsPerPage = 15;

  const filteredParticipants = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    if (!q) return participants;
    return participants.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        String(p.lucky_number).includes(q)
    );
  }, [participants, searchTerm]);

  const totalPages = Math.ceil(filteredParticipants.length / itemsPerPage) || 1;
  const paginated = filteredParticipants.slice((page - 1) * itemsPerPage, page * itemsPerPage);

  const participantLabel =
    totalCount === 1 ? '1 Participant Joined' : `${totalCount} Participants Joined`;

  return (
    <div className="w-full max-w-4xl mx-auto px-4 py-8">
      <div className="glass-panel rounded-3xl p-6 sm:p-8 space-y-6">
        {/* Section Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gold-500/20 pb-5">
          <div>
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-gold-400" />
              <h3 className="font-serif-luxury text-2xl sm:text-3xl font-bold text-white tracking-wide">
                Live Participant Board
              </h3>
            </div>
            <p className="text-xs sm:text-sm text-gray-400 mt-0.5">
              Real-time feed of confirmed participants and their verified lucky numbers.
            </p>
          </div>

          {/* Count Badge & Refresh */}
          <div className="flex items-center gap-3">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-gold-500/10 border border-gold-500/30 text-gold-300 text-xs sm:text-sm font-bold shadow-gold-glow">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              <span>{participantLabel}</span>
            </div>

            <button
              onClick={() => {
                soundFx.playClick();
                onRefresh();
              }}
              title="Refresh Participant List"
              aria-label="Refresh Participant List"
              className="p-2 rounded-xl bg-[#161424] hover:bg-gold-500/10 border border-gold-500/20 text-gold-400 transition-all cursor-pointer"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gold-500/50">
            <Search className="w-4 h-4" />
          </div>
          <input
            type="text"
            placeholder="Search participant by name or 5-digit lucky number..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setPage(1);
            }}
            className="w-full pl-11 pr-4 py-3 rounded-2xl bg-[#121022] border border-gold-500/20 text-white placeholder-gray-500 focus:outline-none focus:border-gold-400 focus:ring-1 focus:ring-gold-500/30 text-xs sm:text-sm transition-all"
          />
        </div>

        {/* Participant Table / Cards */}
        {filteredParticipants.length === 0 ? (
          <div className="py-12 text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-gold-500/10 border border-gold-500/20 flex items-center justify-center mx-auto text-gold-400">
              <Ticket className="w-6 h-6" />
            </div>
            <p className="text-sm font-semibold text-gray-300">
              {searchTerm ? 'No matching participants found.' : '🎟️ No participants yet.'}
            </p>
            <p className="text-xs text-gray-500">
              {searchTerm
                ? 'Try searching with a different name or number.'
                : 'Be the first person to enter and get your lucky number!'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead>
                <tr className="border-b border-gold-500/15 text-gold-400/80 font-mono uppercase text-[11px] tracking-wider">
                  <th className="py-3 px-3 sm:px-4">#</th>
                  <th className="py-3 px-3 sm:px-4">Participant Name</th>
                  <th className="py-3 px-3 sm:px-4 text-center">Lucky Number</th>
                  <th className="py-3 px-3 sm:px-4 text-right">Registered</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gold-500/10">
                {paginated.map((p, idx) => (
                  <motion.tr
                    key={p.id || `${p.lucky_number}-${idx}`}
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2, delay: idx * 0.02 }}
                    className="hover:bg-gold-500/5 transition-colors group"
                  >
                    <td className="py-3.5 px-3 sm:px-4 font-mono text-gray-400 group-hover:text-gold-300">
                      {String(p.serial_no).padStart(2, '0')}
                    </td>
                    <td className="py-3.5 px-3 sm:px-4 font-medium text-white">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-gradient-to-br from-gold-600/30 to-purple-600/30 border border-gold-500/30 flex items-center justify-center text-[11px] font-bold text-gold-300 shrink-0">
                          {p.name.charAt(0).toUpperCase()}
                        </div>
                        <span className="truncate max-w-[140px] sm:max-w-[220px]">{p.name}</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-3 sm:px-4 text-center">
                      <span className="inline-block font-mono font-bold text-gold-300 bg-gold-500/10 border border-gold-500/30 px-2.5 py-1 rounded-lg text-xs sm:text-sm tracking-wider shadow-sm">
                        {p.lucky_number}
                      </span>
                    </td>
                    <td className="py-3.5 px-3 sm:px-4 text-right font-mono text-[11px] text-gray-400">
                      {formatPlayedAt(p.played_at)}
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between pt-4 border-t border-gold-500/15 text-xs text-gray-400">
            <div>
              Showing {((page - 1) * itemsPerPage) + 1}–{Math.min(page * itemsPerPage, filteredParticipants.length)} of {filteredParticipants.length}
            </div>
            <div className="flex items-center gap-2">
              <button
                disabled={page <= 1}
                onClick={() => {
                  soundFx.playClick();
                  setPage((p) => Math.max(1, p - 1));
                }}
                className="px-3 py-1.5 rounded-lg bg-[#161424] hover:bg-gold-500/10 border border-gold-500/20 disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer"
              >
                Previous
              </button>
              <span className="font-mono text-gold-300 px-2">
                Page {page} of {totalPages}
              </span>
              <button
                disabled={page >= totalPages}
                onClick={() => {
                  soundFx.playClick();
                  setPage((p) => Math.min(totalPages, p + 1));
                }}
                className="px-3 py-1.5 rounded-lg bg-[#161424] hover:bg-gold-500/10 border border-gold-500/20 disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
