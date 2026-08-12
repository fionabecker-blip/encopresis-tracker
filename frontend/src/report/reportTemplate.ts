import { Asset } from "expo-asset";
import * as FileSystem from "expo-file-system/legacy";
import { Lora_600SemiBold } from "@expo-google-fonts/lora";
import { PublicSans_400Regular, PublicSans_600SemiBold } from "@expo-google-fonts/public-sans";
import { lightTheme } from "../theme/tokens";

/**
 * Shared chrome for the two exported PDFs (the daily log in History and the
 * pediatrician report in Progress).
 *
 * The report is deliberately NOT the app: it prints on white stock rather than
 * the app's cream, carries no icons, emoji or rounded chips, and never follows
 * the device color scheme. A clinician reads it as a medical document, so the
 * only decoration is the wordmark and a single rule.
 */

// Print stock is white. This is the one place pure white is correct — the app
// UI uses the warmer `surface` token instead.
const PAPER = "#FFFFFF";

export const report = {
  teal: lightTheme.colors.primary, // #1D6A64
  apricot: lightTheme.colors.accent, // #E8A05C — milestones only
  body: lightTheme.colors.textPrimary, // #22333B
  hairline: lightTheme.colors.border, // #DCD3C1
  muted: lightTheme.colors.textMuted,
  secondary: lightTheme.colors.textSecondary,
} as const;

/** Minimal escaping for anything interpolated into the template. */
const escapeHtml = (value: unknown): string =>
  String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

// ── Fonts ────────────────────────────────────────────────────────────────────
// The print webview cannot see fonts registered with expo-font, so the faces
// are inlined as data URIs. They are read from the bundled assets rather than
// fetched, so an export works with no network — a parent may well be doing this
// in a waiting room.

const FACES = [
  { module: Lora_600SemiBold, family: "Lora", weight: 600 },
  { module: PublicSans_400Regular, family: "Public Sans", weight: 400 },
  { module: PublicSans_600SemiBold, family: "Public Sans", weight: 600 },
];

let fontCssPromise: Promise<string> | null = null;

const readFontCss = async (): Promise<string> => {
  const faces = await Promise.all(
    FACES.map(async ({ module, family, weight }) => {
      const asset = Asset.fromModule(module);
      await asset.downloadAsync();
      const uri = asset.localUri || asset.uri;
      const base64 = await FileSystem.readAsStringAsync(uri, {
        encoding: FileSystem.EncodingType.Base64,
      });
      return `@font-face{font-family:"${family}";font-style:normal;font-weight:${weight};src:url(data:font/ttf;base64,${base64}) format("truetype");}`;
    })
  );
  return faces.join("");
};

/**
 * Resolves the @font-face block, memoized for the life of the process. Falls
 * back to an empty string: a report in Georgia/Helvetica is still a usable
 * clinical document, so a font read failure must not block the export.
 */
export const loadReportFontCss = (): Promise<string> => {
  if (!fontCssPromise) {
    fontCssPromise = readFontCss().catch(() => "");
  }
  return fontCssPromise;
};

// ── Stylesheet ───────────────────────────────────────────────────────────────

/**
 * Usable height inside the 0.5in margins, with slack so rounding never spills
 * an empty trailing sheet. Landscape is for the wide daily-log table, which
 * cannot be read at 23 columns across a portrait page.
 */
const PAGE_HEIGHT_IN = { portrait: 9.4, landscape: 6.9 } as const;

export type Orientation = keyof typeof PAGE_HEIGHT_IN;

