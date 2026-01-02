'use client';

type ModalProps = {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
  ariaLabel?: string;
};

export function Modal({ open, onClose, children, ariaLabel }: ModalProps) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center animate-fadeIn"
      role="dialog"
      aria-modal="true"
      aria-label={ariaLabel || 'modal'}
    >
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm transition-opacity duration-300"
        onClick={onClose}
      />

      <div className="relative z-10 max-w-5xl w-full mx-4 animate-slideIn">
        <div className="transform transition-all duration-300 scale-100">
          {children}
        </div>
      </div>
    </div>
  );
}


