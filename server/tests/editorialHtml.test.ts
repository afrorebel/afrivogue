import { describe, expect, it } from "vitest";
import { inline, renderEditorialHtml } from "../src/content/editorialHtml";

describe("editorial HTML", () => {
  it("escapes raw HTML from scraped or generated text", () => {
    const html = inline(`<script>alert(1)</script><img src=x onerror=alert(2)>`);
    expect(html).not.toContain("<script>");
    expect(html).not.toContain("<img");
    expect(html).toContain("&lt;script&gt;");
  });

  it("only turns http(s) markdown links into anchors", () => {
    expect(inline("[bad](javascript:alert(1))")).not.toContain("<a ");
    expect(inline("as [Vogue reported](https://vogue.com/x)")).toBe(
      'as <a href="https://vogue.com/x" target="_blank" rel="noopener noreferrer">Vogue reported</a>',
    );
  });

  it("keeps link URLs inside the href attribute", () => {
    expect(inline('[x](https://a.com/"onmouseover="alert(1))')).not.toContain('"onmouseover');
  });

  it("renders sections with a pull quote after the first paragraph", () => {
    const html = renderEditorialHtml({
      intro: ["Opening *scene*."],
      sections: [{ heading: "The Makers", paragraphs: ["One.", "Two."], pull_quote: "A line." }],
    });
    expect(html).toBe("<p>Opening <em>scene</em>.</p>\n<h2>The Makers</h2>\n<p>One.</p>\n<blockquote><p>A line.</p></blockquote>\n<p>Two.</p>");
  });
});
