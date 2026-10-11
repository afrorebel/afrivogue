import { assertEquals, assertStringIncludes } from "jsr:@std/assert@1";
import { inline, renderEditorialHtml } from "./editorialHtml.ts";

Deno.test("escapes raw HTML from scraped or generated text", () => {
  const html = inline(`<script>alert(1)</script><img src=x onerror=alert(2)>`);
  assertEquals(html.includes("<script>"), false);
  assertEquals(html.includes("<img"), false);
  assertStringIncludes(html, "&lt;script&gt;");
});

Deno.test("only http(s) markdown links become anchors", () => {
  assertEquals(inline("[bad](javascript:alert(1))").includes("<a "), false);
  assertEquals(
    inline("as [Vogue reported](https://vogue.com/x)"),
    'as <a href="https://vogue.com/x" target="_blank" rel="noopener noreferrer">Vogue reported</a>',
  );
});

Deno.test("link URLs cannot break out of the href attribute", () => {
  const html = inline('[x](https://a.com/"onmouseover="alert(1))');
  assertEquals(html.includes('"onmouseover'), false);
});

Deno.test("renders sections with headings and a pull quote after the first paragraph", () => {
  const html = renderEditorialHtml({
    intro: ["Opening *scene*."],
    sections: [{ heading: "The Makers", paragraphs: ["One.", "Two."], pull_quote: "A line." }],
  });
  assertEquals(
    html,
    "<p>Opening <em>scene</em>.</p>\n<h2>The Makers</h2>\n<p>One.</p>\n<blockquote><p>A line.</p></blockquote>\n<p>Two.</p>",
  );
});
