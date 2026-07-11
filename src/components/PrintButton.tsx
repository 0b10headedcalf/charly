"use client";

export function PrintButton({ color }: { color: string }) {
  return (
    <button
      onClick={() => window.print()}
      className="no-print rounded-full px-5 py-2 text-sm font-bold text-white shadow-sm transition hover:opacity-90"
      style={{ backgroundColor: color }}
    >
      Save as PDF / print
    </button>
  );
}
