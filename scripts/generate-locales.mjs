import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  defaultLocale,
  localeOrder,
  localeUrl,
  locales,
  siteUrl,
} from "../src/locales.js";

const root = dirname(fileURLToPath(import.meta.url));
const distDir = join(root, "..", "dist");
const builtIndexPath = join(distDir, "index.html");
const builtIndex = await readFile(builtIndexPath, "utf8");

const body = builtIndex.match(/<body[\s\S]*<\/body>/)?.[0];
const head = builtIndex.match(/<head>([\s\S]*?)<\/head>/)?.[1] ?? "";
const assetTags = head
  .split("\n")
  .map((line) => line.trim())
  .filter((line) => {
    return (
      line.includes('rel="stylesheet"') ||
      line.includes('rel="modulepreload"') ||
      line.includes('type="module"') ||
      line.includes('rel="preload"')
    );
  })
  .join("\n    ");

if (!body) {
  throw new Error("Could not find body in built index.html");
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll('"', "&quot;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

function jsonLd(locale) {
  return JSON.stringify(
    {
      "@context": "https://schema.org",
      "@type": "WebApplication",
      name: locale.appName,
      url: localeUrl(locale.code),
      applicationCategory: "FinanceApplication",
      operatingSystem: "Any",
      inLanguage: locale.htmlLang,
      description: locale.description,
      offers: {
        "@type": "Offer",
        price: "0",
        priceCurrency: "EUR",
      },
    },
    null,
    8,
  );
}

function alternateLinks() {
  const alternates = localeOrder
    .map((code) => {
      const locale = locales[code];
      return `<link rel="alternate" hreflang="${locale.hreflang}" href="${localeUrl(code)}" />`;
    })
    .join("\n    ");

  return `${alternates}\n    <link rel="alternate" hreflang="x-default" href="${localeUrl("en")}" />`;
}

function htmlForLocale(locale) {
  const title = escapeHtml(locale.title);
  const description = escapeHtml(locale.description);
  const shortDescription = escapeHtml(locale.shortDescription);
  const url = localeUrl(locale.code);
  const imageUrl = `${siteUrl}/fiverr.jpg`;

  return `<!doctype html>
<html lang="${locale.htmlLang}" dir="${locale.dir}">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${title}</title>
    <meta name="description" content="${description}" />
    <meta name="robots" content="index, follow, max-image-preview:large" />
    <meta name="theme-color" content="#1dbf73" />
    <link rel="canonical" href="${url}" />
    ${alternateLinks()}
    <script>
      let theme = null;
      try {
        theme = localStorage.getItem("theme");
      } catch {}
      const prefersDark = matchMedia("(prefers-color-scheme: dark)").matches;
      if (theme === "dark" || (!theme && prefersDark)) {
        document.documentElement.classList.add("dark");
        document.documentElement.style.colorScheme = "dark";
      } else {
        document.documentElement.style.colorScheme = "light";
      }
    </script>

    <meta property="og:type" content="website" />
    <meta property="og:locale" content="${locale.htmlLang.replace("-", "_")}" />
    <meta property="og:url" content="${url}" />
    <meta property="og:title" content="${title}" />
    <meta property="og:description" content="${shortDescription}" />
    <meta property="og:image" content="${imageUrl}" />

    <meta name="twitter:card" content="summary" />
    <meta name="twitter:title" content="${title}" />
    <meta name="twitter:description" content="${shortDescription}" />
    <meta name="twitter:image" content="${imageUrl}" />

    <script type="application/ld+json">
      ${jsonLd(locale)}
    </script>
    ${assetTags}
  </head>
  ${body}
</html>
`;
}

for (const code of localeOrder) {
  const locale = locales[code];
  const outputDir = join(distDir, code);
  await mkdir(outputDir, { recursive: true });
  await writeFile(join(outputDir, "index.html"), htmlForLocale(locale), "utf8");
}

await writeFile(builtIndexPath, htmlForLocale(locales[defaultLocale]), "utf8");

const sitemapAlternates = localeOrder
  .map((code) => {
    const locale = locales[code];
    return `      <xhtml:link rel="alternate" hreflang="${locale.hreflang}" href="${localeUrl(code)}" />`;
  })
  .join("\n");

const sitemapUrls = localeOrder
  .map((code) => {
    return `  <url>
    <loc>${localeUrl(code)}</loc>
${sitemapAlternates}
      <xhtml:link rel="alternate" hreflang="x-default" href="${localeUrl("en")}" />
    <lastmod>2026-05-13</lastmod>
    <changefreq>monthly</changefreq>
    <priority>${code === defaultLocale ? "1.0" : "0.9"}</priority>
  </url>`;
  })
  .join("\n");

await writeFile(
  join(distDir, "sitemap.xml"),
  `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">
${sitemapUrls}
</urlset>
`,
  "utf8",
);

const redirectLines = [
  `/ /${defaultLocale}/ 302`,
  ...localeOrder.map((code) => `/${code} /${code}/ 301`),
];

await writeFile(join(distDir, "_redirects"), `${redirectLines.join("\n")}\n`, "utf8");
