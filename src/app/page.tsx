'use client';

import { useState } from 'react';
import { useRealtimeQueue } from '@/hooks/useRealtimeQueue';
import { Navbar } from '@/components/Navbar';
import { QueueCard } from '@/components/QueueCard';
import { RequestNavigation, RequestMenuTab } from '@/components/RequestNavigation';
import { SopModal } from '@/components/SopModal';
import {
  Zap,
  Music,
  FileText,
  Camera,
  Sparkles,
  History,
  BookOpen,
  Calendar,
} from 'lucide-react';
import { isToday, groupRequestsByDate } from '@/lib/dateUtils';

export default function PublicQueuePage() {
  const { requests, settings, isConnected, isLoading } = useRealtimeQueue();
  const [activeTab, setActiveTab] = useState<RequestMenuTab>('SONGS');
  const [songFilter, setSongFilter] = useState<'ALL' | 'FAST_TRACK'>('ALL');
  const [cosplayFilter, setCosplayFilter] = useState<string>('ALL');
  const [historyFilter, setHistoryFilter] = useState<string>('ALL');
  const [historyDateFilter, setHistoryDateFilter] = useState<'TODAY' | 'ALL'>('TODAY');
  const [isSopOpen, setIsSopOpen] = useState(false);

  // Categorize requests into separate datasets
  // "untuk lagu, hanya tampilkan lagu hari ini"
  const pendingSongs = requests.filter(
    (r) => r.requestType === 'LAGU' && r.status !== 'COMPLETED' && (isToday(r.createdAt) || r.status === 'PLAYING')
  );
  const pendingFansigns = requests.filter((r) => r.requestType === 'FANSIGN' && r.status !== 'COMPLETED');
  const pendingPaps = requests.filter((r) => r.requestType === 'PAP' && r.status !== 'COMPLETED');
  const pendingCosplays = requests.filter((r) => r.requestType === 'COSPLAY' && r.status !== 'COMPLETED');
  // Data tersimpan: semua request completed, serta lagu dari hari-hari sebelumnya
  const storedRequests = requests.filter(
    (r) => r.status === 'COMPLETED' || (!isToday(r.createdAt) && r.requestType === 'LAGU')
  );

  const todayStoredRequests = storedRequests.filter((r) => isToday(r.completedAt || r.createdAt));
  const fastTrackSongCount = pendingSongs.filter((r) => r.isFastTrack).length;

  const counts = {
    songs: pendingSongs.length,
    fansign: pendingFansigns.length,
    pap: pendingPaps.length,
    cosplay: pendingCosplays.length,
    history: todayStoredRequests.length,
  };

  const displayedSongs = pendingSongs.filter((item) => {
    if (songFilter === 'FAST_TRACK') return item.isFastTrack;
    return true;
  });

  const displayedCosplays = pendingCosplays.filter((item) => {
    if (cosplayFilter === 'ALL') return true;
    return item.cosplaySubType === cosplayFilter;
  });

  const dateFilteredHistory = storedRequests.filter((item) => {
    if (historyDateFilter === 'TODAY') {
      return isToday(item.completedAt || item.createdAt);
    }
    return true;
  });

  const displayedHistory = dateFilteredHistory.filter((item) => {
    if (historyFilter === 'ALL') return true;
    return item.requestType === historyFilter;
  });

  return (
    <div className="min-h-screen bg-[#FFFDF5] text-[#121212] flex flex-col pb-20">
      <Navbar isConnected={isConnected} />

      <main className="flex-1 max-w-xl w-full mx-auto p-3 sm:p-4 space-y-3">
        {/* Compact Live Header */}
        <div className="neo-box bg-[#FFE600] p-3 flex items-center justify-between gap-2">
          <div>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-red-600 animate-ping" />
              <span className="text-[10px] font-black uppercase tracking-wider bg-black text-white px-1.5 py-0.2">
                HOTARU LIVE
              </span>
              <span className="text-xs font-black text-black">
                {settings?.hostName || 'Hotaru Live'}
              </span>
            </div>
            <h1 className="text-base sm:text-lg font-black uppercase text-black mt-0.5">
              Daftar Antrean Hotaru Live
            </h1>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setIsSopOpen(true)}
              className="px-2 py-1 bg-white hover:bg-black hover:text-white border border-black font-black text-[11px] uppercase flex items-center gap-1 shadow-[1px_1px_0_0_#000] transition-colors"
              title="Baca SOP & Cara Request"
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>SOP</span>
            </button>
          </div>
        </div>

        {/* SEPARATE MENUS: Desktop Tabs + Mobile Sidebar Drawer */}
        <RequestNavigation
          activeTab={activeTab}
          onTabChange={setActiveTab}
          counts={counts}
          fastTrackCount={fastTrackSongCount}
        />

        {/* TAB 1: ANTREAN LAGU */}
        {activeTab === 'SONGS' && (
          <div className="space-y-3">
            {/* Song Filter Bar */}
            <div className="flex items-center justify-between gap-1.5 flex-wrap">
              <span className="h-7 px-2.5 bg-[#FFE600] border border-black shadow-[1.5px_1.5px_0_0_#000] text-xs font-black uppercase inline-flex items-center gap-1">
                <Music className="w-3.5 h-3.5" />
                <span>Antrean Lagu Hari Ini ({pendingSongs.length})</span>
              </span>

              <div className="flex items-center gap-1 text-xs font-black select-none">
                <button
                  key="ALL"
                  onClick={() => setSongFilter('ALL')}
                  className={`px-2.5 py-1 border-[1.5px] border-black uppercase text-xs transition-all ${
                    songFilter === 'ALL'
                      ? 'bg-black text-white shadow-[1.5px_1.5px_0_0_#FFE600]'
                      : 'bg-white text-gray-800 hover:bg-gray-100'
                  }`}
                >
                  Semua ({pendingSongs.length})
                </button>
                <button
                  key="FAST_TRACK"
                  onClick={() => setSongFilter('FAST_TRACK')}
                  className={`px-2.5 py-1 border-[1.5px] border-black uppercase text-xs flex items-center gap-1 transition-all ${
                    songFilter === 'FAST_TRACK'
                      ? 'bg-red-600 text-white shadow-[1.5px_1.5px_0_0_#000]'
                      : 'bg-white text-red-600 hover:bg-red-50'
                  }`}
                >
                  <Zap className="w-3 h-3 fill-current" />
                  <span>Fast Track ({fastTrackSongCount})</span>
                </button>
              </div>
            </div>

            {/* Song Queue List */}
            <div className="space-y-2.5">
              {isLoading ? (
                <div className="neo-box p-8 text-center bg-white text-xs font-black uppercase">
                  Memuat antrean lagu...
                </div>
              ) : displayedSongs.length === 0 ? (
                <div className="neo-box p-6 text-center bg-white text-xs font-bold text-gray-500 border-[2px] border-black">
                  {songFilter === 'FAST_TRACK'
                    ? 'Tidak ada lagu Fast Track saat ini.'
                    : 'Belum ada antrean lagu saat ini.'}
                </div>
              ) : (
                displayedSongs.map((item, index) => (
                  <QueueCard key={item.id} item={item} index={index} isAdmin={false} />
                ))
              )}
            </div>
          </div>
        )}

        {/* TAB 2: REQUEST FANSIGN */}
        {activeTab === 'FANSIGN' && (
          <div className="space-y-3">
            <div className="neo-box bg-[#A855F7] text-white p-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                <div>
                  <h3 className="text-sm font-black uppercase">Request Fansign</h3>
                  <p className="text-[11px] text-purple-100">Daftar tulisan ucapan & nama fansign</p>
                </div>
              </div>
              <span className="px-2 py-0.5 bg-black text-white text-xs font-black border border-white">
                {pendingFansigns.length} Total
              </span>
            </div>

            <div className="space-y-2.5">
              {isLoading ? (
                <div className="neo-box p-8 text-center bg-white text-xs font-black uppercase">
                  Memuat fansign...
                </div>
              ) : pendingFansigns.length === 0 ? (
                <div className="neo-box p-6 text-center bg-white text-xs font-bold text-gray-500 border-[2px] border-black">
                  Belum ada request Fansign saat ini.
                </div>
              ) : (
                pendingFansigns.map((item, index) => (
                  <QueueCard key={item.id} item={item} index={index} isAdmin={false} />
                ))
              )}
            </div>
          </div>
        )}

        {/* TAB 3: REQUEST PAP */}
        {activeTab === 'PAP' && (
          <div className="space-y-3">
            <div className="neo-box bg-[#FF2E93] text-white p-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Camera className="w-5 h-5" />
                <div>
                  <h3 className="text-sm font-black uppercase">Request PAP</h3>
                  <p className="text-[11px] text-pink-100">Permintaan foto & pose di Hotaru Live</p>
                </div>
              </div>
              <span className="px-2 py-0.5 bg-black text-white text-xs font-black border border-white">
                {pendingPaps.length} Total
              </span>
            </div>

            <div className="space-y-2.5">
              {isLoading ? (
                <div className="neo-box p-8 text-center bg-white text-xs font-black uppercase">
                  Memuat request PAP...
                </div>
              ) : pendingPaps.length === 0 ? (
                <div className="neo-box p-6 text-center bg-white text-xs font-bold text-gray-500 border-[2px] border-black">
                  Belum ada request PAP saat ini.
                </div>
              ) : (
                pendingPaps.map((item, index) => (
                  <QueueCard key={item.id} item={item} index={index} isAdmin={false} />
                ))
              )}
            </div>
          </div>
        )}

        {/* TAB 4: REQUEST COSPLAY */}
        {activeTab === 'COSPLAY' && (
          <div className="space-y-3">
            <div className="neo-box bg-[#FF7A00] text-white p-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5" />
                <div>
                  <h3 className="text-sm font-black uppercase">Request Cosplay</h3>
                  <p className="text-[11px] text-orange-100">Karakter Anime & Game yang diminta</p>
                </div>
              </div>
              <span className="px-2 py-0.5 bg-black text-white text-xs font-black border border-white">
                {pendingCosplays.length} Total
              </span>
            </div>

            {/* Sub filter Anime / Game */}
            <div className="flex items-center gap-1.5 text-xs font-black select-none">
              {[
                { id: 'ALL', label: `Semua (${pendingCosplays.length})` },
                { id: 'ANIME', label: `Anime (${pendingCosplays.filter((r) => r.cosplaySubType === 'ANIME').length})` },
                { id: 'GAME', label: `Game (${pendingCosplays.filter((r) => r.cosplaySubType === 'GAME').length})` },
              ].map((f) => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setCosplayFilter(f.id)}
                  className={`px-2.5 py-1 border-[1.5px] border-black text-xs font-black transition-all ${
                    cosplayFilter === f.id
                      ? 'bg-black text-white shadow-[1.5px_1.5px_0_0_#FFE600]'
                      : 'bg-white text-gray-800 hover:bg-gray-100'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>

            <div className="space-y-2.5">
              {isLoading ? (
                <div className="neo-box p-8 text-center bg-white text-xs font-black uppercase">
                  Memuat request cosplay...
                </div>
              ) : displayedCosplays.length === 0 ? (
                <div className="neo-box p-6 text-center bg-white text-xs font-bold text-gray-500 border-[2px] border-black">
                  Belum ada request Cosplay di bagian ini.
                </div>
              ) : (
                displayedCosplays.map((item, index) => (
                  <QueueCard key={item.id} item={item} index={index} isAdmin={false} />
                ))
              )}
            </div>
          </div>
        )}

        {/* TAB 5: HISTORY */}
        {activeTab === 'HISTORY' && (
          <div className="space-y-3">
            <div className="neo-box bg-gray-800 text-white p-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <History className="w-5 h-5 text-[#FFE600]" />
                <div>
                  <h3 className="text-sm font-black uppercase">Riwayat Data Tersimpan</h3>
                  <p className="text-[11px] text-gray-300">
                    {historyDateFilter === 'TODAY' ? 'Menampilkan riwayat hari ini' : 'Menampilkan semua riwayat'}
                  </p>
                </div>
              </div>
              <span className="px-2 py-0.5 bg-[#FFE600] text-black text-xs font-black border border-black">
                {dateFilteredHistory.length} Data
              </span>
            </div>

            {/* Date Filter: Hari Ini (Default) vs Semua Tanggal */}
            <div className="flex items-center gap-2 border-b-2 border-black pb-2">
              <button
                type="button"
                onClick={() => setHistoryDateFilter('TODAY')}
                className={`px-3 py-1.5 border-[2px] border-black text-xs font-black uppercase flex items-center gap-1.5 transition-all cursor-pointer ${
                  historyDateFilter === 'TODAY'
                    ? 'bg-[#FFE600] text-black shadow-[2px_2px_0_0_#000]'
                    : 'bg-white text-gray-700 hover:bg-gray-100'
                }`}
              >
                <Calendar className="w-3.5 h-3.5" />
                <span>Hari Ini ({todayStoredRequests.length})</span>
              </button>
              <button
                type="button"
                onClick={() => setHistoryDateFilter('ALL')}
                className={`px-3 py-1.5 border-[2px] border-black text-xs font-black uppercase flex items-center gap-1.5 transition-all cursor-pointer ${
                  historyDateFilter === 'ALL'
                    ? 'bg-black text-white shadow-[2px_2px_0_0_#FFE600]'
                    : 'bg-white text-gray-700 hover:bg-gray-100'
                }`}
              >
                <span>Semua Tanggal ({storedRequests.length})</span>
              </button>
            </div>

            {/* Sub-filter by Request Type */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar text-xs font-black select-none">
              {[
                { id: 'ALL', label: `Semua (${dateFilteredHistory.length})` },
                { id: 'LAGU', label: `🎵 Lagu (${dateFilteredHistory.filter((r) => r.requestType === 'LAGU').length})` },
                { id: 'FANSIGN', label: `✍️ Fansign (${dateFilteredHistory.filter((r) => r.requestType === 'FANSIGN').length})` },
                { id: 'PAP', label: `📸 PAP (${dateFilteredHistory.filter((r) => r.requestType === 'PAP').length})` },
                { id: 'COSPLAY', label: `🎭 Cosplay (${dateFilteredHistory.filter((r) => r.requestType === 'COSPLAY').length})` },
              ].map((f) => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setHistoryFilter(f.id)}
                  className={`shrink-0 px-2 py-1 border-[1.5px] border-black text-xs font-black transition-all cursor-pointer ${
                    historyFilter === f.id
                      ? 'bg-black text-white shadow-[1.5px_1.5px_0_0_#FFE600]'
                      : 'bg-white text-gray-800 hover:bg-gray-100'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>

            <div className="space-y-3">
              {isLoading ? (
                <div className="neo-box p-8 text-center bg-white text-xs font-black uppercase">
                  Memuat data...
                </div>
              ) : displayedHistory.length === 0 ? (
                <div className="neo-box p-8 text-center bg-gray-50 border-[2px] border-dashed border-gray-400 text-xs font-bold text-gray-500 space-y-2">
                  <p>Belum ada data riwayat {historyDateFilter === 'TODAY' ? 'untuk hari ini' : 'pada filter ini'}.</p>
                  {historyDateFilter === 'TODAY' && storedRequests.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setHistoryDateFilter('ALL')}
                      className="text-xs font-black text-black underline underline-offset-2 hover:text-blue-600 cursor-pointer block mx-auto"
                    >
                      Lihat semua riwayat tanggal sebelumnya ({storedRequests.length} data) →
                    </button>
                  )}
                </div>
              ) : (
                groupRequestsByDate(displayedHistory).map((group) => (
                  <div key={group.dateKey} className="space-y-2">
                    <div className="flex items-center justify-between bg-yellow-100 border-[2px] border-black px-2.5 py-1.5 shadow-[2px_2px_0_0_#000]">
                      <span className="text-xs font-black uppercase tracking-wide text-black flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-black" />
                        <span>{group.dateLabel}</span>
                      </span>
                      <span className="text-[10px] font-mono font-bold bg-white text-black px-1.5 py-0.5 border border-black shadow-[1px_1px_0_0_#000]">
                        {group.items.length} Data
                      </span>
                    </div>

                    <div className="space-y-2">
                      {group.items.map((item, index) => (
                        <QueueCard key={item.id} item={item} index={index} isAdmin={false} />
                      ))}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </main>

      {/* SOP Guide Modal */}
      <SopModal isOpen={isSopOpen} onClose={() => setIsSopOpen(false)} />

      <footer className="p-3 text-center text-[11px] font-bold text-gray-500 border-t border-gray-300">
        Hotaru Live • Real-Time Queue
      </footer>
    </div>
  );
}

