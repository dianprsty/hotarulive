'use client';

import { useEffect, useRef, useState } from 'react';
import { RequestItem } from '@/types';
import { Play, Pause, SkipForward, Volume2, VolumeX, Music, Radio } from 'lucide-react';

interface YouTubePlayerProps {
  currentSong: RequestItem | null;
  onSongEnded: (song: RequestItem) => void;
  onSkipNext: () => void;
}

declare global {
  interface Window {
    YT: any;
    onYouTubeIframeAPIReady: () => void;
  }
}

export function YouTubePlayer({ currentSong, onSongEnded, onSkipNext }: YouTubePlayerProps) {
  const [isSessionStarted, setIsSessionStarted] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(80);
  const [isMuted, setIsMuted] = useState(false);
  const [playerReady, setPlayerReady] = useState(false);

  const playerRef = useRef<any>(null);
  const currentSongRef = useRef<RequestItem | null>(currentSong);

  useEffect(() => {
    currentSongRef.current = currentSong;
  }, [currentSong]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!window.YT) {
      const tag = document.createElement('script');
      tag.src = 'https://www.youtube.com/iframe_api';
      const firstScriptTag = document.getElementsByTagName('script')[0];
      firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);
    }
  }, []);

  const initPlayer = (videoId: string) => {
    if (!window.YT || !window.YT.Player) return;

    if (playerRef.current) {
      try {
        playerRef.current.loadVideoById(videoId);
        playerRef.current.playVideo();
        setIsPlaying(true);
        return;
      } catch (e) {
        console.warn('Reloading YT player...', e);
      }
    }

    playerRef.current = new window.YT.Player('yt-player-element', {
      height: '100%',
      width: '100%',
      videoId: videoId,
      playerVars: {
        autoplay: 1,
        controls: 1,
        rel: 0,
        modestbranding: 1,
      },
      events: {
        onReady: (event: any) => {
          setPlayerReady(true);
          event.target.setVolume(volume);
          event.target.playVideo();
          setIsPlaying(true);
        },
        onStateChange: (event: any) => {
          if (event.data === 0) {
            setIsPlaying(false);
            if (currentSongRef.current) {
              onSongEnded(currentSongRef.current);
            }
          } else if (event.data === 1) {
            setIsPlaying(true);
          } else if (event.data === 2) {
            setIsPlaying(false);
          }
        },
      },
    });
  };

  const handleStartMusicSession = () => {
    setIsSessionStarted(true);
    const videoIdToPlay = currentSong?.youtubeVideoId || 'ZRtdQ81jPUQ';
    if (window.YT && window.YT.Player) {
      initPlayer(videoIdToPlay);
    } else {
      window.onYouTubeIframeAPIReady = () => {
        initPlayer(videoIdToPlay);
      };
    }
  };

  useEffect(() => {
    if (!isSessionStarted || !currentSong?.youtubeVideoId) return;

    if (playerRef.current && playerReady) {
      try {
        playerRef.current.loadVideoById(currentSong.youtubeVideoId);
        playerRef.current.playVideo();
        setIsPlaying(true);
      } catch (err) {
        console.error('Error changing song:', err);
      }
    } else if (isSessionStarted && window.YT && window.YT.Player) {
      initPlayer(currentSong.youtubeVideoId);
    }
  }, [currentSong?.youtubeVideoId, isSessionStarted, playerReady]);

  const togglePlayPause = () => {
    if (!playerRef.current) return;
    if (isPlaying) {
      playerRef.current.pauseVideo();
      setIsPlaying(false);
    } else {
      playerRef.current.playVideo();
      setIsPlaying(true);
    }
  };

  const handleVolumeChange = (newVol: number) => {
    setVolume(newVol);
    if (playerRef.current) {
      playerRef.current.setVolume(newVol);
      if (newVol > 0 && isMuted) {
        playerRef.current.unMute();
        setIsMuted(false);
      }
    }
  };

  const toggleMute = () => {
    if (!playerRef.current) return;
    if (isMuted) {
      playerRef.current.unMute();
      setIsMuted(false);
    } else {
      playerRef.current.mute();
      setIsMuted(true);
    }
  };

  return (
    <div className="neo-box bg-[#121212] text-white p-3 sm:p-4">
      {/* Header */}
      <div className="flex items-center justify-between pb-2 mb-2 border-b border-zinc-700">
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
          <span className="text-xs font-black uppercase text-[#FFE600]">
            YouTube Musik
          </span>
        </div>
        {currentSong && (
          <span className="text-xs font-mono text-[#00F0FF] truncate max-w-[200px]">
            🎵 {currentSong.details}
          </span>
        )}
      </div>

      {/* Video Viewport */}
      <div className="relative aspect-video w-full bg-black border-2 border-zinc-700 overflow-hidden mb-2.5">
        {!isSessionStarted ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center p-4 text-center bg-zinc-900/95 z-20">
            <Music className="w-8 h-8 text-[#FFE600] mb-2" />
            <p className="text-xs text-zinc-300 mb-3 font-bold">
              Klik 1x untuk mulai memutar lagu
            </p>
            <button
              onClick={handleStartMusicSession}
              className="neo-btn bg-[#FFE600] text-black px-4 py-2 font-black uppercase text-xs"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>Mulai Sesi Musik 🎵</span>
            </button>
          </div>
        ) : null}

        <div id="yt-player-element" className="w-full h-full" />
      </div>

      {/* Controls */}
      {isSessionStarted && (
        <div className="flex items-center justify-between gap-2 pt-1">
          <div className="flex items-center gap-1.5">
            <button
              onClick={togglePlayPause}
              className="neo-btn bg-white text-black p-1.5 border border-black text-xs"
              title={isPlaying ? 'Jeda' : 'Putar'}
            >
              {isPlaying ? <Pause className="w-3.5 h-3.5 fill-current" /> : <Play className="w-3.5 h-3.5 fill-current" />}
            </button>

            <button
              onClick={onSkipNext}
              className="neo-btn bg-[#FF2E93] text-white px-2.5 py-1 text-xs font-black uppercase flex items-center gap-1"
              title="Lewati ke lagu berikutnya"
            >
              <SkipForward className="w-3.5 h-3.5" />
              <span>Skip</span>
            </button>
          </div>

          <div className="flex items-center gap-1.5">
            <button onClick={toggleMute} className="text-zinc-400 hover:text-white">
              {isMuted || volume === 0 ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
            </button>
            <input
              type="range"
              min="0"
              max="100"
              value={isMuted ? 0 : volume}
              onChange={(e) => handleVolumeChange(Number(e.target.value))}
              className="w-16 sm:w-20 accent-[#FFE600] cursor-pointer"
            />
          </div>
        </div>
      )}
    </div>
  );
}
