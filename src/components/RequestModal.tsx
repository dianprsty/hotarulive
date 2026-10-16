'use client';

import { useEffect } from 'react';
import { X, Plus } from 'lucide-react';
import { RequestForm } from './RequestForm';

interface RequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  addedByRole?: 'HOST' | 'MODERATOR';
}

export function RequestModal({
  isOpen,
  onClose,
  onSuccess,
  addedByRole = 'HOST',
}: RequestModalProps) {
  // Close on ESC key press
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Lock background scroll when modal is active
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/70 backdrop-blur-[2px] animate-in fade-in duration-150">
      {/* Backdrop overlay */}
      <div
        className="fixed inset-0"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal Dialog Window */}
      <div className="relative w-full max-w-md max-h-[92vh] overflow-y-auto neo-box bg-white p-4 sm:p-5 border-[3px] border-black shadow-[6px_6px_0_0_#000] z-10 space-y-3">
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-2.5 border-b-2 border-black">
          <div className="flex items-center gap-2">
            <span
              className={`text-[10px] font-black uppercase px-1.5 py-0.5 border border-black ${
                addedByRole === 'HOST'
                  ? 'bg-[#FFE600] text-black'
                  : 'bg-[#A855F7] text-white'
              }`}
            >
              {addedByRole === 'HOST' ? 'Host' : 'Mod'}
            </span>
            <h3 className="font-black text-sm uppercase text-black flex items-center gap-1.5">
              <Plus className="w-4 h-4 text-black stroke-[3]" />
              Tambah Request Baru
            </h3>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="neo-btn bg-white hover:bg-red-100 p-1 border-[1.5px] border-black text-black"
            title="Tutup (ESC)"
          >
            <X className="w-4 h-4 stroke-[2.5]" />
          </button>
        </div>

        {/* Modal Body / Request Form */}
        <RequestForm
          addedByRole={addedByRole}
          onSuccess={() => {
            if (onSuccess) onSuccess();
            onClose();
          }}
          inModal={true}
        />
      </div>
    </div>
  );
}
