import type { VariationLevel } from "./config";

export interface LineVariation {
  baselineShiftPx: number;
  indentOffsetPx: number;
  inkOpacity: number;
}

export interface WordVariation {
  spacingDeltaPx: number;
  baselineShiftPx: number;
}

/**
 * Deterministic 32-bit PRNG (Mulberry32) so identical seeds produce identical
 * variations across preview, print, PNG, and PDF exports.
 */
function mulberry32(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function hashTuple(
  seed: number,
  a: number,
  b: number,
  c: number
): number {
  let h = (seed ^ 0x811c9dc5) >>> 0;
  h = Math.imul(h ^ (a + 1), 0x01000193) >>> 0;
  h = Math.imul(h ^ (b + 17), 0x01000193) >>> 0;
  h = Math.imul(h ^ (c + 31), 0x01000193) >>> 0;
  return h >>> 0;
}

function signedRandom(rng: () => number): number {
  return rng() * 2 - 1;
}

export function getLineVariation(
  level: VariationLevel,
  seed: number,
  pageIndex: number,
  lineIndex: number
): LineVariation {
  if (level === "off") {
    return {
      baselineShiftPx: 0,
      indentOffsetPx: 0,
      inkOpacity: 1,
    };
  }

  const rng = mulberry32(hashTuple(seed, pageIndex, lineIndex, 101));
  const isModerate = level === "moderate";

  const maxBaseline = isModerate ? 0.85 : 0.4;
  const maxIndent = isModerate ? 1.6 : 0.75;
  const minOpacity = isModerate ? 0.89 : 0.94;

  return {
    baselineShiftPx: Number((signedRandom(rng) * maxBaseline).toFixed(2)),
    indentOffsetPx: Number((signedRandom(rng) * maxIndent).toFixed(2)),
    inkOpacity: Number(
      (minOpacity + rng() * (1 - minOpacity)).toFixed(3)
    ),
  };
}

export function getWordVariation(
  level: VariationLevel,
  seed: number,
  pageIndex: number,
  lineIndex: number,
  wordIndex: number
): WordVariation {
  if (level === "off") {
    return {
      spacingDeltaPx: 0,
      baselineShiftPx: 0,
    };
  }

  const rng = mulberry32(hashTuple(seed, pageIndex, lineIndex, wordIndex + 503));
  const isModerate = level === "moderate";

  const maxSpacingDelta = isModerate ? 1.15 : 0.55;
  const maxWordBaseline = isModerate ? 0.55 : 0.25;

  return {
    spacingDeltaPx: Number((signedRandom(rng) * maxSpacingDelta).toFixed(2)),
    baselineShiftPx: Number((signedRandom(rng) * maxWordBaseline).toFixed(2)),
  };
}
