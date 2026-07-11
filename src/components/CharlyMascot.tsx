"use client";

import { useEffect, useState } from "react";

// Charly the mascot. The vector art is inlined so it paints on the very first
// render — no fetch, no placeholder flash. An effect probes for an animated
// gif (the top art tier) and upgrades to it if one exists. The probe runs in
// an effect (not img onError) because a 404 on a server-rendered <img> fires
// before hydration attaches React's handlers.
let gifExists: boolean | undefined; // module-level: probe once per page load

async function probeGif(): Promise<boolean> {
  if (gifExists !== undefined) return gifExists;
  gifExists = await new Promise<boolean>((resolve) => {
    const img = new Image();
    img.onload = () => resolve(true);
    img.onerror = () => resolve(false);
    img.src = "/charly.gif";
  });
  return gifExists;
}

export function CharlyMascot({ size = 96 }: { size?: number }) {
  const [gif, setGif] = useState(false);

  useEffect(() => {
    let cancelled = false;
    probeGif().then((found) => {
      if (!cancelled && found) setGif(true);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  if (!gif) return <CharlyVector size={size} />;
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src="/charly.gif"
      alt="Charly the mascot"
      width={size}
      height={size}
      style={{ imageRendering: "pixelated" }}
    />
  );
}

// Inline copy of public/charly.svg — keep the two in sync if the art changes.
function CharlyVector({ size }: { size: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      role="img"
      aria-label="Charly the mascot"
    >
      {/* body: smooth heart, same palette as the pixel art */}
      <path
        d="M32 57
           C 13 47, 5 35, 5 24.5
           C 5 14.5, 12.5 8, 21 9.5
           C 26 10.4, 29.8 14, 32 18.5
           C 34.2 14, 38 10.4, 43 9.5
           C 51.5 8, 59 14.5, 59 24.5
           C 59 35, 51 47, 32 57 Z"
        fill="#D95763"
        stroke="#000"
        strokeWidth="2.5"
        strokeLinejoin="round"
      />
      {/* soft top-left highlight */}
      <path
        d="M12 20 C 13 14.5, 18 11.5, 22.5 12.5 C 18.5 14.5, 15 17, 13.5 22 C 12.8 24.3, 11.6 22.5, 12 20 Z"
        fill="#E8798A"
        opacity="0.9"
      />
      {/* eyes: tall ovals with sparkles */}
      <ellipse cx="24" cy="24.5" rx="3.6" ry="5.2" fill="#000" />
      <ellipse cx="40" cy="24.5" rx="3.6" ry="5.2" fill="#000" />
      <circle cx="25.2" cy="22.6" r="1.3" fill="#FFF" />
      <circle cx="41.2" cy="22.6" r="1.3" fill="#FFF" />
      <circle cx="23.2" cy="26.6" r="0.7" fill="#FFF" />
      <circle cx="39.2" cy="26.6" r="0.7" fill="#FFF" />
      {/* open smile */}
      <path
        d="M26.5 34.5 Q 32 36 37.5 34.5 Q 36.5 40.5 32 40.5 Q 27.5 40.5 26.5 34.5 Z"
        fill="#FFF"
        stroke="#000"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      {/* blush */}
      <ellipse cx="16.5" cy="30" rx="2.6" ry="1.6" fill="#C1444F" opacity="0.55" />
      <ellipse cx="47.5" cy="30" rx="2.6" ry="1.6" fill="#C1444F" opacity="0.55" />
    </svg>
  );
}
