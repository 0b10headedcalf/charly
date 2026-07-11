"use client";

import { useState } from "react";

// Charli the mascot. Drop your Aseprite export at public/charli.gif and it
// renders automatically (pixel-crisp, no smoothing). Until that file exists,
// the placeholder SVG below is shown instead.
export function CharliMascot({ size = 96 }: { size?: number }) {
  // SVG shows immediately; swaps to the gif only once it actually loads,
  // so there's no broken-image flash while the gif doesn't exist yet.
  const [gifReady, setGifReady] = useState(false);

  return (
    <>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/charli.gif"
        alt="Charli the mascot"
        width={size}
        height={size}
        style={{ imageRendering: "pixelated", display: gifReady ? "block" : "none" }}
        onLoad={() => setGifReady(true)}
      />
      {!gifReady && <PlaceholderCharli size={size} />}
    </>
  );
}

function PlaceholderCharli({ size }: { size: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      role="img"
      aria-label="Charli the mascot"
    >
      {/* body: rounded flame/heart blob */}
      <path
        d="M50 94 C22 80 10 62 12 44 C14 28 28 20 38 26 C43 29 47 34 50 40 C53 34 57 29 62 26 C72 20 86 28 88 44 C90 62 78 80 50 94 Z"
        fill="#FF6B57"
        stroke="#E5543F"
        strokeWidth="2.5"
      />
      {/* flame tuft */}
      <path
        d="M50 40 C46 30 47 20 54 12 C54 20 60 22 60 30 C60 36 56 39 50 40 Z"
        fill="#FFAF2E"
        stroke="#E8960C"
        strokeWidth="2"
      />
      {/* eyes */}
      <circle cx="38" cy="56" r="4.5" fill="#3B2A20" />
      <circle cx="62" cy="56" r="4.5" fill="#3B2A20" />
      <circle cx="39.5" cy="54.5" r="1.5" fill="#FFF6E9" />
      <circle cx="63.5" cy="54.5" r="1.5" fill="#FFF6E9" />
      {/* smile */}
      <path
        d="M40 68 Q50 78 60 68"
        fill="none"
        stroke="#3B2A20"
        strokeWidth="3"
        strokeLinecap="round"
      />
      {/* blush */}
      <circle cx="29" cy="64" r="4" fill="#FFAF2E" opacity="0.55" />
      <circle cx="71" cy="64" r="4" fill="#FFAF2E" opacity="0.55" />
    </svg>
  );
}
