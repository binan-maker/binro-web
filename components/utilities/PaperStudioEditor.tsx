"use client";

import { useId, useRef, useState, type KeyboardEvent } from "react";
import { PAGE_BREAK_DELIMITER, type DocumentStats } from "@/lib/paper-studio/document";
import { AlertIcon } from "@/components/ui/Icons";

interface PaperStudioEditorProps {
  text: string;
  onChangeText: (next: string, pushHistory?: boolean) => void;
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
  onLoadSample: () => void;
  onClearDocument: () => void;
  stats: DocumentStats;
  estimatedPages: number;
  unsupportedChars: string[];
  fontName: string;
}

export function PaperStudioEditor({
  text,
  onChangeText,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  onLoadSample,
  onClearDocument,
  stats,
  estimatedPages,
  unsupportedChars,
  fontName,
}: PaperStudioEditorProps) {
  const editorId = useId();
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const lastSelectionRef = useRef<{
    start: number;
    end: number;
    hasCursor: boolean;
  }>({ start: 0, end: 0, hasCursor: false });
  const pendingSelectionRef = useRef<{ start: number; end: number } | null>(null);
  const [confirmingClear, setConfirmingClear] = useState(false);

  const syncSelectionFromEl = (el: HTMLTextAreaElement | null) => {
    if (!el) return;
    pendingSelectionRef.current = null;
    lastSelectionRef.current = {
      start: el.selectionStart ?? 0,
      end: el.selectionEnd ?? 0,
      hasCursor: true,
    };
  };

  const getActiveSelectionRange = (fallbackToEnd = false): { start: number; end: number } => {
    if (pendingSelectionRef.current) {
      return pendingSelectionRef.current;
    }

    const el = textareaRef.current;
    if (!el) {
      const pos = fallbackToEnd ? text.length : 0;
      return { start: pos, end: pos };
    }
    const selStart = el.selectionStart ?? 0;
    const selEnd = el.selectionEnd ?? 0;
    const isFocused =
      typeof document !== "undefined" && document.activeElement === el;

    if (
      isFocused ||
      lastSelectionRef.current.hasCursor ||
      selStart > 0 ||
      selEnd > 0
    ) {
      return { start: selStart, end: selEnd };
    }

    const pos = fallbackToEnd ? text.length : 0;
    return { start: pos, end: pos };
  };

  const applyInlineWrap = (prefix: string, suffix: string, fallbackWord: string) => {
    const el = textareaRef.current;
    if (!el) return;

    const { start, end } = getActiveSelectionRange(false);
    const selected = text.slice(start, end);

    let nextText: string;
    let nextSelStart: number;
    let nextSelEnd: number;

    if (selected.length > 0) {
      let alreadyWrapped = false;

      if (prefix === "*" && suffix === "*") {
        let starsBefore = 0;
        while (start - 1 - starsBefore >= 0 && text[start - 1 - starsBefore] === "*") {
          starsBefore += 1;
        }
        let starsAfter = 0;
        while (end + starsAfter < text.length && text[end + starsAfter] === "*") {
          starsAfter += 1;
        }
        const sharedStars = Math.min(starsBefore, starsAfter);
        alreadyWrapped = sharedStars % 2 === 1;
      } else if (prefix === "**" && suffix === "**") {
        let starsBefore = 0;
        while (start - 1 - starsBefore >= 0 && text[start - 1 - starsBefore] === "*") {
          starsBefore += 1;
        }
        let starsAfter = 0;
        while (end + starsAfter < text.length && text[end + starsAfter] === "*") {
          starsAfter += 1;
        }
        alreadyWrapped = Math.min(starsBefore, starsAfter) >= 2;
      } else {
        const before = text.slice(Math.max(0, start - prefix.length), start);
        const after = text.slice(end, end + suffix.length);
        alreadyWrapped = before === prefix && after === suffix;
      }

      if (alreadyWrapped) {
        nextText =
          text.slice(0, start - prefix.length) +
          selected +
          text.slice(end + suffix.length);
        nextSelStart = start - prefix.length;
        nextSelEnd = end - prefix.length;
      } else {
        nextText =
          text.slice(0, start) +
          prefix +
          selected +
          suffix +
          text.slice(end);
        nextSelStart = start + prefix.length;
        nextSelEnd = end + prefix.length;
      }
    } else {
      nextText =
        text.slice(0, start) + prefix + fallbackWord + suffix + text.slice(end);
      nextSelStart = start + prefix.length;
      nextSelEnd = start + prefix.length + fallbackWord.length;
    }

    lastSelectionRef.current = {
      start: nextSelStart,
      end: nextSelEnd,
      hasCursor: true,
    };
    pendingSelectionRef.current = { start: nextSelStart, end: nextSelEnd };
    onChangeText(nextText, true);
    requestAnimationFrame(() => {
      pendingSelectionRef.current = null;
      if (!textareaRef.current) return;
      textareaRef.current.focus();
      textareaRef.current.setSelectionRange(nextSelStart, nextSelEnd);
    });
  };

  const applyLinePrefix = (prefix: string, toggleRegex: RegExp) => {
    const el = textareaRef.current;
    if (!el) return;

    const { start, end } = getActiveSelectionRange(false);

    const lineStart = text.lastIndexOf("\n", Math.max(0, start - 1)) + 1;
    const rawLineEnd = text.indexOf("\n", end);
    const lineEnd = rawLineEnd === -1 ? text.length : rawLineEnd;

    const block = text.slice(lineStart, lineEnd);
    const lines = block.split("\n");
    const allHavePrefix = lines.every((l) => toggleRegex.test(l));

    let counter = 1;
    const updatedLines = lines.map((line) => {
      if (allHavePrefix) {
        return line.replace(toggleRegex, "");
      }
      const cleaned = line
        .replace(/^#{1,2}\s+/, "")
        .replace(/^\s*[-*]\s+/, "")
        .replace(/^\s*\d+\.\s+/, "");
      if (prefix === "1. ") {
        const numbered = `${counter}. ${cleaned}`;
        counter += 1;
        return numbered;
      }
      return `${prefix}${cleaned}`;
    });

    const replacement = updatedLines.join("\n");
    const nextText =
      text.slice(0, lineStart) + replacement + text.slice(lineEnd);
    lastSelectionRef.current = {
      start: lineStart,
      end: lineStart + replacement.length,
      hasCursor: true,
    };
    pendingSelectionRef.current = {
      start: lineStart,
      end: lineStart + replacement.length,
    };
    onChangeText(nextText, true);

    requestAnimationFrame(() => {
      pendingSelectionRef.current = null;
      if (!textareaRef.current) return;
      textareaRef.current.focus();
      textareaRef.current.setSelectionRange(
        lineStart,
        lineStart + replacement.length
      );
    });
  };

  const insertPageBreak = () => {
    const { start } = getActiveSelectionRange(true);
    const cursor = start;
    const before = text.slice(0, cursor);
    const after = text.slice(cursor);

    const needsLeadingNewline = before.length > 0 && !before.endsWith("\n");
    const insertion = `${needsLeadingNewline ? "\n" : ""}${PAGE_BREAK_DELIMITER}\n`;

    const nextText = before + insertion + after;
    const nextPos = before.length + insertion.length;
    lastSelectionRef.current = {
      start: nextPos,
      end: nextPos,
      hasCursor: true,
    };
    pendingSelectionRef.current = { start: nextPos, end: nextPos };
    onChangeText(nextText, true);

    requestAnimationFrame(() => {
      pendingSelectionRef.current = null;
      if (!textareaRef.current) return;
      textareaRef.current.focus();
      textareaRef.current.setSelectionRange(nextPos, nextPos);
    });
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    const mod = event.metaKey || event.ctrlKey;
    if (!mod) return;

    const key = event.key.toLowerCase();
    if (key === "b") {
      event.preventDefault();
      applyInlineWrap("**", "**", "bold text");
    } else if (key === "i") {
      event.preventDefault();
      applyInlineWrap("*", "*", "italic text");
    } else if (key === "u") {
      event.preventDefault();
      applyInlineWrap("__", "__", "underlined text");
    } else if (key === "z" && !event.shiftKey) {
      if (canUndo) {
        event.preventDefault();
        onUndo();
      }
    } else if ((key === "z" && event.shiftKey) || key === "y") {
      if (canRedo) {
        event.preventDefault();
        onRedo();
      }
    }
  };

  return (
    <div className="flex flex-col rounded-2xl border border-[#D4DDE2] bg-white shadow-[0_1px_2px_rgba(32,39,43,0.03)]">
      {/* Header & History Controls */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#D4DDE2] px-4 py-3">
        <div>
          <h2 className="text-sm font-semibold text-[#20272B]">Document</h2>
          <p className="text-xs text-[#556168]">
            Type or paste text below
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          <button
            type="button"
            disabled={!canUndo}
            onClick={() => {
              setConfirmingClear(false);
              onUndo();
            }}
            title="Undo (Ctrl/Cmd+Z)"
            className="inline-flex min-h-[34px] items-center rounded-lg border border-[#D4DDE2] bg-white px-2.5 text-xs font-medium text-[#20272B] transition-colors hover:bg-[#F3F6F7] disabled:cursor-not-allowed disabled:opacity-45 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5C7E8F]"
          >
            Undo
          </button>
          <button
            type="button"
            disabled={!canRedo}
            onClick={() => {
              setConfirmingClear(false);
              onRedo();
            }}
            title="Redo (Ctrl/Cmd+Shift+Z)"
            className="inline-flex min-h-[34px] items-center rounded-lg border border-[#D4DDE2] bg-white px-2.5 text-xs font-medium text-[#20272B] transition-colors hover:bg-[#F3F6F7] disabled:cursor-not-allowed disabled:opacity-45 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5C7E8F]"
          >
            Redo
          </button>
          <button
            type="button"
            onClick={() => {
              setConfirmingClear(false);
              onLoadSample();
            }}
            className="inline-flex min-h-[34px] items-center rounded-lg border border-[#D4DDE2] bg-white px-2.5 text-xs font-medium text-[#426579] transition-colors hover:border-[#5C7E8F] hover:bg-[#F3F6F7] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5C7E8F]"
          >
            Sample
          </button>

          {text.length > 0 ? (
            confirmingClear ? (
              <div className="inline-flex items-center gap-1 rounded-lg border border-[#B44A4A]/40 bg-[#FDF5F5] px-1.5 py-0.5">
                <button
                  type="button"
                  onClick={() => {
                    setConfirmingClear(false);
                    onClearDocument();
                  }}
                  className="min-h-[30px] rounded px-2 text-xs font-semibold text-[#9B2C2C] hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5C7E8F]"
                >
                  Clear all
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmingClear(false)}
                  className="min-h-[30px] rounded px-2 text-xs font-medium text-[#556168] hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5C7E8F]"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => {
                  if (text.trim().length > 40) {
                    setConfirmingClear(true);
                  } else {
                    onClearDocument();
                  }
                }}
                className="inline-flex min-h-[34px] items-center rounded-lg border border-[#D4DDE2] bg-white px-2.5 text-xs font-medium text-[#556168] transition-colors hover:border-[#B44A4A]/50 hover:text-[#7A2727] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5C7E8F]"
              >
                Clear
              </button>
            )
          ) : null}
        </div>
      </div>

      {/* Formatting Toolbar */}
      <div
        role="toolbar"
        aria-label="Text formatting"
        className="flex flex-wrap items-center gap-1 border-b border-[#D4DDE2] bg-[#F3F6F7]/55 px-3 py-2"
      >
        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => applyLinePrefix("# ", /^#\s+/)}
          title="Heading 1"
          className="inline-flex min-h-[32px] items-center rounded-md border border-transparent px-2 text-xs font-semibold text-[#20272B] hover:border-[#D4DDE2] hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5C7E8F]"
        >
          H1
        </button>
        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => applyLinePrefix("## ", /^##\s+/)}
          title="Heading 2"
          className="inline-flex min-h-[32px] items-center rounded-md border border-transparent px-2 text-xs font-semibold text-[#20272B] hover:border-[#D4DDE2] hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5C7E8F]"
        >
          H2
        </button>
        <span aria-hidden="true" className="mx-0.5 h-4 w-px bg-[#D4DDE2]" />
        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => applyInlineWrap("**", "**", "bold text")}
          title="Bold (Ctrl/Cmd+B)"
          className="inline-flex min-h-[32px] min-w-[32px] items-center justify-center rounded-md border border-transparent px-2 text-xs font-bold text-[#20272B] hover:border-[#D4DDE2] hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5C7E8F]"
        >
          B
        </button>
        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => applyInlineWrap("*", "*", "italic text")}
          title="Italic (Ctrl/Cmd+I)"
          className="inline-flex min-h-[32px] min-w-[32px] items-center justify-center rounded-md border border-transparent px-2 text-xs italic font-medium text-[#20272B] hover:border-[#D4DDE2] hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5C7E8F]"
        >
          I
        </button>
        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => applyInlineWrap("__", "__", "underlined text")}
          title="Underline (Ctrl/Cmd+U)"
          className="inline-flex min-h-[32px] min-w-[32px] items-center justify-center rounded-md border border-transparent px-2 text-xs font-medium underline text-[#20272B] hover:border-[#D4DDE2] hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5C7E8F]"
        >
          U
        </button>
        <span aria-hidden="true" className="mx-0.5 h-4 w-px bg-[#D4DDE2]" />
        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => applyLinePrefix("- ", /^\s*[-*]\s+/)}
          title="Bulleted list"
          className="inline-flex min-h-[32px] items-center rounded-md border border-transparent px-2 text-xs font-medium text-[#20272B] hover:border-[#D4DDE2] hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5C7E8F]"
        >
          • List
        </button>
        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => applyLinePrefix("1. ", /^\s*\d+\.\s+/)}
          title="Numbered list"
          className="inline-flex min-h-[32px] items-center rounded-md border border-transparent px-2 text-xs font-medium text-[#20272B] hover:border-[#D4DDE2] hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5C7E8F]"
        >
          1. List
        </button>
        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={insertPageBreak}
          title="Insert explicit page break (---pagebreak---)"
          className="ml-auto inline-flex min-h-[32px] items-center rounded-md border border-[#D4DDE2] bg-white px-2.5 text-xs font-medium text-[#426579] transition-colors hover:border-[#5C7E8F] hover:bg-[#F3F6F7] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5C7E8F]"
        >
          + Page break
        </button>
      </div>

      {/* Textarea */}
      <div className="p-3 sm:p-4">
        <label htmlFor={`${editorId}-document-input`} className="sr-only">
          Document text
        </label>
        <textarea
          ref={textareaRef}
          id={`${editorId}-document-input`}
          data-paper-studio-editor="true"
          value={text}
          onChange={(e) => {
            setConfirmingClear(false);
            syncSelectionFromEl(e.currentTarget);
            onChangeText(e.target.value, false);
          }}
          onSelect={(e) => syncSelectionFromEl(e.currentTarget)}
          onClick={(e) => syncSelectionFromEl(e.currentTarget)}
          onKeyUp={(e) => syncSelectionFromEl(e.currentTarget)}
          onFocus={(e) => syncSelectionFromEl(e.currentTarget)}
          onKeyDown={handleKeyDown}
          rows={18}
          spellCheck
          placeholder={`Write or paste your notes here...\n\nTips:\n# Heading 1   ## Heading 2\n**bold**   *italic*   __underline__\n- Bullet item   1. Numbered item\n---pagebreak--- to start a new page`}
          className="min-h-[340px] w-full resize-y rounded-xl border border-[#D4DDE2] bg-[#F3F6F7]/30 px-3.5 py-3 text-sm leading-relaxed text-[#20272B] placeholder:text-[#556168]/70 focus:border-[#426579] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#5C7E8F]/30 lg:min-h-[460px]"
        />

        {unsupportedChars.length > 0 ? (
          <div
            role="status"
            className="mt-2.5 flex items-start gap-2 rounded-xl border border-[#D4A72C]/45 bg-[#FFFBEB] px-3 py-2 text-xs text-[#78530A]"
          >
            <AlertIcon className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#B45309]" />
            <p className="leading-relaxed">
              Some characters ({unsupportedChars.join(" ")}) are outside{" "}
              <span className="font-medium">{fontName}</span>&apos;s character set
              and may fall back to a system font.
            </p>
          </div>
        ) : null}
      </div>

      {/* Live Statistics */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-[#D4DDE2] bg-[#F3F6F7]/45 px-4 py-2.5 text-xs text-[#556168]">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 font-mono tabular-nums">
          <span>{stats.characterCount.toLocaleString()} chars</span>
          <span aria-hidden="true">·</span>
          <span>{stats.wordCount.toLocaleString()} words</span>
          <span aria-hidden="true">·</span>
          <span className="font-medium text-[#20272B]">
            {estimatedPages} {estimatedPages === 1 ? "page" : "pages"}
          </span>
        </div>
        <span className="text-[11px] text-[#466677]">
          Break: <code className="font-mono">---pagebreak---</code>
        </span>
      </div>
    </div>
  );
}
