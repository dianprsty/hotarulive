'use client';

import { useRealtimeQueue } from '@/hooks/useRealtimeQueue';
import { isToday } from '@/lib/dateUtils';
import { Radio, Zap, Music, Sparkles, PenTool, Camera } from 'lucide-react';

export default function ObsOverlayPage() {
  const { requests, settings } = useRealtimeQueue();

  const activeItem = requests.find((r) => r.status === 'PLAYING');
  const pendingItems = requests
    .filter((r) => r.status === 'PENDING' && (r.requestType !== 'LAGU' || isToday(r.createdAt)))
    .slice(0, 3);

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'LAGU':
        return <Music className="w-3.5 h-3.5 text-black" />;
      case 'FANSIGN':
        return <PenTool className="w-3.5 h-3.5 text-black" />;
      case 'PAP':
        return <Camera className="w-3.5 h-3.5 text-black" />;
      case 'COSPLAY':
        return <Sparkles className="w-3.5 h-3.5 text-black" />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-transparent p-4 flex flex-col justify-end max-w-md pointer-events-none select-none font-sans">
      {/* Container Box */}
      <div className="space-y-3">
        {/* Active Now Item */}
        {activeItem ? (
          <div className="neo-box-lg bg-[#00F0FF] border-[3.5px] border-black p-3.5 shadow-[5px_5px_0_0_#000] animate-fadeIn">
            <div className="flex items-center justify-between gap-2 mb-1.5">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-red-600 animate-ping" />
                <span className="bg-black text-[#00F0FF] text-[10px] font-black uppercase px-2 py-0.5 border border-black">
                  NOW ACTIVE
                </span>
                <span className="bg-white text-black text-[10px] font-black uppercase px-2 py-0.5 border border-black">
                  {activeItem.requestType}
                </span>
              </div>
              {activeItem.isFastTrack && (
                <span className="bg-[#FFE600] text-black text-[9px] font-black px-1.5 py-0.5 border border-black flex items-center gap-0.5">
                  <Zap className="w-2.5 h-2.5 fill-current text-red-600" />
                  FAST TRACK
                </span>
              )}
            </div>

            <div className="bg-white border-[2.5px] border-black p-2.5 shadow-[2px_2px_0_0_#000]">
              <div className="font-black text-sm text-black truncate">
                {activeItem.viewerName}
              </div>
              <p className="font-extrabold text-xs text-gray-900 mt-0.5 truncate">
                {activeItem.details}
              </p>
            </div>
          </div>
        ) : null}

        {/* Up Next Queue HUD */}
        {pendingItems.length > 0 && (
          <div className="neo-box bg-[#FFE600] border-[3.5px] border-black p-3 shadow-[5px_5px_0_0_#000]">
            <div className="flex items-center justify-between mb-2">
              <span className="font-black text-[11px] uppercase tracking-wider text-black flex items-center gap-1">
                📋 ANTRIAN BERIKUTNYA
              </span>
              <span className="text-[10px] font-mono font-bold bg-black text-white px-1.5 py-0.2">
                TOTAL: {requests.filter((r) => r.status === 'PENDING').length}
              </span>
            </div>

            <div className="space-y-1.5">
              {pendingItems.map((item, idx) => (
                <div
                  key={item.id}
                  className={`border-[2px] border-black p-2 flex items-center justify-between gap-2 text-xs font-black shadow-[1.5px_1.5px_0_0_#000] ${
                    item.isFastTrack ? 'bg-[#FFF275] border-red-600' : 'bg-white'
                  }`}
                >
                  <div className="flex items-center gap-2 overflow-hidden">
                    <span className="bg-black text-white text-[10px] font-mono px-1.5 py-0.2">
                      #{idx + 1}
                    </span>
                    <span className="truncate max-w-[140px] text-black">
                      {item.viewerName}
                    </span>
                    <span className="text-gray-500 font-bold truncate max-w-[120px]">
                      • {item.details}
                    </span>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    {item.isFastTrack && (
                      <span className="bg-red-500 text-white text-[8px] px-1 font-black">
                        FAST TRACK
                      </span>
                    )}
                    <span className="bg-gray-100 border border-black p-0.5">
                      {getTypeIcon(item.requestType)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
