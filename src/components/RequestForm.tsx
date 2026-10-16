'use client';

import { useState, useEffect, useRef } from 'react';
import { RequestType, CosplaySubType, YouTubeSearchResult, Viewer } from '@/types';
import { Plus, Zap, Loader2, Search, Check, RefreshCw, Music, ExternalLink, Play, User, UserPlus } from 'lucide-react';

interface RequestFormProps {
  onSuccess?: () => void;
  addedByRole?: 'HOST' | 'MODERATOR';
  inModal?: boolean;
}

export function RequestForm({
  onSuccess,
  addedByRole = 'HOST',
  inModal = false,
}: RequestFormProps) {
  const [viewerName, setViewerName] = useState('');
  const [requestType, setRequestType] = useState<RequestType>('LAGU');
  const [cosplaySubType, setCosplaySubType] = useState<CosplaySubType>('ANIME');
  const [details, setDetails] = useState('');
  const [isFastTrack, setIsFastTrack] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ text: string; error?: boolean } | null>(null);

  // Viewer Database Live Search State
  const [allViewers, setAllViewers] = useState<Viewer[]>([]);
  const [viewerSuggestions, setViewerSuggestions] = useState<Viewer[]>([]);
  const [isSearchingViewer, setIsSearchingViewer] = useState(false);
  const [isViewerDropdownOpen, setIsViewerDropdownOpen] = useState(false);
  const [matchedViewer, setMatchedViewer] = useState<Viewer | null>(null);
  const [newViewerNotice, setNewViewerNotice] = useState<string | null>(null);
  const viewerWrapperRef = useRef<HTMLDivElement>(null);

  // Live Search & Preview State
  const [searchResults, setSearchResults] = useState<YouTubeSearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedVideo, setSelectedVideo] = useState<YouTubeSearchResult | null>(null);
  const [hasSearched, setHasSearched] = useState(false);
  const [previewPlayerVideoId, setPreviewPlayerVideoId] = useState<string | null>(null);

  // Preload initial database viewers on mount
  useEffect(() => {
    fetch('/api/viewers')
      .then((res) => res.json())
      .then((data) => {
        if (data.viewers) {
          setAllViewers(data.viewers);
          setViewerSuggestions(data.viewers.slice(0, 6));
        }
      })
      .catch((err) => console.error('Failed to preload viewers:', err));
  }, []);

  // Click-outside listener without any blocking backdrop
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (viewerWrapperRef.current && !viewerWrapperRef.current.contains(e.target as Node)) {
        setIsViewerDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Instant reactive live search on every keystroke
  useEffect(() => {
    const q = viewerName.trim().toLowerCase();
    if (!q) {
      setViewerSuggestions(allViewers.slice(0, 6));
      setMatchedViewer(null);
      return;
    }

    // 1. Instant client-side search across preloaded viewers (0ms)
    const filtered = allViewers.filter((v) => v.name.toLowerCase().includes(q));
    setViewerSuggestions(filtered);

    const exactMatch = allViewers.find((v) => v.name.toLowerCase() === q);
    setMatchedViewer(exactMatch || null);

    // 2. Fetch server database for any recently added viewers
    setIsSearchingViewer(true);
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/viewers?q=${encodeURIComponent(viewerName.trim())}`);
        if (res.ok) {
          const data = await res.json();
          if (data.viewers) {
            setViewerSuggestions(data.viewers);
            const serverExact = data.viewers.find((v: Viewer) => v.name.toLowerCase() === q);
            if (serverExact) setMatchedViewer(serverExact);
          }
        }
      } catch (err) {
        console.error('Failed to search viewers:', err);
      } finally {
        setIsSearchingViewer(false);
      }
    }, 150);

    return () => clearTimeout(timer);
  }, [viewerName, allViewers]);

  // Select existing viewer from suggestions
  const handleSelectViewer = (viewer: Viewer) => {
    setViewerName(viewer.name);
    setMatchedViewer(viewer);
    setIsViewerDropdownOpen(false);
    setNewViewerNotice(null);
  };

  // Explicitly add new viewer to database
  const handleAddNewViewer = async (nameToAdd: string) => {
    const clean = nameToAdd.trim();
    if (!clean) return;

    try {
      const res = await fetch('/api/viewers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: clean }),
      });

      if (res.ok) {
        const data = await res.json();
        const savedViewer: Viewer = data.viewer;
        setMatchedViewer(savedViewer);
        setViewerName(savedViewer.name);
        setAllViewers((prev) => [savedViewer, ...prev.filter((v) => v.id !== savedViewer.id)]);
        setIsViewerDropdownOpen(false);
        setNewViewerNotice(`✓ "${savedViewer.name}" tersimpan di database`);
        setTimeout(() => setNewViewerNotice(null), 3000);
      }
    } catch (err) {
      console.error('Failed to add new viewer:', err);
    }
  };

  // YouTube Live Search Handler
  const handleSearchYouTube = async (searchQuery?: string) => {
    const q = (searchQuery ?? details).trim();
    if (!q || q.length < 2) return;

    setIsSearching(true);
    setHasSearched(true);

    try {
      const res = await fetch(`/api/youtube/search?q=${encodeURIComponent(q)}`);
      if (res.ok) {
        const data = await res.json();
        const list: YouTubeSearchResult[] = data.results || [];
        setSearchResults(list);

        // If direct link / ID was entered and returned 1 match, auto-select it
        if (list.length === 1 && (q.includes('youtu') || q.length === 11)) {
          setSelectedVideo(list[0]);
          setDetails(list[0].title);
          setSearchResults([]);
        }
      }
    } catch (err) {
      console.error('Failed to search YouTube:', err);
    } finally {
      setIsSearching(false);
    }
  };

  // Automatic debounced live search when user pauses typing
  useEffect(() => {
    if (requestType !== 'LAGU') {
      setSearchResults([]);
      setSelectedVideo(null);
      return;
    }

    const query = details.trim();
    if (!query || query.length < 3) {
      setSearchResults([]);
      return;
    }

    // Don't re-search if user already selected a video with this title
    if (selectedVideo && (query === selectedVideo.title || query.includes(selectedVideo.videoId))) {
      return;
    }

    const timer = setTimeout(() => {
      handleSearchYouTube(query);
    }, 600);

    return () => clearTimeout(timer);
  }, [details, requestType, selectedVideo]);

  const handleSelectCandidate = (video: YouTubeSearchResult) => {
    setSelectedVideo(video);
    setDetails(video.title);
    setSearchResults([]);
    setPreviewPlayerVideoId(null);
  };

  const handleClearSelected = () => {
    setSelectedVideo(null);
    setPreviewPlayerVideoId(null);
    if (details.trim().length >= 2) {
      handleSearchYouTube(details);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!viewerName.trim()) {
      setStatusMessage({ text: 'Nama penonton wajib diisi', error: true });
      return;
    }

    if (requestType === 'LAGU' && !details.trim()) {
      setStatusMessage({ text: 'Judul lagu wajib diisi untuk request lagu', error: true });
      return;
    }

    let finalDetails = details.trim();
    if (requestType === 'PAP') {
      finalDetails = 'PAP';
    } else if (requestType === 'FANSIGN') {
      finalDetails = finalDetails || viewerName.trim() || 'Fansign';
    } else if (requestType === 'COSPLAY') {
      finalDetails = finalDetails || (cosplaySubType ? `Cosplay ${cosplaySubType}` : 'Request Cosplay');
    }

    setIsSubmitting(true);
    setStatusMessage(null);

    try {
      const res = await fetch('/api/requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          viewerName: viewerName.trim(),
          requestType,
          cosplaySubType: requestType === 'COSPLAY' ? cosplaySubType : null,
          details: finalDetails,
          youtubeVideoId: selectedVideo?.videoId || null,
          youtubeTitle: selectedVideo?.title || null,
          isFastTrack: requestType === 'LAGU' ? Boolean(isFastTrack) : false,
          source: 'MANUAL',
          addedBy: addedByRole,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Gagal menambahkan request');
      }

      // Update local viewers cache so the viewer's count is immediately updated
      const cleanViewer = viewerName.trim();
      setAllViewers((prev) => {
        const found = prev.find((v) => v.name.toLowerCase() === cleanViewer.toLowerCase());
        if (found) {
          return prev.map((v) => (v.id === found.id ? { ...v, totalRequests: (v.totalRequests || 0) + 1 } : v));
        }
        return [
          {
            id: `v_${Date.now()}`,
            name: cleanViewer,
            totalRequests: 1,
            createdAt: new Date().toISOString(),
            lastSeenAt: new Date().toISOString(),
          },
          ...prev,
        ];
      });

      // Reset Form
      setViewerName('');
      setMatchedViewer(null);
      setViewerSuggestions([]);
      setIsViewerDropdownOpen(false);
      setNewViewerNotice(null);
      setRequestType('LAGU');
      setDetails('');
      setSelectedVideo(null);
      setSearchResults([]);
      setHasSearched(false);
      setIsFastTrack(false);
      setStatusMessage({ text: '✓ Request berhasil ditambahkan!', error: false });

      if (onSuccess) onSuccess();
      setTimeout(() => setStatusMessage(null), 2500);
    } catch (err: any) {
      setStatusMessage({ text: err.message, error: true });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={inModal ? 'space-y-3' : 'neo-box p-4 bg-white'}>
      {!inModal && (
        <h3 className="font-black text-sm uppercase text-black mb-3 flex items-center gap-1.5 border-b-2 border-black pb-2">
          <Plus className="w-4 h-4 text-black" />
          Tambah Request Baru
        </h3>
      )}

      <form onSubmit={handleSubmit} className="space-y-3">
        {/* Nama Penonton dengan Live Autocomplete Database */}
        <div ref={viewerWrapperRef} className="relative">
          <div className="flex items-center justify-between mb-1">
            <label className="block text-[11px] font-black uppercase text-gray-700">
              Nama Penonton *
            </label>
            {matchedViewer && (
              <span className="text-[10px] font-bold text-green-700 bg-green-50 border border-green-600 px-1.5 py-0.2 flex items-center gap-1">
                <Check className="w-2.5 h-2.5 stroke-[3]" />
                Penonton Terdaftar ({matchedViewer.totalRequests || 0} req)
              </span>
            )}
            {newViewerNotice && (
              <span className="text-[10px] font-bold text-blue-700 bg-blue-50 border border-blue-600 px-1.5 py-0.2">
                {newViewerNotice}
              </span>
            )}
          </div>

          <div className="relative">
            <input
              type="text"
              value={viewerName}
              onChange={(e) => {
                setViewerName(e.target.value);
                setIsViewerDropdownOpen(true);
              }}
              onFocus={() => {
                setIsViewerDropdownOpen(true);
                if (!viewerName.trim()) {
                  setViewerSuggestions(allViewers.slice(0, 6));
                }
              }}
              placeholder="Ketik username / nama penonton..."
              className="neo-input text-xs py-2 pr-8"
              required
              autoComplete="off"
            />
            {isSearchingViewer && (
              <div className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none">
                <Loader2 className="w-3.5 h-3.5 animate-spin text-gray-500" />
              </div>
            )}
          </div>

          {/* Viewer Suggestions Dropdown (NO blocking backdrop) */}
          {isViewerDropdownOpen && (
            <div className="absolute left-0 right-0 top-full mt-1 bg-white border-[2px] border-black shadow-[3px_3px_0_0_#000] z-50 max-h-52 overflow-y-auto divide-y divide-black animate-in fade-in duration-100">
              {/* Existing viewer matches */}
              {viewerSuggestions.length > 0 && (
                <div>
                  <div className="bg-[#FFE600] px-2 py-1 text-[10px] font-black uppercase flex items-center justify-between border-b border-black">
                    <span className="flex items-center gap-1 text-black font-black">
                      <User className="w-3 h-3" />
                      {viewerName.trim() ? `Hasil Pencarian Database (${viewerSuggestions.length}):` : 'Penonton Terdaftar di Database:'}
                    </span>
                    <button
                      type="button"
                      onMouseDown={(e) => {
                        e.preventDefault();
                        setIsViewerDropdownOpen(false);
                      }}
                      className="text-black hover:bg-black hover:text-white px-1 font-black text-xs cursor-pointer"
                    >
                      ✕
                    </button>
                  </div>
                  {viewerSuggestions.map((viewer) => {
                    const isExactMatch = viewer.name.toLowerCase() === viewerName.trim().toLowerCase();
                    return (
                      <div
                        key={viewer.id}
                        onMouseDown={(e) => {
                          e.preventDefault();
                          handleSelectViewer(viewer);
                        }}
                        className={`px-2.5 py-1.5 flex items-center justify-between hover:bg-yellow-50 cursor-pointer text-xs transition-colors ${
                          isExactMatch ? 'bg-green-50' : ''
                        }`}
                      >
                        <div className="flex items-center gap-1.5">
                          <span className="font-black text-black">{viewer.name}</span>
                          {isExactMatch && (
                            <span className="text-[9px] font-bold bg-green-100 text-green-800 px-1 border border-green-700">
                              Cocok
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] font-mono font-bold text-gray-500 bg-gray-100 px-1.5 py-0.2 border border-gray-300">
                          {viewer.totalRequests || 0} req
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* If typed name does not match any existing viewer, allow adding as new */}
              {viewerName.trim().length > 0 && !matchedViewer && (
                <div
                  onMouseDown={(e) => {
                    e.preventDefault();
                    handleAddNewViewer(viewerName);
                  }}
                  className="p-2.5 bg-green-50 hover:bg-green-100 cursor-pointer flex items-center gap-2 transition-colors border-t border-black text-xs"
                >
                  <UserPlus className="w-4 h-4 text-green-700 shrink-0" />
                  <span className="font-black text-green-900 truncate">
                    + Tambah &quot;{viewerName.trim()}&quot; sebagai Penonton Baru
                  </span>
                </div>
              )}

              {viewerSuggestions.length === 0 && !viewerName.trim() && (
                <div className="p-3 text-center text-xs font-bold text-gray-500">
                  Belum ada penonton terdaftar di database.
                </div>
              )}
            </div>
          )}
        </div>

        {/* Tipe Request Dropdown */}
        <div>
          <label className="block text-[11px] font-black uppercase text-gray-700 mb-1">
            Tipe Request *
          </label>
          <div className="relative">
            <select
              value={requestType}
              onChange={(e) => {
                const newType = e.target.value as RequestType;
                setRequestType(newType);
                if (newType !== 'LAGU') {
                  setIsFastTrack(false);
                  setSelectedVideo(null);
                  setSearchResults([]);
                }
              }}
              className="neo-input text-xs py-2 font-black uppercase appearance-none bg-white cursor-pointer pr-8"
            >
              <option value="LAGU">🎵 Lagu</option>
              <option value="FANSIGN">✍️ Fansign</option>
              <option value="PAP">📸 PAP</option>
              <option value="COSPLAY">🎭 Cosplay</option>
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2.5 text-black font-black text-xs">
              ▼
            </div>
          </div>
        </div>

        {/* Cosplay Subtype (Jika Tipe Cosplay) */}
        {requestType === 'COSPLAY' && (
          <div className="flex gap-1.5 p-1.5 bg-orange-50 border-[1.5px] border-black">
            <button
              type="button"
              onClick={() => setCosplaySubType('ANIME')}
              className={`flex-1 py-1 text-xs font-black uppercase border border-black ${
                cosplaySubType === 'ANIME' ? 'bg-[#FF7A00] text-white' : 'bg-white'
              }`}
            >
              Anime
            </button>
            <button
              type="button"
              onClick={() => setCosplaySubType('GAME')}
              className={`flex-1 py-1 text-xs font-black uppercase border border-black ${
                cosplaySubType === 'GAME' ? 'bg-[#FF7A00] text-white' : 'bg-white'
              }`}
            >
              Game
            </button>
          </div>
        )}

        {/* PAP: Tidak perlu detail request */}
        {requestType === 'PAP' && (
          <div className="p-3 bg-pink-50 border-[2px] border-black shadow-[2px_2px_0_0_#000] text-xs font-bold text-pink-900 flex items-center gap-2">
            <span className="text-base shrink-0">📸</span>
            <span>Request PAP (Pose Foto Hotaru Live) otomatis tercatat langsung tanpa perlu mengisi detail.</span>
          </div>
        )}

        {/* LAGU, FANSIGN, & COSPLAY: Input Detail / Nama / Karakter */}
        {requestType !== 'PAP' && (
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-[11px] font-black uppercase text-gray-700">
                {requestType === 'LAGU' && (
                  <>
                    Judul Lagu / Link YouTube <span className="text-red-500">*</span>
                  </>
                )}
                {requestType === 'FANSIGN' && (
                  <>
                    Nama <span className="text-[10px] font-normal text-gray-500 lowercase">(opsional)</span>
                  </>
                )}
                {requestType === 'COSPLAY' && (
                  <>
                    Nama Karakter <span className="text-[10px] font-normal text-gray-500 lowercase">(opsional)</span>
                  </>
                )}
              </label>
              {requestType === 'LAGU' && isSearching && (
                <span className="text-[10px] font-bold text-gray-500 flex items-center gap-1">
                  <Loader2 className="w-3 h-3 animate-spin text-black" />
                  Mencari di YouTube...
                </span>
              )}
            </div>

            <div className="flex gap-1.5">
              <input
                type="text"
                value={details}
                onChange={(e) => {
                  setDetails(e.target.value);
                  if (selectedVideo && e.target.value !== selectedVideo.title) {
                    setSelectedVideo(null);
                  }
                }}
                placeholder={
                  requestType === 'LAGU'
                    ? 'Ketik judul lagu atau paste link YouTube...'
                    : requestType === 'FANSIGN'
                    ? 'Nama untuk ditulis di fansign (kosongkan jika pakai nama penonton)...'
                    : 'Misal: Raiden Shogun, Anya Forger, dll. (opsional)...'
                }
                className="neo-input text-xs py-2 flex-1"
                required={requestType === 'LAGU'}
              />
              {requestType === 'LAGU' && (
                <button
                  type="button"
                  onClick={() => handleSearchYouTube(details)}
                  disabled={isSearching || !details.trim()}
                  className="neo-btn bg-[#00F0FF] text-black px-3 py-2 text-xs font-black uppercase shrink-0"
                  title="Cari video di YouTube"
                >
                  {isSearching ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Search className="w-3.5 h-3.5" />
                  )}
                </button>
              )}
            </div>
          </div>
        )}

        {/* Selected Video Preview Card */}
        {requestType === 'LAGU' && selectedVideo && (
          <div className="border-[2px] border-black bg-yellow-50 p-2.5 shadow-[2px_2px_0_0_#000] space-y-2">
            <div className="flex items-center gap-2.5">
              {/* Thumbnail with Click-to-Preview */}
              <div
                onClick={() =>
                  setPreviewPlayerVideoId((prev) =>
                    prev === selectedVideo.videoId ? null : selectedVideo.videoId
                  )
                }
                className="relative w-24 aspect-video bg-black border border-black shrink-0 overflow-hidden cursor-pointer group"
                title="Klik untuk putar cuplikan"
              >
                <img
                  src={selectedVideo.thumbnail}
                  alt={selectedVideo.title}
                  className="w-full h-full object-cover group-hover:opacity-85 transition-opacity"
                />
                <div className="absolute inset-0 flex items-center justify-center bg-black/20 group-hover:bg-black/40 transition-colors">
                  <Play className="w-5 h-5 text-white fill-current drop-shadow" />
                </div>
                {selectedVideo.duration && (
                  <span className="absolute bottom-0.5 right-0.5 bg-black/80 text-white text-[9px] font-mono px-1 font-bold">
                    {selectedVideo.duration}
                  </span>
                )}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1 text-[10px] font-black text-green-700">
                  <Check className="w-3 h-3 text-green-600 stroke-[3]" />
                  <span>Video Terverifikasi</span>
                </div>
                <h4 className="font-black text-xs text-black truncate leading-tight mt-0.5">
                  {selectedVideo.title}
                </h4>
                <span className="text-[10px] font-bold text-gray-600 truncate block">
                  {selectedVideo.channelTitle || 'YouTube'}
                </span>
              </div>

              {/* Action buttons */}
              <div className="flex items-center gap-1 shrink-0">
                <button
                  type="button"
                  onClick={() =>
                    setPreviewPlayerVideoId((prev) =>
                      prev === selectedVideo.videoId ? null : selectedVideo.videoId
                    )
                  }
                  className={`neo-btn p-1.5 text-xs ${
                    previewPlayerVideoId === selectedVideo.videoId
                      ? 'bg-black text-[#FFE600]'
                      : 'bg-[#FFE600] text-black'
                  }`}
                  title={previewPlayerVideoId === selectedVideo.videoId ? 'Tutup Preview' : 'Putar Cuplikan'}
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                </button>
                <button
                  type="button"
                  onClick={handleClearSelected}
                  className="neo-btn bg-white text-gray-700 hover:text-black p-1.5 text-xs"
                  title="Ganti Video"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                </button>
                <a
                  href={`https://www.youtube.com/watch?v=${selectedVideo.videoId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="neo-btn bg-white text-gray-700 hover:text-black p-1.5 text-xs"
                  title="Buka di tab baru"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>

            {/* Embedded Inline Preview Player if toggled */}
            {previewPlayerVideoId === selectedVideo.videoId && (
              <div className="border border-black overflow-hidden bg-black mt-2">
                <div className="flex items-center justify-between bg-black text-white px-2 py-1 text-[10px] font-black uppercase">
                  <span className="flex items-center gap-1 text-[#FFE600]">
                    <Play className="w-2.5 h-2.5 fill-current" />
                    Preview Lagu (YouTube)
                  </span>
                  <button
                    type="button"
                    onClick={() => setPreviewPlayerVideoId(null)}
                    className="text-red-400 hover:text-white font-bold"
                  >
                    ✕ Tutup Preview
                  </button>
                </div>
                <div className="aspect-video w-full">
                  <iframe
                    src={`https://www.youtube-nocookie.com/embed/${selectedVideo.videoId}?autoplay=1&playsinline=1`}
                    title={selectedVideo.title}
                    className="w-full h-full border-0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                </div>
              </div>
            )}
          </div>
        )}

        {/* Live Search Candidate Results List */}
        {requestType === 'LAGU' && !selectedVideo && searchResults.length > 0 && (
          <div className="border-[2px] border-black bg-white max-h-64 overflow-y-auto divide-y-2 divide-black shadow-[2px_2px_0_0_#000]">
            <div className="bg-[#FFE600] px-2.5 py-1 text-[10px] font-black uppercase flex items-center justify-between border-b-2 border-black sticky top-0 z-10">
              <span className="flex items-center gap-1">
                <Music className="w-3 h-3" />
                Pilih Hasil Pencarian YouTube:
              </span>
              <button
                type="button"
                onClick={() => {
                  setSearchResults([]);
                  setPreviewPlayerVideoId(null);
                }}
                className="text-black font-black hover:underline"
              >
                ✕ Tutup
              </button>
            </div>

            {/* Candidate embedded preview if playing */}
            {previewPlayerVideoId && searchResults.some((r) => r.videoId === previewPlayerVideoId) && (
              <div className="bg-black text-white p-2 border-b-2 border-black">
                <div className="flex items-center justify-between text-[10px] font-black uppercase mb-1">
                  <span className="text-[#FFE600] flex items-center gap-1">
                    <Play className="w-2.5 h-2.5 fill-current" />
                    Preview Cuplikan
                  </span>
                  <button
                    type="button"
                    onClick={() => setPreviewPlayerVideoId(null)}
                    className="text-red-400 hover:text-white"
                  >
                    ✕ Tutup
                  </button>
                </div>
                <div className="aspect-video w-full bg-black border border-zinc-700">
                  <iframe
                    src={`https://www.youtube-nocookie.com/embed/${previewPlayerVideoId}?autoplay=1&playsinline=1`}
                    title="Preview"
                    className="w-full h-full border-0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                </div>
              </div>
            )}

            {searchResults.map((video) => (
              <div
                key={video.videoId}
                className="p-2 flex items-center gap-2 hover:bg-yellow-50 transition-colors"
              >
                {/* Thumbnail with preview trigger */}
                <div
                  onClick={() =>
                    setPreviewPlayerVideoId((prev) =>
                      prev === video.videoId ? null : video.videoId
                    )
                  }
                  className="relative w-20 aspect-video bg-black border border-black shrink-0 overflow-hidden cursor-pointer group"
                  title="Klik untuk dengarkan preview"
                >
                  <img
                    src={video.thumbnail}
                    alt={video.title}
                    className="w-full h-full object-cover group-hover:opacity-85"
                  />
                  <div className="absolute inset-0 flex items-center justify-center bg-black/25 group-hover:bg-black/40">
                    <Play className="w-4 h-4 text-white fill-current" />
                  </div>
                  {video.duration && (
                    <span className="absolute bottom-0.5 right-0.5 bg-black/80 text-white text-[8px] font-mono px-1 font-bold">
                      {video.duration}
                    </span>
                  )}
                </div>

                {/* Details */}
                <div
                  className="flex-1 min-w-0 cursor-pointer"
                  onClick={() => handleSelectCandidate(video)}
                >
                  <h5 className="font-black text-xs text-black line-clamp-1 leading-tight hover:text-[#FF2E93]">
                    {video.title}
                  </h5>
                  <div className="text-[10px] font-bold text-gray-500 mt-0.5 truncate">
                    {video.channelTitle}
                  </div>
                </div>

                {/* Actions: Preview & Pick */}
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    type="button"
                    onClick={() =>
                      setPreviewPlayerVideoId((prev) =>
                        prev === video.videoId ? null : video.videoId
                      )
                    }
                    className="neo-btn bg-[#FFE600] text-black text-[10px] p-1 font-black"
                    title="Preview cuplikan"
                  >
                    <Play className="w-3 h-3 fill-current" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSelectCandidate(video)}
                    className="neo-btn bg-[#23E875] text-black text-[10px] px-2 py-1 font-black"
                  >
                    Pilih
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Empty search notice */}
        {requestType === 'LAGU' && !selectedVideo && hasSearched && !isSearching && searchResults.length === 0 && details.trim().length >= 3 && (
          <div className="p-2 bg-gray-50 border border-black text-[11px] font-bold text-gray-600 text-center">
            Tidak ditemukan video untuk "{details}". Coba kata kunci yang lebih spesifik atau paste link YouTube.
          </div>
        )}

        {/* Fast Track Option (Radio seperti opsi Anime/Game pada Cosplay) */}
        {requestType === 'LAGU' && (
          <div className="flex gap-1.5 p-1.5 bg-yellow-50 border-[1.5px] border-black">
            <button
              type="button"
              onClick={() => setIsFastTrack(false)}
              className={`flex-1 py-1 text-xs font-black uppercase border border-black flex items-center justify-center gap-1 transition-all ${
                !isFastTrack
                  ? 'bg-black text-white shadow-[1px_1px_0_0_#FFE600]'
                  : 'bg-white text-gray-700 hover:bg-gray-100'
              }`}
            >
              <span>Reguler</span>
            </button>
            <button
              type="button"
              onClick={() => setIsFastTrack(true)}
              className={`flex-1 py-1 text-xs font-black uppercase border border-black flex items-center justify-center gap-1 transition-all ${
                isFastTrack
                  ? 'bg-[#FFE600] text-red-600 border-red-600 shadow-[1px_1px_0_0_#000]'
                  : 'bg-white text-gray-700 hover:bg-gray-100'
              }`}
            >
              <Zap className="w-3.5 h-3.5 fill-current text-red-600" />
              <span>Fast Track</span>
            </button>
          </div>
        )}

        {/* Status notification */}
        {statusMessage && (
          <div
            className={`p-2 text-xs font-black border border-black ${
              statusMessage.error ? 'bg-red-100 text-red-900' : 'bg-green-100 text-green-900'
            }`}
          >
            {statusMessage.text}
          </div>
        )}

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full neo-btn bg-[#23E875] text-black py-2.5 text-xs uppercase font-black shadow-[2.5px_2.5px_0_0_#121212] disabled:opacity-50"
        >
          {isSubmitting ? (
            <Loader2 className="w-4 h-4 animate-spin mx-auto" />
          ) : (
            <span>+ Masukkan Antrean</span>
          )}
        </button>
      </form>
    </div>
  );
}
