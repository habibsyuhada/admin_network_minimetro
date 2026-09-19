export const DEVICE_NAMES = ["Client", "Server", "Database"];
export const DEVICE_CODES = ["PC", "SRV", "DB"];
export const DEVICE_COLORS = ["#85dfc0", "#a8b5fb", "#efb679"];
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
      ) : kind === 1 ? (
        <>
          <rect x="-14" y="-16" width="28" height="32" rx="3" fill="#252e46" />
          <path d="M-9 -7H3M-9 3H3M-9 11H3" />
          <circle cx="8" cy="-7" r="1" fill={color} />
          <circle cx="8" cy="3" r="1" fill={color} />
          <circle cx="8" cy="11" r="1" fill={color} />
        </>
      ) : (
        <>
          <path d="M-14 -10V11C-14 19 14 19 14 11V-10" fill="#3a3027" />
          <ellipse cy="-10" rx="14" ry="6" fill="#3a3027" />
          <path d="M-14 0C-14 8 14 8 14 0M-14 9C-14 17 14 17 14 9" />
        </>
      )}
      {!compact && (
        <circle cx="20" cy="-19" r="2.5" fill={color} stroke="#152b29" />
      )}
    </g>
  );
}
