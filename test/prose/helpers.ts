import type { DialogueLine } from "../../src/prose/types.js";

/** Builds a single DialogueLine directly, bypassing the parser, for detector unit tests. */
export function makeLine(text: string, sourceLine = 1, speaker?: string): DialogueLine {
  return speaker !== undefined
    ? { sourceLine, raw: `${speaker}: ${text}`, speaker, text }
    : { sourceLine, raw: text, text };
}

/** Builds several DialogueLines from plain strings, numbered sequentially from 1. */
export function makeLines(texts: string[]): DialogueLine[] {
  return texts.map((text, index) => makeLine(text, index + 1));
}
