import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { DeviceGlyph } from "./NetworkArt";
const tips = [
  ["Drag to connect", "Choose a cable, then drag between two devices."],
  [
    "Match the packet icon",
    "Each cable has a carrier. Full? Packets wait for its next trip.",
  ],
  ["Build a junction", "Place a router, move the preview, then tap OK."],
  [
    "Watch the red pulse",
    "Clear a full queue within 25 seconds. Tap edge arrows to find hidden nodes.",
  ],
  [
    "Earn and upgrade",
    "Profit minus upkeep is your income. Buy one item at month end, then equip it.",
  ],
  [
    "Pause and explore",
    "Pause to build. Drag empty space to pan. Pinch or use + / - to zoom.",
  ],
];
function Node({ kind, x, y }: { kind: number; x: number; y: number }) {
  return (
    <g transform={`translate(${x},${y})`}>
      <DeviceGlyph kind={kind} />
    </g>
  );
}
export default function VisualGuide() {
  const [step, setStep] = useState(0);
  return (
    <section className="visual-guide" aria-label="Visual tutorial">
      <div className="guide-art" role="img" aria-label={tips[step].join(". ")}>
        <svg viewBox="0 0 320 185" aria-hidden="true">
          {step < 3 && (
            <>
              <path
                d={step === 2 ? "M55 45 160 95 265 45M160 95v55" : "M55 95H265"}
                stroke="#64c7ba"
                strokeWidth="6"
                fill="none"
                strokeDasharray={step === 0 ? "9 5" : undefined}
              />
              <Node
                kind={0}
                x={step === 2 ? 55 : 45}
                y={step === 2 ? 45 : 95}
              />
              <Node
                kind={step === 0 ? 3 : 1}
                x={275}
                y={step === 2 ? 45 : 95}
              />
              {step === 0 && (
                <>
                  <text x="160" y="40">
                    DRAG
                  </text>
                  <path
                    d="M116 142h87m-10-8 10 8-10 8"
                    stroke="#d7ecbc"
                    fill="none"
                    strokeWidth="3"
                  />
                  <circle cx="116" cy="142" r="9" fill="#d7ecbc" />
                </>
              )}
              {step === 1 && (
                <>
                  <rect
                    x="123"
                    y="72"
                    width="74"
                    height="46"
                    rx="11"
                    fill="#65bcac"
                  />
                  <g transform="translate(141 92) scale(.35)">
                    <DeviceGlyph kind={1} />
                  </g>
                  <text x="177" y="101" className="dark-label">
                    3/4
                  </text>
                  <text x="160" y="45">
                    BACK AND FORTH
                  </text>
                  <path
                    d="m135 143 8-6m-8 6 8 6m-8-6h50m-8-6 8 6-8 6"
                    stroke="#d7ecbc"
                    strokeWidth="2"
                    fill="none"
                  />
                </>
              )}
              {step === 2 && (
                <>
                  <Node kind={3} x={160} y={95} />
                  <Node kind={2} x={160} y={153} />
                  <circle
                    cx="160"
                    cy="95"
                    r="37"
                    stroke="#b9f595"
                    strokeDasharray="5 4"
                    fill="none"
                  />
                  <rect
                    x="236"
                    y="130"
                    width="60"
                    height="34"
                    rx="10"
                    fill="#b9f595"
                  />
                  <text x="266" y="152" className="dark-label">
                    OK
                  </text>
                </>
              )}
            </>
          )}
          {step === 3 && (
            <>
              <circle
                cx="125"
                cy="93"
                r="55"
                stroke="#ff7777"
                opacity=".4"
                fill="none"
              />
              <circle
                cx="125"
                cy="93"
                r="42"
                stroke="#ff7777"
                strokeWidth="3"
                fill="none"
              />
              <Node kind={0} x={125} y={93} />
              <text x="125" y="25">
                25s
              </text>
              {[0, 1, 2, 3, 4].map((i) => (
                <rect
                  key={i}
                  x={80 + i * 19}
                  y="156"
                  width="14"
                  height="14"
                  rx="3"
                  fill="#ff7777"
                />
              ))}
              <rect
                x="252"
                y="65"
                width="46"
                height="54"
                rx="12"
                fill="#294238"
                stroke="#ff7777"
              />
              <text x="275" y="99">
                ↗ !
              </text>
            </>
          )}
          {step === 4 && (
            <>
              <rect
                x="20"
                y="23"
                width="280"
                height="77"
                rx="14"
                fill="#29473c"
              />
              <text x="76" y="49">
                PROFIT
              </text>
              <text x="242" y="49">
                UPKEEP
              </text>
              <text x="160" y="81" className="equation">
                500 - 200 = 300
              </text>
              <rect
                x="26"
                y="125"
                width="60"
                height="42"
                rx="10"
                fill="#446352"
              />
              <text x="56" y="151">
                ITEM
              </text>
              <path
                d="M100 146h118m-10-8 10 8-10 8"
                stroke="#b9f595"
                fill="none"
                strokeWidth="3"
              />
              <Node kind={3} x={266} y={145} />
            </>
          )}
          {step === 5 && (
            <>
              <rect
                x="34"
                y="32"
                width="80"
                height="110"
                rx="20"
                fill="#28463b"
                stroke="#658b78"
              />
              <path d="M61 64v45m25-45v45" stroke="#b9f595" strokeWidth="10" />
              <text x="74" y="169">
                PAUSE
              </text>
              <path
                d="M165 85h102m-10-9 10 9-10 9m-82-9-10 9 10 9M215 34v102m-9-92 9-10 9 10m-18 82 9 10 9-10"
                stroke="#a6d6d4"
                strokeWidth="3"
                fill="none"
              />
              <text x="216" y="169">
                PAN / ZOOM
              </text>
            </>
          )}
        </svg>
      </div>
      <h3>{tips[step][0]}</h3>
      <p>{tips[step][1]}</p>
      <nav className="guide-navigation" aria-label="Tutorial pages">
        <button
          aria-label="Previous tip"
          disabled={step === 0}
          onClick={() => setStep(step - 1)}
        >
          <ChevronLeft size={20} />
        </button>
        <div className="guide-dots">
          {tips.map((tip, i) => (
            <button
              key={tip[0]}
              aria-label={`Tip ${i + 1}: ${tip[0]}`}
              aria-current={i === step ? "step" : undefined}
              onClick={() => setStep(i)}
            >
              <span />
            </button>
          ))}
        </div>
        <button
          aria-label="Next tip"
          disabled={step === 5}
          onClick={() => setStep(step + 1)}
        >
          <ChevronRight size={20} />
        </button>
      </nav>
    </section>
  );
}