const baseCss = (orientation: Orientation) => `
  * { box-sizing: border-box; }
  @page { size: Letter ${orientation}; margin: 0.5in; }
  html, body { margin: 0; padding: 0; background: ${PAPER}; }
  body {
    font-family: "Public Sans", Helvetica, Arial, sans-serif;
    font-size: 10pt;
    line-height: 1.45;
    color: ${report.body};
    -webkit-font-smoothing: antialiased;
  }

  .page {
    min-height: ${PAGE_HEIGHT_IN[orientation]}in;
    display: flex;
    flex-direction: column;
    page-break-after: always;
  }
  .page:last-of-type { page-break-after: auto; }
  .page-body { flex: 1 1 auto; }

  /* Letterhead ------------------------------------------------------------ */
  .letterhead {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 24px;
  }
  .wordmark {
    font-family: "Lora", Georgia, serif;
    font-weight: 600;
    font-size: 20pt;
    line-height: 1;
    color: ${report.teal};
    letter-spacing: -0.01em;
  }
  .wordmark i { font-style: normal; color: ${report.apricot}; }
  .letterhead-meta {
    text-align: right;
    font-size: 10pt;
    line-height: 1.35;
    color: ${report.body};
  }
  .letterhead-meta .label { color: ${report.muted}; }
  .rule {
    border: 0;
    border-top: 2px solid ${report.teal};
    margin: 8px 0 18px;
  }

  /* Typography ------------------------------------------------------------ */
  h1, h2, h3 {
    font-family: "Lora", Georgia, serif;
    font-weight: 600;
    font-size: 13pt;
    line-height: 1.3;
    color: ${report.teal};
    margin: 20px 0 8px;
  }
  .page-body > h1:first-child,
  .page-body > h2:first-child,
  .page-body > h3:first-child { margin-top: 0; }
  p { margin: 0 0 8px; }
  .lede { color: ${report.secondary}; margin-bottom: 16px; }

  /* Tables ---------------------------------------------------------------- */
  /* Hairline row rules only: no fills, no zebra, no vertical rules. */
  table { width: 100%; border-collapse: collapse; font-size: 10pt; }
  th, td {
    padding: 6px 10px 6px 0;
    text-align: left;
    vertical-align: top;
    border: 0;
    border-bottom: 1px solid ${report.hairline};
    background: none;
  }
  th {
    font-weight: 600;
    color: ${report.secondary};
    white-space: nowrap;
  }
  td:last-child, th:last-child { padding-right: 0; }
  .num { text-align: right; font-variant-numeric: tabular-nums; }
  tbody tr:last-child td { border-bottom: 0; }

  /* The daily log carries far more columns than a summary table, so it drops a
     point size and tightens its gutters rather than wrapping every heading. */
  table.dense { font-size: 8pt; table-layout: fixed; }
  table.dense th, table.dense td {
    /* 4px gutters rather than 6px: across 23 columns that reclaims ~46px, which
       is the difference between headings fitting and splitting mid-word. */
    padding: 4px 4px 4px 0;
    white-space: normal;
    /* Last-resort break. Headings are sized to fit without it, but overlapping
       columns are far worse than an occasional split word. */
    word-wrap: break-word;
    overflow-wrap: break-word;
  }
  table.dense .nowrap { white-space: nowrap; }

  /* Plain list, no bullet glyphs. */
  ul.plain { list-style: none; margin: 0; padding: 0; }
  ul.plain li {
    padding: 6px 0;
    border-bottom: 1px solid ${report.hairline};
  }
  ul.plain li:last-child { border-bottom: 0; }

  /* Charts ---------------------------------------------------------------- */
  .chart { margin: 4px 0 8px; }
  .chart-note {
    font-size: 9pt;
    color: ${report.muted};
    margin-top: 4px;
  }

  /* Footer ---------------------------------------------------------------- */
  .footer {
    flex: 0 0 auto;
    margin-top: 18px;
    padding-top: 6px;
    border-top: 1px solid ${report.hairline};
    font-size: 8pt;
    color: ${report.muted};
  }
`;

// ── Document assembly ────────────────────────────────────────────────────────

type DocumentOptions = {
  fontCss: string;
  /** Child name as shown top-right. */
  patient: string;
  /** Human-readable date range, e.g. "1 Jul 2026 – 31 Jul 2026". */
  range: string;
  /** One entry per printed page, in order. */
  pages: string[];
  orientation?: Orientation;
};

/**
 * Wraps page bodies in the shared letterhead/footer chrome.
 *
 * Pages are explicit rather than left to the print engine because the footer
 * has to number them, and no WebKit-based print pipeline supports CSS page
 * counters. The letterhead repeats on every page so a report that gets split
 * or re-stapled in a clinic still identifies its patient on each sheet.
 */
export const renderReportDocument = ({
  fontCss,
  patient,
  range,
  pages,
  orientation = "portrait",
}: DocumentOptions): string => {
  const total = pages.length;
  const sheets = pages
    .map(
      (bodyHtml, index) => `
      <section class="page">
        <header class="letterhead">
          <div class="wordmark">enco<i>.</i></div>
          <div class="letterhead-meta">
            <div><span class="label">Patient:</span> ${escapeHtml(patient)}</div>
            <div><span class="label">Range:</span> ${escapeHtml(range)}</div>
          </div>
        </header>
        <hr class="rule" />
        <div class="page-body">${bodyHtml}</div>
        <div class="footer">
          Logged by a parent/caregiver in Enco Tracker &middot; ${escapeHtml(range)} &middot; page ${index + 1} of ${total}
        </div>
      </section>`
    )
    .join("");

  return `<!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <style>${fontCss}${baseCss(orientation)}</style>
      </head>
      <body>${sheets}</body>
    </html>`;
};

// ── Charts ───────────────────────────────────────────────────────────────────

type ChartOptions = {
  labels: string[];
  values: number[];
  /** Indices carrying a milestone; these get the apricot marker. */
  milestones?: Set<number>;
  /** Caption naming the milestones, printed under the chart. */
  note?: string;
};

