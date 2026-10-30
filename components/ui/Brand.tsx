/** Shared, theme-aware wordmark. Keep the mark crisp at navigation sizes. */
export function Brand() {
  return (
    <span className="cg-brand">
      <svg viewBox="0 0 40 40" aria-hidden="true" focusable="false">
        <g stroke="var(--border-strong)" strokeWidth="1.5">
          <path d="M20 20 10 6M20 20 30 6M20 20 36 20M20 20 30 34M20 20 10 34M20 20 4 20" />
        </g>
        <g fill="var(--text-secondary)">
          <circle cx="10" cy="6" r="3" />
          <circle cx="30" cy="6" r="3" />
          <circle cx="36" cy="20" r="3" />
          <circle cx="30" cy="34" r="3" />
          <circle cx="10" cy="34" r="3" />
          <circle cx="4" cy="20" r="3" />
        </g>
        <circle cx="20" cy="20" r="6" fill="var(--accent)" />
      </svg>
      <span>ContextGraph</span>
    </span>
  );
}
