export const DEVICE_NAMES = [
  "Client",
  "YouTube",
  "Facebook",
  "Router",
  "Switch",
  "TikTok",
  "Instagram",
  "WhatsApp",
  "Netflix",
  "Spotify",
  "Cable Relay",
  "Wireless Bridge",
  "Cache Server",
  "Distribution Hub",
  "Service Gateway",
];
export const DEVICE_CODES = [
  "PC",
  "YT",
  "FB",
  "RTR",
  "SW",
  "TT",
  "IG",
  "WA",
  "NF",
  "SP",
  "RLY",
  "WIFI",
  "CACHE",
  "HUB",
  "GW",
];
export const DEVICE_COLORS = [
  "#85dfc0",
  "#ff6969",
  "#80aaff",
  "#f2d779",
  "#87dcff",
  "#6ff1e4",
  "#ed91d4",
  "#7cde94",
  "#f37a83",
  "#8de89a",
  "#c3cbd0",
  "#e2ce74",
  "#87cbea",
  "#cea6ff",
  "#ffa8d0",
];
export function DeviceGlyph({
  kind,
  compact = false,
  variant = 0,
}: {
  kind: number;
  compact?: boolean;
  variant?: number;
}) {
  const color = DEVICE_COLORS[kind];
  return (
    <g
      className="device-glyph"
      stroke={color}
      strokeWidth={compact ? 2.4 : 1.8}
      fill="none"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {!compact && (
        <rect
          className="device-housing"
          x="-25"
          y="-24"
          width="50"
          height="48"
          rx="10"
          fill="#152b29"
          stroke="#37534e"
        />
      )}
      {kind >= 10 ? (
        <>
          <rect x="-17" y="-15" width="34" height="30" rx="5" />
          {kind === 10 ? (
            <path d="M-12 0H12M-6 -5L-11 0L-6 5M6 -5L11 0L6 5" />
          ) : kind === 11 ? (
            <>
              <path d="M-13 -5Q0 -18 13 -5M-8 0Q0 -8 8 0M-3 5Q0 2 3 5" />
              <circle cy="10" r="1" />
            </>
          ) : kind === 12 ? (
            <>
              <path d="M-10 -7H10M-10 0H10M-10 7H4" />
              <circle cx="11" cy="8" r="2" />
            </>
          ) : kind === 13 ? (
            <>
              <circle r="5" />
              <path d="M0 -5V-12M0 5V12M-5 0H-13M5 0H13M-4 -4L-10 -10M4 4L10 10" />
            </>
          ) : (
            <>
              <circle r="10" />
              <path d="M-10 0H10M0 -10Q-9 0 0 10Q9 0 0 -10" />
            </>
          )}
        </>
      ) : kind === 0 ? (
        <ClientGlyph variant={variant} />
      ) : kind === 3 ? (
        <>
          <rect x="-17" y="-10" width="34" height="23" rx="5" fill="#3c3724" />
          <path d="M-12 -10V-19M12 -10V-19M-10 0H10M-6 -4L-10 0L-6 4M6 -4L10 0L6 4" />
          <path d="M-10 8H-8M-2 8H0M6 8H8" />
        </>
      ) : kind === 4 ? (
        <>
          <rect x="-18" y="-11" width="36" height="23" rx="4" fill="#193849" />
          {[-12, -4, 4, 12].map((x) => (
            <rect key={x} x={x - 2} y="-4" width="4" height="5" rx=".5" />
          ))}
          <path d="M-12 7H-8M-2 7H2M8 7H12" />
        </>
      ) : kind === 1 ? (
        <>
          <rect
            x="-18"
            y="-12"
            width="36"
            height="24"
            rx="7"
            fill={color}
            stroke="none"
          />
          <path d="M-5 -7L8 0L-5 7Z" fill="#fff" stroke="none" />
        </>
      ) : kind === 2 ? (
        <path
          d="M7 -17H2C-5 -17 -7 -12 -7 -6V-2H-12V5H-7V18H1V5H7L9 -2H1V-6C1 -9 2 -10 5 -10H7Z"
          fill={color}
          stroke="none"
        />
      ) : kind === 5 ? (
        <>
          <path
            d="M4 -16V7A8 8 0 1 1 -3 -1"
            stroke="#f58dca"
            strokeWidth="5"
            transform="translate(2,1)"
          />
          <path
            d="M4 -16C4 -8 9 -6 15 -6M4 -16V7A8 8 0 1 1 -3 -1"
            strokeWidth="4"
          />
        </>
      ) : kind === 6 ? (
        <>
          <rect x="-15" y="-15" width="30" height="30" rx="8" />
          <circle r="7" />
          <circle cx="9" cy="-9" r="1.5" fill={color} />
        </>
      ) : kind === 7 ? (
        <>
          <path d="M-12 10A16 16 0 1 1 -7 14L-17 17Z" />
          <path
            d="M-7 -8C-8 0 -1 7 7 8L10 3L4 0L1 3L-3 -1L0 -4Z"
            fill={color}
            stroke="none"
          />
        </>
      ) : kind === 8 ? (
        <>
          <path d="M-10 17V-17L10 17V-17" strokeWidth="7" />
        </>
      ) : (
        <>
          <circle r="17" fill={color} stroke="none" />
          <path
            d="M-11 -6Q0 -11 12 -4M-9 0Q1 -4 10 3M-7 6Q0 3 7 7"
            stroke="#153425"
            strokeWidth="2.5"
          />
        </>
      )}
      {!compact && (
        <circle cx="20" cy="-19" r="2.5" fill={color} stroke="#152b29" />
      )}
    </g>
  );
}

