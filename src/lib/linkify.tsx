import React from "react";

/**
 * Converts markdown-style [text](url) links AND raw URLs into clickable <a> tags.
 * Prioritises embedded links so raw URLs are only a fallback.
 */

const MARKDOWN_LINK = /\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g;
const RAW_URL = /(https?:\/\/[^\s)<>]+)/g;

function linkifySegment(text: string, baseKey: string): React.ReactNode[] {
  const parts = text.split(RAW_URL);
  return parts.map((part, i) =>
    RAW_URL.test(part) ? (
      <a
        key={`${baseKey}-raw-${i}`}
        href={part}
        target="_blank"
        rel="noopener noreferrer"
        className="text-gold underline decoration-gold/40 underline-offset-2 transition-colors hover:text-foreground hover:decoration-foreground/40 break-all"
      >
        {(() => {
          try {
            return new URL(part).hostname.replace("www.", "");
          } catch {
            return part;
          }
        })()}
      </a>
    ) : (
      <React.Fragment key={`${baseKey}-txt-${i}`}>{part}</React.Fragment>
    )
  );
}

export function linkifyText(text: string): React.ReactNode[] {
  const nodes: React.ReactNode[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  // Reset regex state
  MARKDOWN_LINK.lastIndex = 0;

  while ((match = MARKDOWN_LINK.exec(text)) !== null) {
    const before = text.slice(lastIndex, match.index);
    if (before) {
      nodes.push(...linkifySegment(before, `seg-${lastIndex}`));
    }

    nodes.push(
      <a
        key={`md-${match.index}`}
        href={match[2]}
        target="_blank"
        rel="noopener noreferrer"
        className="text-gold underline decoration-gold/40 underline-offset-2 transition-colors hover:text-foreground hover:decoration-foreground/40"
      >
        {match[1]}
      </a>
    );

    lastIndex = match.index + match[0].length;
  }

  const remaining = text.slice(lastIndex);
  if (remaining) {
    nodes.push(...linkifySegment(remaining, `seg-${lastIndex}`));
  }

  return nodes;
}
