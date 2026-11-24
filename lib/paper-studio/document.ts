export type DocumentBlockType =
  | "paragraph"
  | "h1"
  | "h2"
  | "bullet"
  | "numbered"
  | "blank"
  | "page-break";

export interface InlineRun {
  text: string;
  bold: boolean;
  italic: boolean;
  underline: boolean;
}

export interface DocumentBlock {
  id: string;
  type: DocumentBlockType;
  runs: InlineRun[];
  listMarker?: string;
}

export interface DocumentStats {
  characterCount: number;
  characterCountNoSpaces: number;
  wordCount: number;
  lineCount: number;
  explicitPageBreaks: number;
}

export const PAGE_BREAK_DELIMITER = "---pagebreak---";

export const SAMPLE_HANDWRITING_DOCUMENT = `# Weekly Reading & Project Notes

Prepared with **BinRo Paper Studio** for clear, comfortable offline reading and printable reference sheets.

## Key Priorities for This Week
- Review accessibility guidelines for *printed study handouts* and large-type notes.
- Organise **core project milestones** into concise one-page summaries.
- Test __A4 ruled layout__ spacing before printing personal reference copies.

## Action Checklist
1. Outline main ideas in plain paragraphs first.
2. Highlight important dates or reminders using **bold** or __underline__.
3. Keep generous margins so pages stay uncluttered and easy to annotate.

Feel free to edit, paste your own notes, or clear this sample to start a fresh page.`;

const PAGE_BREAK_REGEX =
  /^\s*(?:---+\s*page\s*break\s*---+|===+\s*page\s*break\s*===+)\s*$/i;

/**
 * Parse inline markdown-lite formatting (**bold**, *italic*, __underline__)
 * while leaving unmatched delimiters or math/snake_case expressions intact.
 */
