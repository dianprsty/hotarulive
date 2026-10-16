'use client';

import { useState } from 'react';
import {
  Music,
  FileText,
  Camera,
  Sparkles,
  History,
  Menu,
  X,
  ExternalLink,
  Zap,
} from 'lucide-react';
import Link from 'next/link';

export type RequestMenuTab = 'SONGS' | 'FANSIGN' | 'PAP' | 'COSPLAY' | 'HISTORY';

interface RequestNavigationProps {
  activeTab: RequestMenuTab;
  onTabChange: (tab: RequestMenuTab) => void;
  counts: {
    songs: number;
    fansign: number;
    pap: number;
    cosplay: number;
    history: number;
  };
  fastTrackCount?: number;
}

export function RequestNavigation({
  activeTab,
  onTabChange,
  counts,
  fastTrackCount = 0,
}: RequestNavigationProps) {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const navItems = [
    {
      id: 'SONGS' as RequestMenuTab,
      label: 'Lagu',
      fullLabel: 'Antrean Lagu',
      icon: Music,
      emoji: '🎵',
      count: counts.songs,
      badgeBg: 'bg-[#FFE600] text-black',
      activeBg: 'bg-[#FFE600]',
    },
    {
      id: 'FANSIGN' as RequestMenuTab,
      label: 'Fansign',
      fullLabel: 'Request Fansign',
      icon: FileText,
      emoji: '✍️',
      count: counts.fansign,
      badgeBg: 'bg-[#A855F7] text-white',
      activeBg: 'bg-[#A855F7] text-white',
    },
    {
      id: 'PAP' as RequestMenuTab,
      label: 'PAP',
      fullLabel: 'Request PAP',
      icon: Camera,
      emoji: '📸',
      count: counts.pap,
      badgeBg: 'bg-[#FF2E93] text-white',
      activeBg: 'bg-[#FF2E93] text-white',
    },
    {
      id: 'COSPLAY' as RequestMenuTab,
      label: 'Cosplay',
      fullLabel: 'Request Cosplay',
      icon: Sparkles,
      emoji: '🎭',
      count: counts.cosplay,
      badgeBg: 'bg-[#FF7A00] text-white',
      activeBg: 'bg-[#FF7A00] text-white',
    },
    {
      id: 'HISTORY' as RequestMenuTab,
      label: 'History',
      fullLabel: 'History Selesai',
      icon: History,
      emoji: '📜',
      count: counts.history,
      badgeBg: 'bg-gray-300 text-gray-800',
      activeBg: 'bg-black text-white',
    },
  ];

  const currentItem = navItems.find((i) => i.id === activeTab) || navItems[0];

  return (
    <>
      {/* 1. MOBILE BAR (< md): Drawer Button & Active Tab Indicator */}
      <div className="md:hidden flex items-center justify-between gap-2 p-1.5 bg-white border-[2.5px] border-black shadow-[2px_2px_0_0_#000]">
        <button
          type="button"
          onClick={() => setIsDrawerOpen(true)}
          className="h-8 px-2.5 bg-[#FFE600] hover:bg-yellow-400 border-[1.5px] border-black font-black text-xs uppercase flex items-center gap-1.5 shadow-[1.5px_1.5px_0_0_#000] active:translate-x-0.5 active:translate-y-0.5 transition-all cursor-pointer"
        >
          <Menu className="w-4 h-4 stroke-[2.5]" />
          <span>Menu</span>
        </button>

        {/* Active Tab Indicator Badge */}
        <div className="flex items-center gap-1.5">
          <span className="text-xs font-black uppercase text-black flex items-center gap-1">
            <span>{currentItem.emoji}</span>
            <span>{currentItem.label}</span>
          </span>
          <span className={`px-1.5 py-0.2 text-[10px] font-black border border-black shadow-[1px_1px_0_0_#000] ${currentItem.badgeBg}`}>
            {currentItem.count}
          </span>
          {activeTab === 'SONGS' && fastTrackCount > 0 && (
            <span className="text-[10px] font-black bg-red-100 text-red-600 px-1 py-0.2 border border-red-500 flex items-center gap-0.5">
              <Zap className="w-2.5 h-2.5 fill-current" /> {fastTrackCount} FT
            </span>
          )}
        </div>
      </div>

      {/* 2. DESKTOP TABS (>= md): Clean Horizontal Segmented Menu */}
      <div className="hidden md:flex gap-1.5 p-1 bg-white border-[2.5px] border-black shadow-[2px_2px_0_0_#000] select-none">
        {navItems.map((item) => {
          const isActive = activeTab === item.id;
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onTabChange(item.id)}
              className={`flex-1 py-2 px-2 text-xs font-black uppercase flex items-center justify-center gap-1.5 border transition-all cursor-pointer ${
                isActive
                  ? `${item.activeBg} border-black shadow-[2px_2px_0_0_#000]`
                  : 'text-gray-700 hover:text-black hover:bg-gray-100 border-transparent'
              }`}
            >
              <Icon className="w-3.5 h-3.5 shrink-0 stroke-[2.5]" />
              <span className="truncate">{item.label}</span>
              <span
                className={`ml-0.5 px-1.5 py-0.2 text-[10px] font-black border border-black shrink-0 ${
                  isActive ? 'bg-white text-black' : item.badgeBg
                }`}
              >
                {item.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* 3. MOBILE SIDEBAR DRAWER (< md) */}
      {isDrawerOpen && (
        <div className="fixed inset-0 z-50 flex">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-[2px] animate-in fade-in duration-200"
            onClick={() => setIsDrawerOpen(false)}
            aria-hidden="true"
          />

          {/* Drawer Sidebar Panel */}
          <aside className="relative w-72 max-w-[85vw] h-full bg-[#FFFDF5] border-r-[3px] border-black z-50 p-4 flex flex-col shadow-[4px_0_0_0_#000] animate-in slide-in-from-left duration-200">
            {/* Drawer Header */}
            <div className="flex items-center justify-between pb-3 border-b-[2px] border-black">
              <div className="flex items-center gap-1.5">
                <div className="bg-[#FFE600] border-[2px] border-black px-2 py-0.5 font-black text-xs uppercase shadow-[1.5px_1.5px_0_0_#000]">
                  ★ MENU REQUEST
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsDrawerOpen(false)}
                className="w-7 h-7 border-[1.5px] border-black bg-white hover:bg-red-500 hover:text-white flex items-center justify-center shadow-[1.5px_1.5px_0_0_#000] transition-colors"
                title="Tutup Menu"
              >
                <X className="w-4 h-4 stroke-[2.5]" />
              </button>
            </div>

            {/* Menu Title / Context */}
            <div className="mt-3 px-1">
              <p className="text-[11px] font-black uppercase text-gray-500">Pilih Kategori Request</p>
            </div>

            {/* Drawer Navigation Items */}
            <nav className="mt-2 space-y-2 flex-1 overflow-y-auto pr-0.5">
              {navItems.map((item) => {
                const isActive = activeTab === item.id;
                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      onTabChange(item.id);
                      setIsDrawerOpen(false);
                    }}
                    className={`w-full p-2.5 border-[2px] border-black text-left flex items-center justify-between transition-all cursor-pointer ${
                      isActive
                        ? `${item.activeBg} shadow-[2.5px_2.5px_0_0_#000] translate-x-1`
                        : 'bg-white hover:bg-yellow-50 text-gray-800 shadow-[1.5px_1.5px_0_0_#000]'
                    }`}
                  >
                    <div className="flex items-center gap-2 font-black text-xs uppercase">
                      <span className="text-sm">{item.emoji}</span>
                      <span>{item.fullLabel}</span>
                    </div>
                    <span
                      className={`px-1.5 py-0.5 text-[10px] font-black border border-black shadow-[1px_1px_0_0_#000] ${
                        isActive ? 'bg-white text-black' : item.badgeBg
                      }`}
                    >
                      {item.count}
                    </span>
                  </button>
                );
              })}
            </nav>

            {/* Drawer Bottom Quick Links */}
            <div className="mt-auto pt-3 border-t-[2px] border-black space-y-2">
              <span className="text-[10px] font-black uppercase text-gray-500 block">Navigasi Halaman</span>
              <div className="grid grid-cols-2 gap-1.5">
                <Link
                  href="/"
                  onClick={() => setIsDrawerOpen(false)}
                  className="px-2 py-1.5 border border-black bg-white hover:bg-gray-100 text-[11px] font-black uppercase text-center shadow-[1px_1px_0_0_#000] truncate"
                >
                  Queue Publik
                </Link>
                <Link
                  href="/mod"
                  onClick={() => setIsDrawerOpen(false)}
                  className="px-2 py-1.5 border border-black bg-[#00F0FF] hover:bg-cyan-300 text-[11px] font-black uppercase text-center shadow-[1px_1px_0_0_#000] truncate"
                >
                  Moderator
                </Link>
              </div>
            </div>
          </aside>
        </div>
      )}
    </>
  );
}