const CHART_W = 480;
const CHART_H = 130;
// Headroom above the tallest column for its value label, plus the apricot
// milestone cap that sits between the two.
const PLOT_TOP = 22;
const AXIS_H = 18;

/**
 * Column chart as inline SVG: one teal series, flat-topped bars (no rounded
 * corners), apricot caps only where a milestone falls in that bucket.
 */
export const renderBarChart = ({ labels, values, milestones, note }: ChartOptions): string => {
  if (!values.length) {
    return `<div class="chart-note">Not enough data to chart yet.</div>`;
  }
  const maxValue = Math.max(1, ...values);
  const plotH = CHART_H - AXIS_H - PLOT_TOP;
  const slot = CHART_W / values.length;
  const barW = Math.min(28, slot * 0.55);

  const bars = values
    .map((value, index) => {
      const h = (value / maxValue) * plotH;
      const x = index * slot + (slot - barW) / 2;
      const y = PLOT_TOP + (plotH - h);
      const isMilestone = milestones?.has(index);
      const cap = isMilestone
        ? `<rect x="${x}" y="${y - 4}" width="${barW}" height="3" fill="${report.apricot}" />`
        : "";
      return `
        <rect x="${x}" y="${y}" width="${barW}" height="${h}" fill="${report.teal}" />
        ${cap}
        <text x="${x + barW / 2}" y="${y - (isMilestone ? 8 : 4)}" text-anchor="middle" font-family="Public Sans, Helvetica, sans-serif" font-size="9" fill="${report.body}">${value}</text>
        <text x="${x + barW / 2}" y="${CHART_H - 5}" text-anchor="middle" font-family="Public Sans, Helvetica, sans-serif" font-size="9" fill="${report.muted}">${escapeHtml(labels[index] ?? "")}</text>`;
    })
    .join("");

  return `
    <div class="chart">
      <svg width="100%" viewBox="0 0 ${CHART_W} ${CHART_H}" xmlns="http://www.w3.org/2000/svg">
        <line x1="0" y1="${CHART_H - AXIS_H}" x2="${CHART_W}" y2="${CHART_H - AXIS_H}" stroke="${report.hairline}" stroke-width="1" />
        ${bars}
      </svg>
      ${note ? `<div class="chart-note">${escapeHtml(note)}</div>` : ""}
    </div>`;
};

/**
 * Line chart as inline SVG: one teal polyline, teal points, apricot points
 * where a milestone lands.
 */
export const renderLineChart = ({ labels, values, milestones, note }: ChartOptions): string => {
  if (!values.length) {
    return `<div class="chart-note">Not enough stool intervals yet.</div>`;
  }
  const maxValue = Math.max(1, ...values);
  const plotH = CHART_H - AXIS_H - PLOT_TOP;
  const step = values.length > 1 ? (CHART_W - 32) / (values.length - 1) : 0;
  const pointAt = (value: number, index: number) => ({
    x: 16 + index * step,
    y: PLOT_TOP + (plotH - (value / maxValue) * plotH),
  });

  const points = values.map((value, index) => {
    const { x, y } = pointAt(value, index);
    return `${x},${y}`;
  });

  const dots = values
    .map((value, index) => {
      const { x, y } = pointAt(value, index);
      const isMilestone = milestones?.has(index);
      return `<circle cx="${x}" cy="${y}" r="${isMilestone ? 4 : 2.5}" fill="${isMilestone ? report.apricot : report.teal}" />`;
    })
    .join("");

  // Only every other label when the series is dense, so the axis stays legible.
  const labelStride = values.length > 12 ? Math.ceil(values.length / 12) : 1;
  const axis = labels
    .map((label, index) => {
      if (index % labelStride !== 0) return "";
      const { x } = pointAt(values[index] ?? 0, index);
      return `<text x="${x}" y="${CHART_H - 5}" text-anchor="middle" font-family="Public Sans, Helvetica, sans-serif" font-size="9" fill="${report.muted}">${escapeHtml(label)}</text>`;
    })
    .join("");

  return `
    <div class="chart">
      <svg width="100%" viewBox="0 0 ${CHART_W} ${CHART_H}" xmlns="http://www.w3.org/2000/svg">
        <line x1="0" y1="${CHART_H - AXIS_H}" x2="${CHART_W}" y2="${CHART_H - AXIS_H}" stroke="${report.hairline}" stroke-width="1" />
        <polyline points="${points.join(" ")}" fill="none" stroke="${report.teal}" stroke-width="1.5" />
        ${dots}
        ${axis}
      </svg>
      ${note ? `<div class="chart-note">${escapeHtml(note)}</div>` : ""}
    </div>`;
};
