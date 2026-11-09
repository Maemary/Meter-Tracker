import { useEffect, useRef, type ReactNode } from 'react'

type Props = {
  open: boolean
  onClose: () => void
  label: string
  children: ReactNode
}

// A pop-up built on the browser's own <dialog>: it dims and blurs the page
// behind it, traps keyboard focus inside, and closes with the Esc key.
export function Modal({ open, onClose, label, children }: Props) {
  const ref = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    const dialog = ref.current
    if (!dialog) return
    if (open && !dialog.open) {
      dialog.showModal()
      // Jump straight to the field you'll type in first
      dialog.querySelector<HTMLElement>('[data-autofocus]')?.focus()
    }
    if (!open && dialog.open) dialog.close()
  }, [open])

  return (
    <dialog
      ref={ref}
      className="modal"
      aria-label={label}
      onClose={onClose}
      // A click that lands on the dialog itself (not its contents) is a
      // click on the blurred backdrop: close.
      onClick={(e) => {
        if (e.target === ref.current) onClose()
      }}
    >
      <button className="modal-close" onClick={onClose} aria-label="Close">
        ×
      </button>
      {/* Only render the form while open, so it starts fresh each time */}
      {open && children}
    </dialog>
  )
}
