type IconProps = { category: string; className?: string };

export function CategoryIcon({ category, className }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      {iconPaths(category)}
    </svg>
  );
}

function iconPaths(category: string) {
  switch (category) {
    case "떡":
      return (
        <>
          <rect x="5" y="4" width="14" height="5" rx="2.5" />
          <rect x="4" y="10" width="16" height="5" rx="2.5" />
          <rect x="3" y="16" width="18" height="5" rx="2.5" />
        </>
      );
    case "반찬":
      return (
        <>
          <path d="M3 11h18a9 9 0 0 1-18 0Z" />
          <path d="M8 7c0-1.5 1-2 1-3.5M12 7c0-1.5 1-2 1-3.5M16 7c0-1.5 1-2 1-3.5" />
        </>
      );
    case "청과·채소":
      return (
        <>
          <path d="M12 8c-4-2-8 1-7 6s4 8 7 7c3 1 6-2 7-7s-3-8-7-6Z" />
          <path d="M12 8c0-2 1-4 3-5" />
        </>
      );
    case "정육·수산":
      return (
        <>
          <path d="M2 12c3-5 9-6 14-3l5-3v12l-5-3c-5 3-11 2-14-3Z" />
          <circle cx="7.5" cy="11" r="0.8" fill="currentColor" />
        </>
      );
    case "분식·간식":
      return (
        <>
          <path d="M7 3v8M5 3v5a2 2 0 0 0 4 0V3M7 11v10" />
          <path d="M17 3c-2 0-3 2.5-3 5s1 3 3 3 3-.5 3-3-1-5-3-5ZM17 11v10" />
        </>
      );
    case "닭강정":
      return (
        <>
          <path d="M14 4a6 6 0 0 1 4 10c-2 2-5 2-7 1l-4 4" />
          <path d="M14 4a6 6 0 0 0-4 8l-3 3" />
          <path d="M5 17a2 2 0 1 0 2 2M5 13a2 2 0 1 0 2-2" />
        </>
      );
    case "순대·족발·전":
      return (
        <>
          <path d="M4 10h16v3a6 6 0 0 1-6 6h-4a6 6 0 0 1-6-6v-3Z" />
          <path d="M2 10h20M9 6c0-1 .7-1.5.7-2.5M14 6c0-1 .7-1.5.7-2.5" />
        </>
      );
    case "수변":
      return (
        <>
          <path d="M12 3c.6 4.2 2.8 6.4 7 7-4.2.6-6.4 2.8-7 7-.6-4.2-2.8-6.4-7-7 4.2-.6 6.4-2.8 7-7Z" fill="currentColor" />
          <path d="M19 15.5c.3 1.5 1 2.2 2.5 2.5-1.5.3-2.2 1-2.5 2.5-.3-1.5-1-2.2-2.5-2.5 1.5-.3 2.2-1 2.5-2.5Z" fill="currentColor" />
          <path d="M5 2.5c.2 1 .8 1.6 1.8 1.8-1 .2-1.6.8-1.8 1.8-.2-1-.8-1.6-1.8-1.8 1-.2 1.6-.8 1.8-1.8Z" fill="currentColor" />
        </>
      );
    default:
      return (
        <>
          <path d="M5 8h14l-1.2 12H6.2L5 8Z" />
          <path d="M9 8V6a3 3 0 0 1 6 0v2" />
        </>
      );
  }
}
