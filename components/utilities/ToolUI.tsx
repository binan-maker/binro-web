"use client";

import { useState, type DragEvent, type ReactNode } from "react";
import {
  AlertIcon,
  CheckIcon,
  ChevronDownIcon,
  LockIcon,
} from "@/components/ui/Icons";

export interface ToolHelpItem {
  id: string;
  question: string;
  answer: string;
}

export function ToolErrorBanner({
  messages,
  onDismiss,
  onRetry,
  retryLabel = "Try again",
}: {
  messages: string[];
  onDismiss: () => void;
  onRetry?: () => void;
  retryLabel?: string;
}) {
  if (messages.length === 0) return null;

  return (
    <div
      role="alert"
      className="flex flex-col gap-3 rounded-xl border border-[#B44A4A]/40 bg-[#FDF5F5] px-4 py-3.5 text-sm text-[#7A2727] sm:flex-row sm:items-start sm:justify-between"
    >
      <div className="flex min-w-0 items-start gap-2.5">
        <AlertIcon className="mt-0.5 h-4 w-4 shrink-0 text-[#9B2C2C]" />
        {messages.length === 1 ? (
          <p className="leading-relaxed text-pretty">{messages[0]}</p>
        ) : (
          <ul className="list-disc space-y-1 pl-4 leading-relaxed">
            {messages.map((msg, idx) => (
              <li key={`${idx}-${msg}`}>{msg}</li>
            ))}
          </ul>
        )}
      </div>

      <div className="flex shrink-0 flex-wrap items-center gap-2">
        {onRetry ? (
          <button
            type="button"
            onClick={onRetry}
            className="inline-flex min-h-[40px] items-center justify-center rounded-lg border border-[#B44A4A]/35 bg-white px-3.5 py-1.5 text-xs font-medium text-[#7A2727] transition-colors hover:bg-[#FDF5F5] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5C7E8F]"
          >
            {retryLabel}
          </button>
        ) : null}
        <button
          type="button"
          onClick={onDismiss}
          className="inline-flex min-h-[40px] items-center justify-center rounded-lg border border-[#B44A4A]/35 bg-white px-3.5 py-1.5 text-xs font-medium text-[#7A2727] transition-colors hover:bg-[#FDF5F5] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5C7E8F]"
        >
          Dismiss
        </button>
      </div>
    </div>
  );
}

export function ToolUploadDropzone({
  icon,
  buttonLabel,
  busyLabel,
  isBusy,
  isDragging,
  onDragOver,
  onDragLeave,
  onDrop,
  onButtonClick,
  helperText,
  supportText,
  reassuranceText = "Processed privately on your device — never uploaded.",
}: {
  icon: ReactNode;
  buttonLabel: string;
  busyLabel: string;
  isBusy: boolean;
  isDragging: boolean;
  onDragOver: (event: DragEvent<HTMLDivElement>) => void;
  onDragLeave: (event: DragEvent<HTMLDivElement>) => void;
  onDrop: (event: DragEvent<HTMLDivElement>) => void;
  onButtonClick: () => void;
  helperText: string;
  supportText: string;
  reassuranceText?: string;
}) {
  return (
    <div
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
      className="rounded-2xl border border-[#D4DDE2] bg-white p-4 shadow-[0_1px_2px_rgba(32,39,43,0.03)] sm:p-6"
    >
      <div
        className={`flex min-h-[250px] flex-col items-center justify-center rounded-xl border-2 border-dashed px-6 py-10 text-center transition-colors duration-150 sm:min-h-[300px] sm:py-12 ${
          isDragging
            ? "border-[#426579] bg-[#EAF0F3]"
            : "border-[#D4DDE2] bg-[#F3F6F7]/55 hover:border-[#5C7E8F]"
        }`}
      >
        <div
          className={`flex h-12 w-12 items-center justify-center rounded-xl border transition-colors ${
            isDragging
              ? "border-[#426579]/40 bg-white text-[#426579]"
              : "border-[#D4DDE2] bg-white text-[#466677]"
          }`}
        >
          {icon}
        </div>

        <button
          type="button"
          disabled={isBusy}
          onClick={onButtonClick}
          className="mt-5 inline-flex min-h-[46px] items-center justify-center rounded-xl bg-[#426579] px-6 py-2.5 text-sm font-medium text-white transition-all duration-150 hover:bg-[#355364] active:scale-[0.985] disabled:cursor-wait disabled:opacity-65 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5C7E8F] focus-visible:ring-offset-2"
        >
          {isBusy ? busyLabel : buttonLabel}
        </button>

        <p className="mt-3 text-sm text-[#20272B]">
          {isDragging ? "Release to add your file" : helperText}
        </p>

        <p className="mt-2 text-xs text-[#556168]">{supportText}</p>

        <p className="mt-4 inline-flex items-center gap-1.5 text-xs text-[#466677]">
          <LockIcon className="h-3.5 w-3.5 shrink-0" />
          <span>{reassuranceText}</span>
        </p>
      </div>
    </div>
  );
}

