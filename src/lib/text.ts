/**
 * Display helpers for copy. They change presentation only, never the owner's wording.
 */

/**
 * Splits a heading so its last word can take the Arch direction's italic accent:
 * "Made to be shared" → { lead: "Made to be", accent: "shared" }.
 */
export function splitAccent(text: string): { lead: string; accent: string } {
  const trimmed = text.trim();
  const cut = trimmed.lastIndexOf(' ');
  return cut === -1 ? { lead: '', accent: trimmed } : { lead: trimmed.slice(0, cut), accent: trimmed.slice(cut + 1) };
}

/**
 * Menu descriptions are printed as "Carrots/leeks/onions"; this only adds breathing room
 * around the slashes ("Carrots / leeks / onions") so lines can wrap. Wording is unchanged.
 */
export const spaceSlashes = (text: string): string => text.replace(/\s*\/\s*/g, ' / ');

/** Two-digit counter for editorial numbering: 2 → "02". */
export const pad2 = (value: number): string => String(value).padStart(2, '0');
