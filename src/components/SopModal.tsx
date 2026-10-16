'use client';

import { X, AlertTriangle, ShieldCheck, HeartHandshake, Zap, Music } from 'lucide-react';

interface SopModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SopModal({ isOpen, onClose }: SopModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div className="neo-box-lg bg-[#FFFDF5] max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 relative">
        {/* Header */}
        <div className="flex items-center justify-between border-b-[3px] border-[#121212] pb-4 mb-4">
          <div className="flex items-center gap-2">
            <div className="bg-[#FFE600] p-2 border-[2.5px] border-[#121212] shadow-[2px_2px_0_0_#121212]">
              <ShieldCheck className="w-6 h-6 text-[#121212]" />
            </div>
            <div>
              <h2 className="text-xl font-black uppercase tracking-tight text-[#121212]">
                SOP & Aturan Main Hotaru Live
              </h2>
              <p className="text-xs font-bold text-gray-700">
                Panduan Resmi untuk Penonton, Host, & Moderator
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="neo-btn bg-[#FF2E93] text-white p-1.5 border-[2.5px] hover:bg-black"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="space-y-6 text-sm">
          {/* Section A: Viewers */}
          <div className="neo-box p-4 bg-white">
            <div className="flex items-center gap-2 mb-3">
              <span className="neo-badge bg-[#00F0FF] text-[#121212]">Bagian A</span>
              <h3 className="font-black text-base uppercase text-[#121212]">
                Aturan untuk Penonton (Viewers)
              </h3>
            </div>
            <ol className="list-decimal list-inside space-y-2.5 font-semibold text-gray-800">
              <li>
                <strong className="text-black">Format Request:</strong> Tuliskan di live chat TikTok dengan format yang jelas:
                <div className="mt-1 bg-yellow-100 border-[2px] border-black p-2 font-mono text-xs font-bold text-black">
                  !req [Lagu/Fansign/PAP/Cosplay] [Detail/Judul]
                </div>
              </li>
              <li>
                <strong className="text-black">Sistem Antrean Reguler (FIFO):</strong> Request standar diproses sesuai urutan waktu masuk. Jangan spam komentar jika nama sudah ada di antrean.
              </li>
              <li>
                <strong className="text-black">Jalur Prioritas (Fast Track):</strong> Request Lagu dapat langsung melompat ke posisi teratas khusus bagi yang mengirimkan <span className="bg-yellow-300 px-1 border border-black font-extrabold">Gift Kategori Sultan (Paus, Singa, dsb.)</span>.
              </li>
              <li>
                <strong className="text-black">Batasan Request Cosplay:</strong> Hanya karakter yang kostum / wig / aksesorisnya tersedia di sesi Hotaru Live saat ini.
              </li>
              <li>
                <strong className="text-black">Konten Aman & Komunitas:</strong> Dilarang request berbau SARA, ujaran kebencian, atau NSFW. Request bermasalah akan dihapus permanen.
              </li>
            </ol>
          </div>

          {/* Section B: Host & Moderator */}
          <div className="neo-box p-4 bg-[#FFF9D2]">
            <div className="flex items-center gap-2 mb-3">
              <span className="neo-badge bg-[#FFE600] text-[#121212]">Bagian B</span>
              <h3 className="font-black text-base uppercase text-[#121212]">
                Pedoman Host & Moderator
              </h3>
            </div>
            <ul className="list-disc list-inside space-y-2 font-semibold text-gray-800">
              <li>
                <strong className="text-black">Pendelegasian Tugas:</strong> Saat Moderator aktif, Host fokus mengeksekusi request di depan kamera. Moderator bertugas menandai selesai atau menghapus antrean untuk mencegah konflik ganda.
              </li>
              <li>
                <strong className="text-black">Verifikasi Fast Track:</strong> Moderator wajib memvalidasi notifikasi gift di layar TikTok sebelum mencentang opsi Fast Track di dasbor.
              </li>
              <li>
                <strong className="text-black">Pengendalian Musik:</strong> Jika ada lagu troll/meme yang melanggar hak cipta, segera tekan tombol <em>Lewati / Selesai</em> pada antrean.
              </li>
              <li>
                <strong className="text-black">Kerahasiaan PIN:</strong> Kode akses Moderator bersifat rahasia dan diperbarui secara berkala.
              </li>
            </ul>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-6 flex justify-end">
          <button
            onClick={onClose}
            className="neo-btn bg-[#23E875] text-[#121212] px-6 py-2.5 font-black uppercase text-sm"
          >
            Saya Mengerti 👍
          </button>
        </div>
      </div>
    </div>
  );
}
