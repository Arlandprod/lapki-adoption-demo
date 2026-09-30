import { useEffect, useRef } from 'react';
import { X } from '@phosphor-icons/react';
import type { ReactNode } from 'react';

export default function Modal({ title, onClose, returnFocus, children }: {
  title: string; onClose: () => void; returnFocus: HTMLElement | null; children: ReactNode;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const heading = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    const element = dialog.current!;
    const previousOverflow = document.body.style.overflow;
    element.showModal();
    document.body.style.overflow = 'hidden';
    heading.current?.focus();
    return () => {
      element.close();
      document.body.style.overflow = previousOverflow;
      if (returnFocus?.isConnected) returnFocus.focus();
    };
  }, [returnFocus]);
  useEffect(() => { heading.current?.focus(); }, [title]);
  return <dialog ref={dialog} className="modal" aria-labelledby="modal-title"
    onCancel={event => { event.preventDefault(); onClose(); }}
    onClick={event => { if (event.target === event.currentTarget) onClose(); }}>
    <div className="modal-surface">
      <div className="modal-header">
        <h2 id="modal-title" ref={heading} tabIndex={-1}>{title}</h2>
        <button type="button" className="icon-button" aria-label="Закрыть окно" onClick={onClose}><X size={24} /></button>
      </div>
      {children}
    </div>
  </dialog>;
}
