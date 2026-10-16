'use client';

import { Plus } from 'lucide-react';

interface FloatingActionButtonProps {
  onClick: () => void;
  label?: string;
}

export function FloatingActionButton({
  onClick,
  label = 'Request',
}: FloatingActionButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="fixed bottom-5 right-5 sm:bottom-6 sm:right-6 z-40 bg-[#23E875] hover:bg-[#1cd462] text-black border-[2.5px] border-black shadow-[3.5px_3.5px_0_0_#000] hover:shadow-[4.5px_4.5px_0_0_#000] active:translate-x-[2px] active:translate-y-[2px] active:shadow-[1px_1px_0_0_#000] px-3.5 py-2.5 sm:px-4 sm:py-3 flex items-center gap-2 font-black uppercase text-xs sm:text-sm tracking-tight transition-all cursor-pointer group"
      title="Tambah Request Baru"
    >
      <div className="w-5 h-5 bg-black text-white flex items-center justify-center border border-black group-hover:rotate-90 transition-transform">
        <Plus className="w-3.5 h-3.5 stroke-[3]" />
      </div>
      <span>+ {label}</span>
    </button>
  );
}
