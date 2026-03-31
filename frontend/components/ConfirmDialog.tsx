import React from 'react';

type ConfirmDialogProps = {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onClose: () => void;
};

const ConfirmDialog = ({
  isOpen,
  title,
  message,
  confirmLabel = 'OK',
  cancelLabel = 'Cancel',
  onConfirm,
  onClose,
}: ConfirmDialogProps) => {
  React.useEffect(() => {
    if (!isOpen) {
      return undefined;
    }

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleEscape);
    return () => {
      window.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, onClose]);

  if (!isOpen) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-[140] flex items-center justify-center bg-slate-950/55 p-4 backdrop-blur-[5px]"
      role="presentation"
      onClick={onClose}
    >
      <section
        className="relative w-full max-w-xl overflow-hidden rounded-[32px] border border-slate-200/80 bg-[linear-gradient(180deg,#ffffff_0%,#f8fbff_100%)] p-7 shadow-[0_34px_90px_rgba(15,23,42,0.30)] dark:border-slate-700 dark:bg-[linear-gradient(180deg,#0f172a_0%,#111827_100%)] sm:p-8"
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="pointer-events-none absolute -right-16 -top-16 h-44 w-44 rounded-full bg-sky-200/60 blur-3xl dark:bg-sky-500/10" />
        <div className="pointer-events-none absolute -bottom-20 right-10 h-36 w-36 rounded-full bg-indigo-200/40 blur-3xl dark:bg-indigo-500/10" />

        <div className="relative mb-8 flex items-start gap-4 sm:gap-5">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-[20px] bg-gradient-to-br from-sky-100 to-blue-100 text-2xl font-black text-sky-700 shadow-inner shadow-white/80 dark:from-sky-500/15 dark:to-blue-500/10 dark:text-sky-300 dark:shadow-none">
            !
          </div>
          <div className="min-w-0">
            <p className="text-[11px] font-extrabold uppercase tracking-[0.28em] text-sky-600 dark:text-sky-300">
              Confirmation
            </p>
            <h2 className="mt-2 text-[2rem] font-extrabold tracking-tight text-slate-900 dark:text-slate-100">
              {title}
            </h2>
            <p className="mt-3 max-w-lg text-base leading-7 text-slate-600 dark:text-slate-300">{message}</p>
          </div>
        </div>

        <div className="relative flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button
            type="button"
            className="inline-flex min-h-[56px] min-w-[160px] items-center justify-center rounded-[22px] border border-sky-100 bg-white/90 px-6 py-3 text-base font-extrabold text-slate-700 shadow-[0_12px_28px_rgba(148,163,184,0.14)] transition hover:-translate-y-[1px] hover:border-sky-200 hover:bg-sky-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-300 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700"
            onClick={onClose}
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            className="inline-flex min-h-[56px] min-w-[160px] items-center justify-center rounded-[22px] border border-sky-900/70 bg-[linear-gradient(135deg,#0b4f7a_0%,#0f6b94_100%)] px-6 py-3 text-base font-extrabold text-white shadow-[0_20px_38px_rgba(8,47,73,0.34)] transition hover:-translate-y-[1px] hover:bg-[linear-gradient(135deg,#0d5b89_0%,#1381b0_100%)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-300"
            onClick={onConfirm}
          >
            {confirmLabel}
          </button>
        </div>
      </section>
    </div>
  );
};

export default ConfirmDialog;
