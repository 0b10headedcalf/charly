"use client";

import { useState } from "react";
import type { Heatmap } from "@/lib/sfdata";

// SF bounding box for the projection (degrees)
const MIN_LNG = -122.525;
const MAX_LNG = -122.35;
const MIN_LAT = 37.7;
const MAX_LAT = 37.835;
const W = 640;
// aspect corrected for latitude (1° lng is shorter than 1° lat at 37.8°N)
const H = Math.round((W * ((MAX_LAT - MIN_LAT) / ((MAX_LNG - MIN_LNG) * Math.cos((37.77 * Math.PI) / 180)))));

const LAYER_COLOR: Record<string, string> = {
  environment: "#2e9e6b",
  housing: "#e5543f",
};

const LANDMARKS: { name: string; lat: number; lng: number }[] = [
  { name: "Golden Gate Park", lat: 37.769, lng: -122.483 },
  { name: "Mission", lat: 37.759, lng: -122.418 },
  { name: "SoMa", lat: 37.778, lng: -122.404 },
  { name: "Tenderloin", lat: 37.7835, lng: -122.414 },
  { name: "Sunset", lat: 37.749, lng: -122.494 },
  { name: "Bayview", lat: 37.729, lng: -122.388 },
];

const px = (lng: number) => ((lng - MIN_LNG) / (MAX_LNG - MIN_LNG)) * W;
const py = (lat: number) => ((MAX_LAT - lat) / (MAX_LAT - MIN_LAT)) * H;

export function CityHeatmap({ heat }: { heat: Heatmap }) {
  const [active, setActive] = useState(heat.layers[0]?.groupId ?? "housing");
  const layer = heat.layers.find((l) => l.groupId === active) ?? heat.layers[0];
  if (!layer) return null;

  const color = LAYER_COLOR[layer.groupId] ?? "#8a6a54";
  const cells = layer.cells.filter(
    (c) =>
      c.la / 200 >= MIN_LAT && c.la / 200 <= MAX_LAT && c.lo / 200 >= MIN_LNG && c.lo / 200 <= MAX_LNG
  );
  const max = Math.max(...cells.map((c) => c.n), 1);
  const total = cells.reduce((acc, c) => acc + c.n, 0);
  // log scale: report counts are heavily skewed toward a few hot blocks
  const intensity = (n: number) => 0.14 + 0.86 * (Math.log(1 + n) / Math.log(1 + max));
  const cellW = (0.005 / (MAX_LNG - MIN_LNG)) * W;
  const cellH = (0.005 / (MAX_LAT - MIN_LAT)) * H;

  return (
    <section className="mt-6 rounded-xl bg-white/80 p-5 shadow-sm">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <div>
          <h2 className="text-lg font-bold">Need map</h2>
          <p className="text-sm text-clay">
            Every SF311 report from the last 30 days, on a ~500m grid.{" "}
            {heat.source === "live" ? "Live from DataSF." : "DataSF snapshot."}
          </p>
        </div>
        <div className="flex gap-1.5">
          {heat.layers.map((l) => (
            <button
              key={l.groupId}
              onClick={() => setActive(l.groupId)}
              className={`rounded-full border-2 px-3 py-1 text-xs font-bold transition ${
                l.groupId === active
                  ? "border-transparent text-white"
                  : "border-ink/15 bg-white text-ink hover:border-ink/30"
              }`}
              style={l.groupId === active ? { backgroundColor: LAYER_COLOR[l.groupId] } : undefined}
            >
              {l.groupId === "housing" ? "Housing signals" : "Environment signals"}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-3 overflow-x-auto">
        <svg
          viewBox={`0 0 ${W} ${H}`}
          className="h-auto w-full min-w-[480px] rounded-lg"
          style={{ background: "#fdf6e7" }}
          role="img"
          aria-label={`Heatmap of ${layer.label} reports across San Francisco`}
        >
          {/* basemap stitched to the exact bbox above (see scripts/make-sf-map.py) */}
          <image href="/sf-map.png" x={0} y={0} width={W} height={H} preserveAspectRatio="none" />
          {cells.map((c) => {
            const lat = c.la / 200;
            const lng = c.lo / 200;
            return (
              <rect
                key={`${c.la}:${c.lo}`}
                x={px(lng) - cellW / 2 + 0.5}
                y={py(lat) - cellH / 2 + 0.5}
                width={cellW - 1}
                height={cellH - 1}
                rx={2.5}
                fill={color}
                opacity={intensity(c.n)}
                style={{ mixBlendMode: "multiply" }}
              >
                <title>{`${c.n.toLocaleString()} reports near ${lat.toFixed(3)}, ${lng.toFixed(3)}`}</title>
              </rect>
            );
          })}
          {LANDMARKS.map((m) => (
            <g key={m.name} pointerEvents="none">
              <text
                x={px(m.lng)}
                y={py(m.lat)}
                textAnchor="middle"
                fontSize={12}
                fontWeight={700}
                fill="#3b2a20"
                stroke="#fff6e9"
                strokeWidth={3}
                paintOrder="stroke"
                opacity={0.85}
              >
                {m.name}
              </text>
            </g>
          ))}
        </svg>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-4 text-xs text-clay">
        <span>
          <span className="font-bold text-ink">{total.toLocaleString()}</span> {layer.label.toLowerCase()} reports
        </span>
        <span className="flex items-center gap-1.5">
          fewer
          <span
            className="inline-block h-2.5 w-24 rounded-full"
            style={{
              background: `linear-gradient(to right, ${color}24, ${color})`,
            }}
          />
          more (log scale)
        </span>
        <span>Hover a block for its count · source: data.sfgov.org · map © OpenStreetMap, © CARTO</span>
      </div>
    </section>
  );
}
