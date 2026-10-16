'use client';

import { useState, useEffect } from 'react';
import { useRealtimeQueue } from '@/hooks/useRealtimeQueue';
import { Navbar } from '@/components/Navbar';
import { QueueCard } from '@/components/QueueCard';
import { RequestModal } from '@/components/RequestModal';
import { RequestNavigation, RequestMenuTab } from '@/components/RequestNavigation';
import { FloatingActionButton } from '@/components/FloatingActionButton';
import { RequestItem } from '@/types';
import {
  Shield,
  Lock,
  Unlock,
  LogOut,
  Plus,
  Music,
  FileText,
  Camera,
  Sparkles,
  History,
  Zap,
  Calendar,
} from 'lucide-react';
import { isToday, groupRequestsByDate } from '@/lib/dateUtils';

export default function ModeratorPage() {
  const { requests, isConnected, isLoading, refetch } = useRealtimeQueue();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [pinInput, setPinInput] = useState<string>('');
  const [pinError, setPinError] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState<boolean>(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<RequestMenuTab>('SONGS');
  const [songFilter, setSongFilter] = useState<'ALL' | 'FAST_TRACK'>('ALL');
  const [cosplayFilter, setCosplayFilter] = useState<string>('ALL');
  const [historyFilter, setHistoryFilter] = useState<string>('ALL');
  const [historyDateFilter, setHistoryDateFilter] = useState<'TODAY' | 'ALL'>('TODAY');

  // Categorize requests into separate menu datasets
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

  useEffect(() => {
    const saved = sessionStorage.getItem('mod_auth_token');
    if (saved === 'authorized') {
      setIsAuthenticated(true);
    }
  }, []);

  const handleVerifyPin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pinInput.trim()) return;

    setIsVerifying(true);
    setPinError(null);

    try {
      const res = await fetch('/api/auth/verify-pin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin: pinInput.trim() }),
      });

      const data = await res.json();
      if (res.ok && data.authorized) {
        setIsAuthenticated(true);
        sessionStorage.setItem('mod_auth_token', 'authorized');
        setPinInput('');
      } else {
        setPinError(data.error || 'PIN Moderator salah');
      }
    } catch {
      setPinError('Gagal memverifikasi');
    } finally {
      setIsVerifying(false);
    }
  };

  const handleLogout = () => {
    sessionStorage.removeItem('mod_auth_token');
    setIsAuthenticated(false);
  };

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
        {!isAuthenticated ? (
          /* PIN Gate */
          <div className="pt-8">
            <div className="neo-box bg-white p-5 space-y-4">
              <div className="text-center space-y-1">
                <div className="w-12 h-12 bg-[#FFE600] border-[2px] border-black p-2.5 mx-auto shadow-[3px_3px_0_0_#000] flex items-center justify-center">
                  <Lock className="w-6 h-6 text-black" />
                </div>
                <h2 className="text-lg font-black uppercase text-black">
                  PIN Akses Moderator
                </h2>
                <p className="text-xs text-gray-600">
                  Masukkan PIN dari Host untuk mengelola antrean Hotaru Live.
                </p>
              </div>

              <form onSubmit={handleVerifyPin} className="space-y-3">
                <input
                  type="password"
                  maxLength={10}
                  value={pinInput}
                  onChange={(e) => setPinInput(e.target.value)}
                  placeholder="PIN (Default: 8888)"
                  className="neo-input text-center text-lg tracking-widest font-mono font-black py-2"
                  autoFocus
                  required
                />

                {pinError && (
                  <div className="p-2 bg-red-100 border border-red-600 text-xs font-black text-red-700 text-center">
                    {pinError}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isVerifying}
                  className="w-full neo-btn bg-[#FFE600] text-black py-2.5 text-xs uppercase font-black shadow-[2.5px_2.5px_0_0_#000]"
                >
                  <Unlock className="w-4 h-4" />
                  <span>{isVerifying ? 'Memeriksa...' : 'Buka Dasbor'}</span>
                </button>
              </form>
            </div>
          </div>
        ) : (
          /* Authenticated Mod Workspace */
          <div className="space-y-3">
            {/* Top Bar */}
            <div className="neo-box bg-[#00F0FF] p-2.5 flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Shield className="w-4 h-4 text-black" />
                <span className="font-black text-xs uppercase text-black">
                  Mode Moderator
                </span>
              </div>
              <button
                onClick={handleLogout}
                className="neo-btn bg-white text-black px-2 py-0.5 text-[11px] font-black uppercase flex items-center gap-1"
              >
                <LogOut className="w-3 h-3" />
                <span>Kunci</span>
              </button>
            </div>

            {/* SEPARATE MENUS: Desktop Segmented Tabs + Mobile Sidebar Drawer */}
            <RequestNavigation
              activeTab={activeTab}
              onTabChange={setActiveTab}
              counts={counts}
              fastTrackCount={fastTrackSongCount}
            />

            {/* TAB 1: ANTREAN LAGU */}
            {activeTab === 'SONGS' && (
              <div className="space-y-3">
                {/* Header Banner & Sub-filter */}
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <span className="h-7 px-2.5 bg-[#FFE600] border border-black shadow-[1.5px_1.5px_0_0_#000] text-xs font-black uppercase inline-flex items-center gap-1">
                    <Music className="w-3.5 h-3.5" />
                    <span>Antrean Lagu Hari Ini ({pendingSongs.length})</span>
                  </span>

                  <div className="flex items-center gap-1 text-xs font-black">
                    <button
                      type="button"
                      onClick={() => setSongFilter('ALL')}
                      className={`px-2 py-1 border border-black uppercase text-[11px] font-black ${
                        songFilter === 'ALL'
                          ? 'bg-black text-white shadow-[1px_1px_0_0_#FFE600]'
                          : 'bg-white text-gray-800'
                      }`}
                    >
                      Semua ({pendingSongs.length})
                    </button>
                    <button
                      type="button"
                      onClick={() => setSongFilter('FAST_TRACK')}
                      className={`px-2 py-1 border border-black uppercase text-[11px] font-black flex items-center gap-1 ${
                        songFilter === 'FAST_TRACK'
                          ? 'bg-red-600 text-white shadow-[1px_1px_0_0_#000]'
                          : 'bg-white text-red-600'
                      }`}
                    >
                      <Zap className="w-3 h-3 fill-current" />
                      <span>FT ({fastTrackSongCount})</span>
                    </button>
                  </div>
                </div>

                {/* Song Cards List */}
                <div className="space-y-2.5">
                  {isLoading ? (
                    <div className="neo-box p-8 text-center bg-white text-xs font-black uppercase">
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

                {/* Sub filter Game / Anime */}
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
                      Belum ada request Cosplay di kategori ini.
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

            {/* TAB 5: HISTORY (REQUEST SELESAI) */}
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

            {/* Modal Tambah Request */}
            <RequestModal
              isOpen={isAddModalOpen}
              onClose={() => setIsAddModalOpen(false)}
              onSuccess={() => refetch()}
              addedByRole="MODERATOR"
            />
          </div>
        )}
      </main>
    </div>
  );
}

