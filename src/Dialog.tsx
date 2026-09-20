import {
  Children,
  isValidElement,
  useEffect,
  useRef,
  type ReactNode,
} from "react";
export default function Dialog({
  title,
  children,
  onClose,
}: {
  title: string;
  children: ReactNode;
  onClose?: () => void;
}) {
  // Direct action buttons belong to the fixed footer; nested catalog actions scroll.
  const parts = Children.toArray(children);
  const isAction = (child: ReactNode) =>
    isValidElement(child) && child.type === "button";
  const actions = parts.filter(isAction);
  const body = parts.filter((child) => !isAction(child));
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
      <div className="dialog-body">{body}</div>
      <footer className="dialog-footer">
        {actions.length ? (
          actions
        ) : onClose ? (
          <button className="primary" onClick={onClose}>
            Done
          </button>
        ) : null}
      </footer>
    </dialog>
  );
}
