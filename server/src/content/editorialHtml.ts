// Builds editorial HTML from Claude's structured sections. Everything is escaped;
// only https/http markdown links and *italics* become markup.

export interface EditorialSections {
  intro: string[];
  sections: { heading: string; paragraphs: string[]; pull_quote: string }[];
}


export const escapeHtml = (text: string) =>
  text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

/** Escapes text, then turns markdown links (https only) and *italics* into HTML. */
export function inline(text: string): string {
  let html = escapeHtml(text);
  html = html.replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g, (_m, label, url) => {
    const safeUrl = url.replace(/"/g, "%22");
    return `<a href="${safeUrl}" target="_blank" rel="noopener noreferrer">${label}</a>`;
  });
  html = html.replace(/\*([^*\n]+)\*/g, "<em>$1</em>");
  return html;
}

export function renderEditorialHtml(e: EditorialSections): string {
  const parts: string[] = [];
  for (const p of e.intro) parts.push(`<p>${inline(p)}</p>`);
  for (const section of e.sections) {
    parts.push(`<h2>${inline(section.heading)}</h2>`);
    section.paragraphs.forEach((p, i) => {
      parts.push(`<p>${inline(p)}</p>`);
      // Place the pull quote after the first paragraph of its section.
      if (i === 0 && section.pull_quote.trim()) {
        parts.push(`<blockquote><p>${inline(section.pull_quote.trim())}</p></blockquote>`);
      }
    });
  }
  return parts.join("\n");
}

