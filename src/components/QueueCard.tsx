'use client';

import { RequestItem } from '@/types';
import {
  Check,
  X,
  Zap,
  ExternalLink,
  GripVertical,
  ChevronUp,
  ChevronDown,
} from 'lucide-react';

interface QueueCardProps {
  item: RequestItem;
  index: number;
  isAdmin?: boolean;
  onMarkDone?: (id: string) => void;
  onDelete?: (id: string) => void;
  onPlayNow?: (item: RequestItem) => void;
  onToggleFastTrack?: (id: string, current: boolean) => void;
  // Manual Reordering props
  canMoveUp?: boolean;
  canMoveDown?: boolean;
  onMoveUp?: (id: string) => void;
  onMoveDown?: (id: string) => void;
  draggable?: boolean;
  onDragStart?: (e: React.DragEvent<HTMLDivElement>, id: string) => void;
  onDragOver?: (e: React.DragEvent<HTMLDivElement>, id: string) => void;
  onDragEnd?: (e: React.DragEvent<HTMLDivElement>) => void;
  onDrop?: (e: React.DragEvent<HTMLDivElement>, id: string) => void;
  isDragging?: boolean;
  isDragOver?: boolean;
}

export function QueueCard({
  item,
  index,
  isAdmin = false,
  onMarkDone,
  onDelete,
  onToggleFastTrack,
  canMoveUp = false,
  canMoveDown = false,
  onMoveUp,
  onMoveDown,
  draggable = false,
  onDragStart,
  onDragOver,
  onDragEnd,
  onDrop,
  isDragging = false,
  isDragOver = false,
}: QueueCardProps) {
  const isCompleted = item.status === 'COMPLETED';

  const getTypeTag = () => {
    switch (item.requestType) {
      case 'FANSIGN':
        return { label: '✍️ Fansign', bg: 'bg-[#A855F7] text-white' };
      case 'PAP':
        return { label: '📸 PAP', bg: 'bg-[#FF2E93] text-white' };
      case 'COSPLAY':
        return {
          label: `🎭 ${item.cosplaySubType || 'Cosplay'}`,
          bg: 'bg-[#FF7A00] text-white',
        };
      default:
        return null;
    }
  };

  const tag = getTypeTag();

  return (
    <div
      draggable={isAdmin && !isCompleted && draggable}
      onDragStart={(e) => onDragStart && onDragStart(e, item.id)}
      onDragOver={(e) => onDragOver && onDragOver(e, item.id)}
      onDragEnd={(e) => onDragEnd && onDragEnd(e)}
      onDrop={(e) => onDrop && onDrop(e, item.id)}
      className={`border-[2px] border-black transition-all p-2.5 sm:p-3 ${
        isDragging
          ? 'opacity-40 scale-[0.98] border-dashed border-gray-500 bg-gray-100 shadow-none'
          : isDragOver
          ? 'ring-2 ring-black bg-yellow-50 border-black shadow-[3px_3px_0_0_#FFE600]'
          : isCompleted
          ? 'bg-gray-100 opacity-60 border-dashed'
          : item.isFastTrack
          ? 'bg-[#FFF9D2] border-red-600 shadow-[2px_2px_0_0_#DC2626]'
          : 'bg-white shadow-[2px_2px_0_0_#000]'
      }`}
    >
      {/* 1. TOP HEADER: Nomer Kartu Antrean & Badges (Kiri), Button Order / Reorder (Kanan Atas) */}
      <div className="flex items-center justify-between gap-2">
        {/* Kiri Atas: Drag Handle, Nomer Kartu Antrean & Badges */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {/* Drag Handle di samping kiri indikator urutan angka */}
          {isAdmin && !isCompleted && draggable && (
            <div
              className="cursor-grab active:cursor-grabbing text-gray-700 hover:text-black bg-gray-50 hover:bg-yellow-200 px-1 py-0.5 border border-black shadow-[1px_1px_0_0_#000] flex items-center justify-center transition-colors"
              title="Tahan & geser untuk mengubah urutan"
            >
              <GripVertical className="w-3.5 h-3.5" />
            </div>
          )}

          {/* Index Number Badge */}
          <span
            className={`shrink-0 text-xs font-black px-2 py-0.5 border border-black flex items-center gap-1 shadow-[1px_1px_0_0_#000] ${
              isCompleted
                ? 'bg-gray-300 text-gray-700'
                : item.isFastTrack
                ? 'bg-[#FFE600] text-red-600 border-red-600'
                : 'bg-black text-white'
            }`}
          >
            #{index + 1}
            {item.isFastTrack && !isCompleted && (
              <Zap className="w-3 h-3 fill-current text-red-600" />
            )}
          </span>

          {/* Tag for Non-Songs */}
          {tag && (
            <span className={`text-[9px] font-black px-1.5 py-0.5 border border-black ${tag.bg}`}>
              {tag.label}
            </span>
          )}

          {/* Fast Track Text Badge */}
          {item.isFastTrack && !isCompleted && (
            <span className="text-[9px] font-black bg-red-100 text-red-600 px-1.5 py-0.5 border border-red-500">
              ⚡ FAST TRACK
            </span>
          )}
        </div>

        {/* Kanan Atas: Button Order (Move Up/Down) */}
        <div className="flex items-center gap-1 shrink-0">
          {isAdmin && !isCompleted && (onMoveUp || onMoveDown) && (
            <div className="flex items-center gap-1 bg-gray-50 p-0.5 border border-black shadow-[1px_1px_0_0_#000]">
              {/* Move Up Button */}
              {onMoveUp && (
                <button
                  type="button"
                  disabled={!canMoveUp}
                  onClick={() => onMoveUp(item.id)}
                  className="h-6 w-6 inline-flex items-center justify-center border border-black bg-white hover:bg-yellow-200 disabled:opacity-20 disabled:pointer-events-none active:translate-x-0.5 active:translate-y-0.5 transition-all"
                  title="Pindah ke Atas"
                >
                  <ChevronUp className="w-3.5 h-3.5 stroke-[2.5]" />
                </button>
              )}

              {/* Move Down Button */}
              {onMoveDown && (
                <button
                  type="button"
                  disabled={!canMoveDown}
                  onClick={() => onMoveDown(item.id)}
                  className="h-6 w-6 inline-flex items-center justify-center border border-black bg-white hover:bg-yellow-200 disabled:opacity-20 disabled:pointer-events-none active:translate-x-0.5 active:translate-y-0.5 transition-all"
                  title="Pindah ke Bawah"
                >
                  <ChevronDown className="w-3.5 h-3.5 stroke-[2.5]" />
                </button>
              )}
            </div>
          )}

          {isCompleted && (
            <span className="shrink-0 text-[10px] font-black text-gray-600 bg-gray-200 px-1.5 py-0.5 border border-gray-400">
              SELESAI
            </span>
          )}
        </div>
      </div>

      {/* 2. MIDDLE: Judul Lagu Dibawah Nomer Kartu Antrean */}
      <div className="mt-2.5 space-y-1">
        <p
          className={`font-black text-sm sm:text-base text-black leading-snug break-words ${
            isCompleted ? 'line-through text-gray-500' : ''
          }`}
        >
          {item.details}
        </p>

        {/* Sub-info: Viewer Name & External YouTube Link */}
        <div className="flex items-center gap-2 flex-wrap text-xs">
          <span className="font-bold text-gray-600 truncate">
            oleh <strong className="text-black">{item.viewerName}</strong>
          </span>

          {item.requestType === 'LAGU' && item.youtubeVideoId && (
            <a
              href={`https://www.youtube.com/watch?v=${item.youtubeVideoId}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[11px] font-bold text-red-600 hover:text-red-800 hover:underline inline-flex items-center gap-0.5"
              title={item.youtubeTitle || 'Buka di YouTube'}
            >
              <ExternalLink className="w-3 h-3" />
              <span>YouTube</span>
            </a>
          )}
        </div>
      </div>

      {/* Bottom: Action Buttons (Host / Moderator) */}
      {isAdmin && (
        <div className="mt-2.5 pt-2 border-t border-black/10 flex items-center justify-end gap-1.5">
          {/* Toggle Fast Track button for Song if not completed */}
          {onToggleFastTrack && !isCompleted && item.requestType === 'LAGU' && (
            <button
              type="button"
              onClick={() => onToggleFastTrack(item.id, item.isFastTrack)}
              className={`h-7 px-2.5 text-[11px] font-black uppercase inline-flex items-center gap-1 border border-black shadow-[1.5px_1.5px_0_0_#000] transition-transform active:translate-x-0.5 active:translate-y-0.5 shrink-0 ${
                item.isFastTrack
                  ? 'bg-[#FFE600] text-black hover:bg-yellow-400'
                  : 'bg-white text-gray-700 hover:bg-yellow-100 hover:text-black'
              }`}
              title={item.isFastTrack ? 'Batalkan Fast Track' : 'Jadikan Fast Track'}
            >
              <Zap className={`w-3 h-3 ${item.isFastTrack ? 'fill-current text-black' : 'text-gray-500'}`} />
              <span>{item.isFastTrack ? 'Batal FT' : 'Fast Track'}</span>
            </button>
          )}

          {/* Done / Undone Button */}
          {onMarkDone && (
            <button
              type="button"
              onClick={() => onMarkDone(item.id)}
              className={`h-7 px-2.5 text-[11px] font-black uppercase inline-flex items-center justify-center gap-1 border border-black shadow-[1.5px_1.5px_0_0_#000] transition-transform active:translate-x-0.5 active:translate-y-0.5 shrink-0 ${
                isCompleted
                  ? 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  : 'bg-[#23E875] text-black hover:bg-[#1fd368]'
              }`}
            >
              <Check className="w-3 h-3 stroke-[3]" />
              <span>{isCompleted ? 'Batal' : 'Selesai'}</span>
            </button>
          )}

          {/* Delete Button */}
          {onDelete && (
            <button
              type="button"
              onClick={() => onDelete(item.id)}
              className="h-7 w-7 aspect-square shrink-0 border border-black bg-white hover:bg-red-500 hover:text-white text-gray-700 inline-flex items-center justify-center shadow-[1.5px_1.5px_0_0_#000] transition-transform active:translate-x-0.5 active:translate-y-0.5"
              title="Hapus"
            >
              <X className="w-3 h-3 stroke-[2.5]" />
            </button>
          )}
        </div>
      )}
    </div>
  );
}
