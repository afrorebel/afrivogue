import React from "react";

const URL_REGEX = /(https?:\/\/[^\s)<>]+)/g;

export function linkifyText(text: string): React.ReactNode[] {
  const parts = text.split(URL_REGEX);
  return parts.map((part, i) =>
    URL_REGEX.test(part) ? (
      <a
        key={i}
        href={part}
        target="_blank"
        rel="noopener noreferrer"
        className="text-gold underline decoration-gold/40 underline-offset-2 transition-colors hover:text-foreground hover:decoration-foreground/40 break-all"
      >
        {new URL(part).hostname.replace("www.", "")}
      </a>
    ) : (
      <React.Fragment key={i}>{part}</React.Fragment>
    )
  );
}