function ClientGlyph({ variant }: { variant: number }) {
  switch (variant) {
    case 1:
      return (
        <>
          <rect x="-14" y="-13" width="28" height="19" rx="2" />
          <path d="M-14 6L-19 13H19L14 6ZM-4 10H4" />
        </>
      );
    case 2:
      return (
        <>
          <rect x="-9" y="-18" width="18" height="36" rx="4" />
          <path d="M-3 -13H3M-2 13H2" />
        </>
      );
    case 3:
      return (
        <>
          <rect x="-14" y="-18" width="28" height="36" rx="4" />
          <path d="M-8 -12H8V10H-8ZM-2 14H2" />
        </>
      );
    case 4:
      return (
        <>
          <path d="M-10 -8H10Q17 -8 19 10Q18 17 9 8H-9Q-18 17 -19 10Q-17 -8 -10 -8Z" />
          <path d="M-10 -3V5M-14 1H-6" />
          <circle cx="10" cy="-1" r="1.5" />
          <circle cx="14" cy="3" r="1.5" />
        </>
      );
    case 5:
      return (
        <>
          <rect x="-18" y="-13" width="36" height="25" rx="2" />
          <path d="M-11 12L-15 17M11 12L15 17M-4 -7L6 -1L-4 5Z" />
        </>
      );
    case 6:
      return (
        <>
          <path d="M-10 -6V-17H10V-6M-11 8H-17V-6H17V8H11M-10 3H10V17H-10ZM-5 8H5M-5 12H5" />
          <circle cx="12" cy="-1" r="1" />
        </>
      );
    case 7:
      return (
        <>
          <path d="M-16 -12H7L16 -4L11 6L-17 -2ZM-4 3V13H13M-12 -15H9" />
          <circle cx="9" cy="-1" r="2" />
        </>
      );
    case 8:
      return (
        <>
          <path d="M-7 -9L-5 -19H5L7 -9M-7 9L-5 19H5L7 9" />
          <rect x="-11" y="-10" width="22" height="20" rx="6" />
          <path d="M0 -5V0L4 3" />
        </>
      );
    case 9:
      return (
        <>
          <rect x="-11" y="-17" width="22" height="34" rx="9" />
          <ellipse cy="-10" rx="7" ry="3" />
          <path d="M-6 0H6M-6 5H6M-5 10H5" />
        </>
      );
    case 10:
      return (
        <>
          <path d="M-11 -18H11V7H-11ZM-7 7L-11 18H11L7 7M-6 -12H6V0H-6" />
        </>
      );
    case 11:
      return (
        <>
          <rect x="-18" y="-10" width="36" height="22" rx="8" />
          <path d="M-10 12L-5 5H5L10 12M-18 -4L-22 -8M18 -4L22 -8" />
          <circle cx="-8" cy="-2" r="4" />
          <circle cx="8" cy="-2" r="4" />
        </>
      );
    case 12:
      return (
        <>
          <rect x="-20" y="-12" width="40" height="24" rx="8" />
          <rect x="-10" y="-8" width="20" height="16" rx="2" />
          <path d="M-15 -3V3M-18 0H-12" />
          <circle cx="15" cy="-2" r="1" />
          <circle cx="15" cy="3" r="1" />
        </>
      );
    case 13:
      return (
        <>
          <rect x="-15" y="-11" width="30" height="22" rx="5" />
          <path d="M-9 -5H9M-9 1H2M-9 6H-4" />
          <circle cx="9" cy="5" r="2" />
        </>
      );
    case 14:
      return (
        <>
          <rect x="-20" y="-13" width="26" height="20" rx="2" />
          <path d="M-13 13H-1M-7 7V13" />
          <rect x="10" y="-16" width="11" height="31" rx="2" />
          <path d="M13 -10H18M13 -5H18" />
          <circle cx="15.5" cy="9" r="1" />
        </>
      );
    case 15:
      return (
        <>
          <path d="M-14 -14H12V1H-14ZM-10 1L-17 13H17L8 1M-6 6H7M-9 10H10M0 -14V-19" />
        </>
      );
    default:
      return (
        <>
          <rect x="-15" y="-13" width="30" height="21" rx="3" fill="#203c35" />
          <path d="M-8 15H8M0 8V15M-10 -7H0M-10 -2H6" />
        </>
      );
  }
}
