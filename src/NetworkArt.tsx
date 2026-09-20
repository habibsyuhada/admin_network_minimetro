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
];
export function DeviceGlyph({
  kind,
  compact = false,
}: {
  kind: number;
  compact?: boolean;
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
      {kind === 0 ? (
        <>
          <rect x="-15" y="-13" width="30" height="21" rx="3" fill="#203c35" />
          <path d="M-8 15H8M0 8V15M-10 -7H0M-10 -2H6" />
        </>
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
