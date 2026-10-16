'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
export function Navbar({ isConnected = true }: { isConnected?: boolean }) {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-40 bg-[#FFFDF5] border-b-[3px] border-[#121212] px-3 py-2.5 shadow-[0_3px_0_0_#121212]">
      <div className="max-w-4xl mx-auto flex items-center justify-between gap-2">
        {/* Brand */}
        <Link href="/" className="flex items-center gap-1.5 shrink-0">
          <div className="bg-[#FFE600] border-[2px] border-[#121212] px-2 py-0.5 font-black text-sm tracking-tight shadow-[1.5px_1.5px_0_0_#121212] flex items-center gap-1">
            <span className="text-[#FF2E93] text-base leading-none">★</span>
            <span className="text-[#121212] font-black uppercase tracking-tight">HOTARU LIVE</span>
          </div>
          <span className="flex items-center gap-1 text-[10px] font-black bg-white border-[1.5px] border-black px-1.5 py-0.5">
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                isConnected ? 'bg-[#23E875] animate-pulse' : 'bg-red-500'
              }`}
            />
            <span>HOTARU</span>
          </span>
        </Link>

        {/* Only show link back to public queue when on host/mod pages */}
        {pathname !== '/' && (
          <Link
            href="/"
            className="flex items-center gap-1 px-2.5 py-1 border-[2px] border-[#121212] text-xs font-black uppercase bg-white text-gray-800 hover:bg-gray-100 shadow-[1px_1px_0_0_#121212]"
          >
            ← Antrean
          </Link>
        )}
      </div>
    </header>
  );
}
