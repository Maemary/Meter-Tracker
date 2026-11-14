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
      // Laptops: jump straight to the field you'll type in first.
      // Phones: don't, because focusing pops the keyboard up before you've
      // even seen the form.
      if (window.matchMedia('(pointer: fine)').matches) {
        dialog.querySelector<HTMLElement>('[data-autofocus]')?.focus()
      }
    }
    if (!open && dialog.open) dialog.close()
  }, [open])

  // Stop the page behind from scrolling while the pop-up is open
  // (works on every browser, unlike the CSS-only version)
  useEffect(() => {
    if (!open) return
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = previous
    }
  }, [open])

  return (
    <dialog
      ref={ref}
      className="modal"
      aria-label={label}
      onClose={onClose}
      // Phones: when you tap a field and the keyboard slides up, scroll that
      // field into view inside the pop-up so it isn't hidden behind it
      onFocus={(e) => {
        const field = e.target
        if (!(field instanceof HTMLInputElement || field instanceof HTMLSelectElement)) return
        setTimeout(() => field.scrollIntoView({ block: 'center', behavior: 'smooth' }), 300)
      }}
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
