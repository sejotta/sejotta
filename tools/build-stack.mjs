// Generates assets/stack.svg — the "Languages & skills" card for the profile README.
// Everything is plain SVG (no external requests) so it renders identically on GitHub.
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const here = dirname(fileURLToPath(import.meta.url));
const assets = join(here, "..", "assets");

const W = 1000;
const H = 460;

// ---------------------------------------------------------------- palette
const INK = "#0B0B0A";
const BONE = "#F2EEE4";
const MUTED = "#8E887A";
const LIME = "#C9F94A";
const CLAY = "#D9815F";
const line = (a) => `rgba(242,238,228,${a})`;

// ---------------------------------------------------------------- data
// Self-reported split of my day-to-day work. Edit these numbers freely.
const languages = [
  { name: "Python", pct: 35 },
  { name: "C / C++", pct: 31 },
  { name: "MATLAB", pct: 14 },
  { name: "SQL", pct: 8 },
  { name: "Bash", pct: 7 },
  { name: "JavaScript", pct: 5 },
];

// 0–5, honest self-assessment from coursework + projects.
const skills = [
  { label: "EMBEDDED", value: 4.5 },
  { label: "CONTROL", value: 3.9 },
  { label: "PERCEPTION", value: 4.2 },
  { label: "ROBOTICS", value: 4.3 },
  { label: "CAD / 3D", value: 3.9 },
  { label: "SOFTWARE", value: 4.0 },
];

const chips = ["PID", "SLAM", "Sensor fusion", "TinyML", "OpenCV"];

// ---------------------------------------------------------------- fonts
const b64 = (p) => readFileSync(p).toString("base64");
const sg = b64(join(here, "..", "assets", "fonts", "space-grotesk-var.woff2"));
const jb400 = b64(join(here, "..", "assets", "fonts", "jetbrains-mono-400.woff2"));
const jb500 = b64(join(here, "..", "assets", "fonts", "jetbrains-mono-500.woff2"));

const esc = (s) =>
  String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

// ---------------------------------------------------------------- layout
const PAD = 40;
const COL_R = 960;
const DIV_X = 500;
const RADAR_CX = 745;
const RADAR_CY = 264;
const RADAR_R = 80;

const BAR_X = 160;
const BAR_W = 260;
const BAR_SCALE = 40; // a full track equals 40 %
const ROW_TOP = 176;
const ROW_STEP = 40;

// radar geometry
const points = skills.map((s, i) => {
  const a = (-90 + i * 60) * (Math.PI / 180);
  return { ...s, a, cos: Math.cos(a), sin: Math.sin(a) };
});

const radarPoly = points
  .map((p) => {
    const r = (RADAR_R * p.value) / 5;
    return `${(RADAR_CX + p.cos * r).toFixed(2)},${(RADAR_CY + p.sin * r).toFixed(2)}`;
  })
  .join(" ");

const radarGrid = [1, 2, 3, 4, 5]
  .map((i) => {
    const r = (RADAR_R * i) / 5;
    const hex = points
      .map(
        (p) =>
          `${(RADAR_CX + p.cos * r).toFixed(2)},${(RADAR_CY + p.sin * r).toFixed(2)}`
      )
      .join(" ");
    return `<polygon points="${hex}" fill="none" stroke="${line(
      i === 5 ? 0.16 : 0.08
    )}" stroke-width="1"/>`;
  })
  .join("");

const radarAxes = points
  .map(
    (p) =>
      `<line x1="${RADAR_CX}" y1="${RADAR_CY}" x2="${(
        RADAR_CX +
        p.cos * RADAR_R
      ).toFixed(2)}" y2="${(RADAR_CY + p.sin * RADAR_R).toFixed(2)}" stroke="${line(
        0.09
      )}" stroke-width="1"/>`
  )
  .join("");

const radarDots = points
  .map((p) => {
    const r = (RADAR_R * p.value) / 5;
    return `<circle cx="${(RADAR_CX + p.cos * r).toFixed(2)}" cy="${(
      RADAR_CY +
      p.sin * r
    ).toFixed(2)}" r="2.6" fill="${INK}" stroke="${LIME}" stroke-width="1.6"/>`;
  })
  .join("");

const radarLabels = points
  .map((p) => {
    const r = RADAR_R + 24;
    const x = RADAR_CX + p.cos * r;
    const y = RADAR_CY + p.sin * r;
    const anchor =
      Math.abs(p.cos) < 0.15 ? "middle" : p.cos > 0 ? "start" : "end";
    const dy = p.sin > 0.5 ? 9 : p.sin < -0.5 ? 0 : 3;
    return `<text x="${x.toFixed(1)}" y="${(y + dy).toFixed(
      1
    )}" text-anchor="${anchor}" class="mono" font-size="8.6" letter-spacing="1.3" fill="${MUTED}">${esc(
      p.label
    )}</text>`;
  })
  .join("");

// chips, centered on the radar column
const chipH = 21;
const chipGap = 8;
const chipPad = 10;
const chipW = chips.map((c) => c.length * 6.0 + chipPad * 2);
const totalChips = chipW.reduce((a, b) => a + b, 0) + chipGap * (chips.length - 1);
let chipX = RADAR_CX - totalChips / 2;
const chipY = 398;
const chipMarkup = chips
  .map((c, i) => {
    const w = chipW[i];
    const el = `<g><rect x="${chipX.toFixed(1)}" y="${chipY}" width="${w.toFixed(
      1
    )}" height="${chipH}" rx="5" fill="#141412" stroke="${line(
      0.16
    )}"/><text x="${(chipX + w / 2).toFixed(
      1
    )}" y="${chipY + 14}" text-anchor="middle" class="mono" font-size="9.2" letter-spacing="0.4" fill="#BDB6A5">${esc(
      c
    )}</text></g>`;
    chipX += w + chipGap;
    return el;
  })
  .join("");