export function parseInlineFormatting(
  input: string,
  inherited: { bold: boolean; italic: boolean; underline: boolean } = {
    bold: false,
    italic: false,
    underline: false,
  }
): InlineRun[] {
  if (!input) return [];

  const runs: InlineRun[] = [];
  let i = 0;
  let buffer = "";

  const flushBuffer = () => {
    if (buffer.length > 0) {
      runs.push({
        text: buffer,
        bold: inherited.bold,
        italic: inherited.italic,
        underline: inherited.underline,
      });
      buffer = "";
    }
  };

  const findClosingDelimiter = (delim: string, fromIndex: number): number => {
    let idx = fromIndex;
    while (idx <= input.length - delim.length) {
      if (input.startsWith(delim, idx)) {
        const prevChar = idx > 0 ? input[idx - 1] : "";
        // Closing delimiter must not immediately follow whitespace
        if (prevChar && !/\s/.test(prevChar)) {
          // For single "*", make sure it's not part of "**"
          if (delim === "*" && input[idx + 1] === "*") {
            idx += 2;
            continue;
          }
          return idx;
        }
      }
      idx += 1;
    }
    return -1;
  };

  while (i < input.length) {
    // Check **bold**
    if (input.startsWith("**", i)) {
      const after = input[i + 2];
      if (after && !/\s/.test(after) && after !== "*") {
        const closeIdx = findClosingDelimiter("**", i + 2);
        if (closeIdx > i + 2) {
          flushBuffer();
          const inner = input.slice(i + 2, closeIdx);
          runs.push(
            ...parseInlineFormatting(inner, { ...inherited, bold: true })
          );
          i = closeIdx + 2;
          continue;
        }
      }
    }

    // Check __underline__
    if (input.startsWith("__", i)) {
      const after = input[i + 2];
      if (after && !/\s/.test(after) && after !== "_") {
        const closeIdx = findClosingDelimiter("__", i + 2);
        if (closeIdx > i + 2) {
          flushBuffer();
          const inner = input.slice(i + 2, closeIdx);
          runs.push(
            ...parseInlineFormatting(inner, { ...inherited, underline: true })
          );
          i = closeIdx + 2;
          continue;
        }
      }
    }

    // Check *italic* (only when not ** and not preceded by alphanumeric without space)
    if (input[i] === "*" && input[i + 1] !== "*") {
      const after = input[i + 1];
      const prev = i > 0 ? input[i - 1] : " ";
      const validOpenBoundary = /[\s(\[{'"_-]/.test(prev) || i === 0;
      if (validOpenBoundary && after && !/\s/.test(after)) {
        const closeIdx = findClosingDelimiter("*", i + 1);
        if (closeIdx > i + 1) {
          flushBuffer();
          const inner = input.slice(i + 1, closeIdx);
          runs.push(
            ...parseInlineFormatting(inner, { ...inherited, italic: true })
          );
          i = closeIdx + 1;
          continue;
        }
      }
    }

    buffer += input[i];
    i += 1;
  }

  flushBuffer();
  return runs;
}

export function parseDocumentText(rawText: string): DocumentBlock[] {
  const normalized = rawText.replace(/\r\n?/g, "\n");
  const lines = normalized.split("\n");
  const blocks: DocumentBlock[] = [];

  for (let idx = 0; idx < lines.length; idx += 1) {
    const line = lines[idx];
    const id = `blk-${idx}`;

    if (PAGE_BREAK_REGEX.test(line)) {
      blocks.push({
        id,
        type: "page-break",
        runs: [],
      });
      continue;
    }

    if (line.trim().length === 0) {
      blocks.push({
        id,
        type: "blank",
        runs: [],
      });
      continue;
    }

    // Heading 1: "# Title"
    const h1Match = /^#\s+(.+)$/.exec(line);
    if (h1Match) {
      blocks.push({
        id,
        type: "h1",
        runs: parseInlineFormatting(h1Match[1].trimEnd(), {
          bold: true,
          italic: false,
          underline: false,
        }),
      });
      continue;
    }

    // Heading 2: "## Subtitle"
    const h2Match = /^##\s+(.+)$/.exec(line);
    if (h2Match) {
      blocks.push({
        id,
        type: "h2",
        runs: parseInlineFormatting(h2Match[1].trimEnd(), {
          bold: true,
          italic: false,
          underline: false,
        }),
      });
      continue;
    }

    // Bulleted list: "- item" or "* item"
    const bulletMatch = /^\s*[-*]\s+(.+)$/.exec(line);
    if (bulletMatch) {
      blocks.push({
        id,
        type: "bullet",
        listMarker: "•",
        runs: parseInlineFormatting(bulletMatch[1]),
      });
      continue;
    }

    // Numbered list: "1. item"
    const numMatch = /^\s*(\d+\.)\s+(.+)$/.exec(line);
    if (numMatch) {
      blocks.push({
        id,
        type: "numbered",
        listMarker: numMatch[1],
        runs: parseInlineFormatting(numMatch[2]),
      });
      continue;
    }

    // Standard paragraph line (preserves leading spaces if user indented)
    blocks.push({
      id,
      type: "paragraph",
      runs: parseInlineFormatting(line),
    });
  }

  return blocks;
}

export function computeDocumentStats(rawText: string): DocumentStats {
  const normalized = rawText.replace(/\r\n?/g, "\n");
  const lines = normalized.split("\n");
  const characterCount = rawText.length;
  const characterCountNoSpaces = rawText.replace(/\s/g, "").length;
  const trimmed = rawText.trim();
  const wordCount = trimmed ? trimmed.split(/\s+/).length : 0;

  let explicitPageBreaks = 0;
  for (const line of lines) {
    if (PAGE_BREAK_REGEX.test(line)) {
      explicitPageBreaks += 1;
    }
  }

  return {
    characterCount,
    characterCountNoSpaces,
    wordCount,
    lineCount: rawText.length === 0 ? 0 : lines.length,
    explicitPageBreaks,
  };
}
