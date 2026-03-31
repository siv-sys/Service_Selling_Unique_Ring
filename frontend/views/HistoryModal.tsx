import React from 'react';

type HistoryModalProps = {
  isOpen: boolean;
  onClose: () => void;
};

export default function HistoryModal({ isOpen, onClose }: HistoryModalProps) {
  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Purchase history"
      className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/50 px-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl rounded-3xl bg-white p-6 shadow-2xl dark:bg-slate-900"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-slate-900 dark:text-white">Purchase History</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-2 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900 dark:hover:bg-slate-800 dark:hover:text-white"
            aria-label="Close history"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>
        <div className="rounded-2xl border border-dashed border-slate-200 p-6 text-sm text-slate-500 dark:border-slate-700 dark:text-slate-400">
          Your purchase timeline will appear here once history data is connected.
        </div>
      </div>
    </div>
  );
}
