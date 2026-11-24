const fs = require("fs");
const path = require("path");

const workspace = path.resolve(__dirname, "..");
const roots = [
  path.join(workspace, "pxt-arcade", "libs"),
  path.join(workspace, "pxt-common-packages", "libs")
];
const outJson = path.join(workspace, "docs", "block-catalog.json");
const outMd = path.join(workspace, "docs", "block-catalog.md");

function walk(dir, files = []) {
  if (!fs.existsSync(dir)) return files;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, files);
    else if (/\.(ts|d\.ts|json)$/.test(entry.name)) files.push(full);
  }
  return files;
}

function packageFor(file) {
  let dir = path.dirname(file);
  while (dir !== path.dirname(dir)) {
    const pxt = path.join(dir, "pxt.json");
    if (fs.existsSync(pxt)) {
      try {
        const data = JSON.parse(fs.readFileSync(pxt, "utf8"));
        return data.name || path.basename(dir);
      } catch {}
    }
    dir = path.dirname(dir);
  }
  return "arcade";
}

function stripComment(text) {
  return text.replace(/^\s*\/\/\/?\s?/, "").replace(/^\s*\*\s?/, "").trim();
}

function parseAnnotations(lines, start) {
  const annotations = [];
  for (let i = start - 1; i >= 0 && /^\s*\/\//.test(lines[i]); i--) {
    const line = stripComment(lines[i]);
    if (!line.startsWith("%")) continue;
    annotations.unshift(line.slice(1).trim());
  }
  return annotations;
}

function parseParamAnnotations(annotations) {
  const params = [];
  for (const annotation of annotations) {
    if (!annotation.startsWith("param")) continue;
    const match = /^param(?:\.[^=]+)?(?:\s+)?(?:(\w+)\s*)?(?:=)?\s*(.*)$/.exec(annotation);
    if (match) {
      const name = match[1] || "";
      const description = match[2] || "";
      params.push({ name, description });
    }
  }
  return params;
}

function apiSymbol(lines, index) {
  const end = Math.min(lines.length, index + 12);
  for (let i = index; i < end; i++) {
    const line = lines[i];
    let match = /^\s*(?:export\s+)?(?:declare\s+)?(?:namespace|class)\s+([\w$.]+)/.exec(line);
    if (match) return match[1];
    match = /^\s*(?:export\s+)?(?:declare\s+)?function\s+([\w$.]+)/.exec(line);
    if (match) return match[1];
    match = /^\s*(?:export\s+)?(?:static\s+)?([\w$]+)\s*\([^;]*\)/.exec(line);
    if (match) return match[1];
  }
  return "";
}

const catalog = [];
const seen = new Set();
for (const root of roots) {
  for (const file of walk(root)) {
    if (!/\.(ts|d\.ts)$/.test(file)) continue;
    const lines = fs.readFileSync(file, "utf8").split(/\r?\n/);
    let namespace = "";
    for (let i = 0; i < lines.length; i++) {
      const namespaceMatch = /^\s*(?:export\s+)?namespace\s+([\w$.]+)/.exec(lines[i]);
      if (namespaceMatch) namespace = namespaceMatch[1];
      if (!/%\s*block(?:=|\s)/.test(lines[i])) continue;

      const annotations = parseAnnotations(lines, i + 1);
      const all = annotations.join(" ");
      const blockAnnotation = annotations.find(a => /^block(?:=|\s)/.test(a));
      if (!blockAnnotation) continue;
      const blockIdAnnotation = annotations.find(a => /^blockId=/.test(a));
      const blockId = blockIdAnnotation
        ? blockIdAnnotation.slice("blockId=".length).trim()
        : "";
      const displayMatch = /^block(?:=|\s)(.*)$/.exec(blockAnnotation);
      const displayText = displayMatch
        ? displayMatch[1].trim().replace(/^=/, "").replace(/^"|"$/g, "").trim()
        : "";
      const symbol = apiSymbol(lines, i + 1);
      const key = `${blockId}|${namespace}.${symbol}|${displayText}|${file}`;
      if (seen.has(key)) continue;
      seen.add(key);

      const category = (annotations.find(a => /^group=/.test(a)) || "").replace(/^group=/, "").trim();
      const help = (annotations.find(a => /^help=/.test(a)) || "").replace(/^help=/, "").trim();
      const hidden = annotations.some(a => /^hidden(?:=|\s)/.test(a));
      const deprecated = annotations.some(a => /^deprecated(?:=|\s)/.test(a));
      catalog.push({
        blockId,
        apiSymbol: namespace && symbol ? `${namespace}.${symbol}` : symbol,
        displayText,
        category,
        package: packageFor(file),
        sourceFile: path.relative(workspace, file).replace(/\\/g, "/"),
        inputTypes: [],
        defaultValues: [],
        dropdownChoices: [],
        shadowBlocks: [],
        expandableInputs: [],
        help,
        deprecated,
        hidden,
        targetRestrictions: [],
        hardwareRestrictions: [],
        parameterDetails: parseParamAnnotations(annotations)
      });
    }
  }
}

catalog.sort((a, b) => (a.category || "").localeCompare(b.category || "") ||
  (a.apiSymbol || "").localeCompare(b.apiSymbol || "") ||
  (a.displayText || "").localeCompare(b.displayText || ""));

fs.mkdirSync(path.dirname(outJson), { recursive: true });
fs.writeFileSync(outJson, JSON.stringify({
  generatedAt: new Date().toISOString(),
  arcadeVersion: JSON.parse(fs.readFileSync(path.join(workspace, "pxt-arcade", "package.json"), "utf8")).version,
  pxtVersion: JSON.parse(fs.readFileSync(path.join(workspace, "pxt-arcade", "node_modules", "pxt-core", "package.json"), "utf8")).version,
  count: catalog.length,
  blocks: catalog
}, null, 2));

const md = [
  "# MakeCode Arcade block catalog",
  "",
  `Generated from PXT and Arcade source metadata. ${catalog.length} source-level block definitions found.`,
  "",
  "| Block ID | API symbol | Display text | Category | Package | Help | Deprecated | Hidden |",
  "|---|---|---|---|---|---|---|---|",
  ...catalog.map(b => `| ${b.blockId || ""} | ${b.apiSymbol} | ${b.displayText.replace(/\|/g, "\\|")} | ${b.category} | ${b.package} | ${b.help} | ${b.deprecated ? "yes" : "no"} | ${b.hidden ? "yes" : "no"} |`)
];
fs.writeFileSync(outMd, md.join("\n") + "\n");
console.log(`Wrote ${catalog.length} entries to ${path.relative(workspace, outJson)} and ${path.relative(workspace, outMd)}`);
