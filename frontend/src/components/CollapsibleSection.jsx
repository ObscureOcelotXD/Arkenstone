import { useState } from "react";

export default function CollapsibleSection({ title, children, defaultOpen = true }) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <section className="section collapsible-section">
      <button
        type="button"
        className="section-header"
        onClick={() => setIsOpen((o) => !o)}
        aria-expanded={isOpen}
      >
        <h2 className="section-title">{title}</h2>
        <span className="section-chevron" aria-hidden>
          {isOpen ? "▼" : "▶"}
        </span>
      </button>
      {isOpen && <div className="section-content">{children}</div>}
    </section>
  );
}