// bars
const bars = languages
  .map((l, i) => {
    const y = ROW_TOP + i * ROW_STEP;
    const w = (BAR_W * l.pct) / BAR_SCALE;
    return `<g>
      <text x="${PAD}" y="${y}" class="sg" font-size="13.5" font-weight="500" fill="${BONE}">${esc(
      l.name
    )}</text>
      <rect x="${BAR_X}" y="${y - 7}" width="${BAR_W}" height="7" rx="3.5" fill="#171714"/>
      <rect x="${BAR_X}" y="${y - 7}" width="${w.toFixed(
      1
    )}" height="7" rx="3.5" fill="url(#barFill)"/>
      <text x="${COL_R - 490}" y="${y}" text-anchor="end" class="mono" font-size="10.5" fill="${
      i === 0 ? LIME : MUTED
    }">${l.pct}%</text>
    </g>`;
  })
  .join("");

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" role="img" aria-labelledby="t d">
<title id="t">Sergio Toro — languages and skills</title>
<desc id="d">Bar chart of the languages I work in and a radar chart of my embedded, control, perception and software skills.</desc>
<defs>
  <style>
    @font-face{font-family:'Space Grotesk';src:url(data:font/woff2;base64,${sg}) format('woff2');font-weight:300 700;font-style:normal;}
    @font-face{font-family:'JetBrains Mono';src:url(data:font/woff2;base64,${jb400}) format('woff2');font-weight:400;font-style:normal;}
    @font-face{font-family:'JetBrains Mono';src:url(data:font/woff2;base64,${jb500}) format('woff2');font-weight:500;font-style:normal;}
    .sg{font-family:'Space Grotesk','Segoe UI',system-ui,sans-serif;}
    .mono{font-family:'JetBrains Mono',ui-monospace,Consolas,monospace;}
    text{font-variant-ligatures:none;}
  </style>
  <linearGradient id="barFill" x1="0" y1="0" x2="1" y2="0">
    <stop offset="0" stop-color="${LIME}"/>
    <stop offset="1" stop-color="#8FBE2E"/>
  </linearGradient>
  <linearGradient id="areaFill" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0" stop-color="${LIME}" stop-opacity="0.30"/>
    <stop offset="1" stop-color="${LIME}" stop-opacity="0.07"/>
  </linearGradient>
  <radialGradient id="glow" cx="0.88" cy="0.02" r="0.7">
    <stop offset="0" stop-color="${LIME}" stop-opacity="0.07"/>
    <stop offset="0.55" stop-color="${LIME}" stop-opacity="0.02"/>
    <stop offset="1" stop-color="${LIME}" stop-opacity="0"/>
  </radialGradient>
  <clipPath id="card"><rect x="0" y="0" width="${W}" height="${H}" rx="16"/></clipPath>
</defs>

<g clip-path="url(#card)">
  <rect width="${W}" height="${H}" fill="${INK}"/>
  <rect width="${W}" height="${H}" fill="url(#glow)"/>
</g>
<rect x="0.75" y="0.75" width="${W - 1.5}" height="${
  H - 1.5
}" rx="15.5" fill="none" stroke="${line(0.14)}" stroke-width="1.5"/>

<!-- header -->
<text x="${PAD}" y="44" class="mono" font-size="9.5" font-weight="500" letter-spacing="2.2" fill="${LIME}">SERGIO TORO / PROFILE</text>
<text x="${PAD}" y="80" class="sg" font-size="26" font-weight="500" fill="${BONE}">Languages &amp; skills</text>
<text x="${COL_R}" y="44" text-anchor="end" class="mono" font-size="9" letter-spacing="1.6" fill="${MUTED}">SELF-ASSESSED · 2026</text>
<line x1="${PAD}" y1="101" x2="${COL_R}" y2="101" stroke="${line(0.10)}"/>

<!-- column titles -->
<text x="${PAD}" y="131" class="mono" font-size="9.2" font-weight="500" letter-spacing="1.8" fill="${LIME}">LANGUAGES I WORK IN</text>
<text x="530" y="131" class="mono" font-size="9.2" font-weight="500" letter-spacing="1.8" fill="${LIME}">SKILLS BY AREA</text>
<line x1="${PAD}" y1="144" x2="470" y2="144" stroke="${line(0.07)}"/>
<line x1="530" y1="144" x2="${COL_R}" y2="144" stroke="${line(0.07)}"/>

<!-- languages -->
${bars}
<text x="${PAD}" y="418" class="mono" font-size="8.6" fill="${MUTED}" opacity="0.9">Share of my day-to-day work — not a GitHub line count.</text>

<!-- divider -->
<line x1="${DIV_X}" y1="118" x2="${DIV_X}" y2="410" stroke="${line(0.09)}"/>

<!-- radar -->
${radarGrid}
${radarAxes}
<polygon points="${radarPoly}" fill="url(#areaFill)" stroke="${LIME}" stroke-width="1.8" stroke-linejoin="round"/>
${radarDots}
${radarLabels}

<!-- chips -->
${chipMarkup}
</svg>
`;

writeFileSync(join(assets, "stack.svg"), svg, "utf8");
console.log(
  `stack.svg written (${(svg.length / 1024).toFixed(1)} KB, ${languages.length} languages, ${skills.length} skill axes)`
);