export function ToolProgressCard({
  stageLabel,
  detail,
  percent,
  onCancel,
}: {
  stageLabel: string;
  detail: string;
  percent: number | null;
  onCancel?: () => void;
}) {
  return (
    <div
      aria-live="polite"
      className="space-y-3 rounded-xl border border-[#D4DDE2] bg-[#F3F6F7]/75 p-4"
    >
      <div className="flex items-baseline justify-between gap-3 text-xs">
        <div className="min-w-0">
          <span className="font-semibold text-[#20272B]">{stageLabel}</span>
          <span className="ml-2 text-[#556168]">{detail}</span>
        </div>
        <span className="shrink-0 font-mono font-medium text-[#466677] tabular-nums">
          {percent !== null ? `${percent}%` : "Working"}
        </span>
      </div>

      <div
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={percent !== null ? percent : undefined}
        aria-valuetext={`${stageLabel}: ${detail}`}
        className="h-2 w-full overflow-hidden rounded-full bg-[#D4DDE2]"
      >
        {percent !== null ? (
          <div
            className="h-full rounded-full bg-[#1CC8A0] transition-all duration-150"
            style={{ width: `${Math.min(100, Math.max(0, percent))}%` }}
          />
        ) : (
          <div className="h-full w-1/3 rounded-full bg-[#426579] animate-binro-indeterminate" />
        )}
      </div>

      {onCancel ? (
        <div className="flex justify-end">
          <button
            type="button"
            onClick={onCancel}
            className="min-h-[40px] rounded-lg px-3 py-1 text-xs font-medium text-[#556168] transition-colors hover:bg-white hover:text-[#20272B] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5C7E8F]"
          >
            Cancel
          </button>
        </div>
      ) : null}
    </div>
  );
}

export function ToolResultHeader({
  title,
  isCurrent = true,
  rightContent,
}: {
  title: string;
  isCurrent?: boolean;
  rightContent?: ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div className="inline-flex items-center gap-2">
        {isCurrent ? (
          <span className="inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-[#EAFBF6] text-[#0E6B56]">
            <CheckIcon className="h-3.5 w-3.5" />
          </span>
        ) : null}
        <p
          className={`text-sm font-semibold ${
            isCurrent ? "text-[#0E6B56]" : "text-[#466677]"
          }`}
        >
          {title}
        </p>
      </div>
      {rightContent}
    </div>
  );
}

export function ToolPrivacyNote({
  text = "Your files are processed locally on your device and never leave your browser.",
  rightSlot,
}: {
  text?: string;
  rightSlot?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-start justify-between gap-2 pt-1 sm:flex-row sm:items-center">
      <p className="inline-flex items-center gap-2 text-xs text-[#556168]">
        <LockIcon className="h-3.5 w-3.5 shrink-0 text-[#466677]" />
        <span>{text}</span>
      </p>
      {rightSlot}
    </div>
  );
}

export function ToolHelpAccordion({
  idPrefix,
  title = "Help & reference",
  items,
}: {
  idPrefix: string;
  title?: string;
  items: ToolHelpItem[];
}) {
  const [openId, setOpenId] = useState<string | null>(null);

  return (
    <div className="mx-auto max-w-[1040px]">
      <h2 className="text-sm font-medium text-[#466677]">{title}</h2>
      <div className="mt-3 divide-y divide-[#D4DDE2] rounded-2xl border border-[#D4DDE2] bg-white">
        {items.map((item) => {
          const isOpen = openId === item.id;

          return (
            <div key={item.id}>
              <button
                type="button"
                aria-expanded={isOpen}
                aria-controls={`${idPrefix}-${item.id}`}
                onClick={() => setOpenId(isOpen ? null : item.id)}
                className="flex min-h-[48px] w-full items-center justify-between gap-4 px-5 py-3.5 text-left text-sm font-medium text-[#20272B] transition-colors hover:bg-[#F3F6F7]/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#5C7E8F]"
              >
                <span>{item.question}</span>
                <ChevronDownIcon
                  className={`h-4 w-4 shrink-0 text-[#466677] transition-transform duration-150 ${
                    isOpen ? "rotate-180" : ""
                  }`}
                />
              </button>
              {isOpen ? (
                <div
                  id={`${idPrefix}-${item.id}`}
                  className="max-w-[68ch] px-5 pb-4 text-sm leading-relaxed text-[#556168] text-pretty"
                >
                  {item.answer}
                </div>
              ) : null}
            </div>
          );
        })}
      </div>
    </div>
  );
}
