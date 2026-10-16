'use client';

import { useState } from 'react';
import { useRealtimeQueue } from '@/hooks/useRealtimeQueue';
import { Navbar } from '@/components/Navbar';
import { QueueCard } from '@/components/QueueCard';
import { RequestModal } from '@/components/RequestModal';
import { RequestNavigation, RequestMenuTab } from '@/components/RequestNavigation';
import { FloatingActionButton } from '@/components/FloatingActionButton';
import { RequestItem } from '@/types';
import {
  Plus,
  Key,
  Check,
  Music,
  FileText,
  Camera,
  Sparkles,
  History,
  Zap,
  Calendar,
} from 'lucide-react';
import { isToday, groupRequestsByDate } from '@/lib/dateUtils';

export default function HostDashboardPage() {
  const { requests, settings, isConnected, isLoading, refetch } = useRealtimeQueue();
  const [activeTab, setActiveTab] = useState<RequestMenuTab>('SONGS');
  const [songFilter, setSongFilter] = useState<'ALL' | 'FAST_TRACK'>('ALL');
  const [cosplayFilter, setCosplayFilter] = useState<string>('ALL');
  const [historyFilter, setHistoryFilter] = useState<string>('ALL');
  const [historyDateFilter, setHistoryDateFilter] = useState<'TODAY' | 'ALL'>('TODAY');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isPinSettingsOpen, setIsPinSettingsOpen] = useState(false);
  const [moderatorPin, setModeratorPin] = useState(settings?.moderatorPin || '8888');
  const [pinSaved, setPinSaved] = useState(false);

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

  // Current playing song or first pending song
  const currentSong =
    requests.find((r) => r.status === 'PLAYING' && r.requestType === 'LAGU') ||
    requests.find((r) => r.status === 'PENDING' && r.requestType === 'LAGU') ||
    null;

  // Actions
  const handleMarkDone = async (id: string) => {
    const item = requests.find((r) => r.id === id);
    if (!item) return;

    const newStatus = item.status === 'COMPLETED' ? 'PENDING' : 'COMPLETED';
    try {
      await fetch(`/api/requests/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      refetch();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Hapus request?')) return;
    try {
      await fetch(`/api/requests/${id}`, { method: 'DELETE' });
      refetch();
    } catch (err) {
      console.error(err);
    }
  };

  const handlePlayNow = async (item: RequestItem) => {
    try {
      const currentPlaying = requests.find((r) => r.status === 'PLAYING');
      if (currentPlaying && currentPlaying.id !== item.id) {
        await fetch(`/api/requests/${currentPlaying.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: 'COMPLETED' }),
        });
      }

      await fetch(`/api/requests/${item.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'PLAYING' }),
      });
      refetch();
    } catch (err) {
      console.error(err);
    }
  };

  const handleToggleFastTrack = async (id: string, current: boolean) => {
    try {
      await fetch(`/api/requests/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isFastTrack: !current }),
      });
      refetch();
    } catch (err) {
      console.error(err);
    }
  };

  const handleSongEnded = async (song: RequestItem) => {
    try {
      await fetch(`/api/requests/${song.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'COMPLETED' }),
      });

      const nextSong = requests.find(
        (r) => r.id !== song.id && r.status === 'PENDING' && r.requestType === 'LAGU'
      );

      if (nextSong) {
        await fetch(`/api/requests/${nextSong.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: 'PLAYING' }),
        });
      }
      refetch();
    } catch (err) {
      console.error(err);
    }
  };

  const handleSkipNext = async () => {
    if (currentSong) {
      await handleSongEnded(currentSong);
    }
  };

  const handleSavePin = () => {
    setPinSaved(true);
    setTimeout(() => {
      setPinSaved(false);
      setIsPinSettingsOpen(false);
    }, 1500);
  };

  // Manual Reorder handlers (Drag & Drop + Move Up/Down)
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [dragOverId, setDragOverId] = useState<string | null>(null);

  const handleReorder = async (orderedIds: string[]) => {
    try {
      await fetch('/api/requests/reorder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderedIds }),
      });
      refetch();
    } catch (err) {
      console.error('Failed to reorder:', err);
    }
  };

  const handleMoveItem = async (list: RequestItem[], index: number, direction: 'UP' | 'DOWN') => {
    const targetIndex = direction === 'UP' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= list.length) return;

    const reordered = [...list];
    const [moved] = reordered.splice(index, 1);
    reordered.splice(targetIndex, 0, moved);

    await handleReorder(reordered.map((r) => r.id));
  };

  const handleDragStart = (e: React.DragEvent<HTMLDivElement>, id: string) => {
    e.dataTransfer.setData('text/plain', id);
    e.dataTransfer.effectAllowed = 'move';
    setDraggedId(id);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>, id: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverId !== id) {
      setDragOverId(id);
    }
  };

  const handleDragEnd = () => {
    setDraggedId(null);
    setDragOverId(null);
  };

  const handleDrop = async (e: React.DragEvent<HTMLDivElement>, targetId: string, list: RequestItem[]) => {
    e.preventDefault();
    const sourceId = e.dataTransfer.getData('text/plain') || draggedId;
    setDraggedId(null);
    setDragOverId(null);

    if (!sourceId || sourceId === targetId) return;

    const sourceIndex = list.findIndex((r) => r.id === sourceId);
    const targetIndex = list.findIndex((r) => r.id === targetId);
    if (sourceIndex === -1 || targetIndex === -1) return;

    const reordered = [...list];
    const [moved] = reordered.splice(sourceIndex, 1);
    reordered.splice(targetIndex, 0, moved);

    await handleReorder(reordered.map((r) => r.id));
  };

  return (
    <div className="min-h-screen bg-[#FFFDF5] text-[#121212] flex flex-col pb-20">
      <Navbar isConnected={isConnected} />

      <main className="flex-1 max-w-xl w-full mx-auto p-3 sm:p-4 space-y-3">
        {/* Top Header */}
        <div className="neo-box bg-[#FFE600] p-2.5 flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] font-black uppercase tracking-wider bg-black text-white px-1.5 py-0.2">
              HOST
            </span>
            <span className="font-black text-xs uppercase text-black">
              Dasbor Hotaru Live
            </span>
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
            {/* Song Queue Action Header */}
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
                  <span>FT ({fastTrackSongCount})</span>
                </button>
              </div>
            </div>

            {/* Song Queue Cards */}
            <div className="space-y-2.5">
              {isLoading ? (
                <div className="neo-box p-8 text-center bg-white text-xs font-black">
                  Memuat antrean lagu...
                </div>
              ) : displayedSongs.length === 0 ? (
                <div className="neo-box p-8 text-center bg-white space-y-2 border-[2px] border-black">
                  <p className="text-xs font-bold text-gray-500">
                    {songFilter === 'FAST_TRACK'
                      ? 'Tidak ada lagu Fast Track saat ini.'
                      : 'Antrean lagu kosong saat ini.'}
                  </p>
                </div>
              ) : (
                displayedSongs.map((item, index) => (
                  <QueueCard
                    key={item.id}
                    item={item}
                    index={index}
                    isAdmin={true}
                    onMarkDone={handleMarkDone}
                    onDelete={handleDelete}
                    onToggleFastTrack={handleToggleFastTrack}
                    canMoveUp={index > 0}
                    canMoveDown={index < displayedSongs.length - 1}
                    onMoveUp={() => handleMoveItem(displayedSongs, index, 'UP')}
                    onMoveDown={() => handleMoveItem(displayedSongs, index, 'DOWN')}
                    draggable={true}
                    onDragStart={handleDragStart}
                    onDragOver={handleDragOver}
                    onDragEnd={handleDragEnd}
                    onDrop={(e, targetId) => handleDrop(e, targetId, displayedSongs)}
                    isDragging={draggedId === item.id}
                    isDragOver={dragOverId === item.id}
                  />
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
                {pendingFansigns.length} Aktif
              </span>
            </div>

            <div className="space-y-2.5">
              {isLoading ? (
                <div className="neo-box p-8 text-center bg-white text-xs font-black">
                  Memuat fansign...
                </div>
              ) : pendingFansigns.length === 0 ? (
                <div className="neo-box p-8 text-center bg-white border-[2px] border-black text-xs font-bold text-gray-500">
                  Belum ada request Fansign yang aktif.
                </div>
              ) : (
                pendingFansigns.map((item, index) => (
                  <QueueCard
                    key={item.id}
                    item={item}
                    index={index}
                    isAdmin={true}
                    onMarkDone={handleMarkDone}
                    onDelete={handleDelete}
                  />
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
                {pendingPaps.length} Aktif
              </span>
            </div>

            <div className="space-y-2.5">
              {isLoading ? (
                <div className="neo-box p-8 text-center bg-white text-xs font-black">
                  Memuat request PAP...
                </div>
              ) : pendingPaps.length === 0 ? (
                <div className="neo-box p-8 text-center bg-white border-[2px] border-black text-xs font-bold text-gray-500">
                  Belum ada request PAP yang aktif.
                </div>
              ) : (
                pendingPaps.map((item, index) => (
                  <QueueCard
                    key={item.id}
                    item={item}
                    index={index}
                    isAdmin={true}
                    onMarkDone={handleMarkDone}
                    onDelete={handleDelete}
                  />
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
                {pendingCosplays.length} Aktif
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
                <div className="neo-box p-8 text-center bg-white text-xs font-black">
                  Memuat request cosplay...
                </div>
              ) : displayedCosplays.length === 0 ? (
                <div className="neo-box p-8 text-center bg-white border-[2px] border-black text-xs font-bold text-gray-500">
                  Belum ada request Cosplay di bagian ini.
                </div>
              ) : (
                displayedCosplays.map((item, index) => (
                  <QueueCard
                    key={item.id}
                    item={item}
                    index={index}
                    isAdmin={true}
                    onMarkDone={handleMarkDone}
                    onDelete={handleDelete}
                  />
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

            {/* Sub filter by Type */}
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
                <div className="neo-box p-8 text-center bg-white text-xs font-black">
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
                        <QueueCard
                          key={item.id}
                          item={item}
                          index={index}
                          isAdmin={true}
                          onMarkDone={handleMarkDone}
                          onDelete={handleDelete}
                        />
                      ))}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* FLOATING ACTION BUTTON (+ Request) */}
        <FloatingActionButton
          onClick={() => setIsAddModalOpen(true)}
          label="Request"
        />

        {/* Modal Request Form */}
        <RequestModal
          isOpen={isAddModalOpen}
          onClose={() => setIsAddModalOpen(false)}
          onSuccess={() => refetch()}
          addedByRole="HOST"
        />
      </main>
    </div>
  );
}
