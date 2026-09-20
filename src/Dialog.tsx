import { useEffect, useRef, type ReactNode } from "react";
export default function Dialog({
  title,
  children,
  onClose,
}: {
  title: string;
  children: ReactNode;
  onClose?: () => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    const dialog = ref.current!;
    dialog.showModal();
    return () => {
      dialog.close();
      previous?.focus();
    };
  }, []);
  return (
    <dialog
      ref={ref}
      aria-label={title}
      onCancel={(e) => {
        e.preventDefault();
        onClose?.();
      }}
    >
      <div className="dialog-heading">
        <h2>{title}</h2>
        {onClose && (
          <button
            className="icon-button"
            aria-label="Close dialog"
            onClick={onClose}
          >
            ×
          </button>
        )}
      </div>
      {children}
    </dialog>
  );
}
