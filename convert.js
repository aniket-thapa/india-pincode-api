#!/usr/bin/env node
/**
 * India Pincode API — CSV → JSON Converter
 * =========================================
 * Reads the official Department of Posts CSV dataset and outputs:
 *
 *   states.json
 *   states/{state-slug}.json
 *   districts/{state-slug}/{district-slug}.json
 *   pincodes/{pincode}.json
 *
 * Usage:
 *   node convert.js --input data.csv --output ./output
 *
 * Dependencies: none (uses Node.js built-ins only)
 */

const fs   = require("fs");
const path = require("path");

// ─── CLI args ────────────────────────────────────────────────────────────────

const args = process.argv.slice(2);
const get  = (flag) => {
  const i = args.indexOf(flag);
  return i !== -1 ? args[i + 1] : null;
};

const INPUT_CSV  = get("--input")  || "data.csv";
const OUTPUT_DIR = get("--output") || "./output";

if (!fs.existsSync(INPUT_CSV)) {
  console.error(`❌  Input file not found: ${INPUT_CSV}`);
  console.error(`    Usage: node convert.js --input data.csv --output ./output`);
  process.exit(1);
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** "UTTAR PRADESH" → "uttar-pradesh" */
function toSlug(str) {
  return String(str)
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

/** Write JSON, creating parent dirs as needed */
function writeJSON(filePath, data) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, JSON.stringify(data, null, 4), "utf8");
}

/** Parse a CSV line respecting quoted fields (handles commas inside quotes) */
function parseCSVLine(line) {
  const fields = [];
  let cur = "";
  let inQuote = false;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuote && line[i + 1] === '"') { // escaped quote
        cur += '"';
        i++;
      } else {
        inQuote = !inQuote;
      }
    } else if (ch === "," && !inQuote) {
      fields.push(cur.trim());
      cur = "";
    } else {
      cur += ch;
    }
  }
  fields.push(cur.trim());
  return fields;
}

/** Parse lat/lon — return null when value is "NA" or out-of-range */
function parseCoord(val) {
  if (!val || val.trim().toUpperCase() === "NA") return null;
  const n = parseFloat(val);
  return isNaN(n) ? null : n;
}

// ─── Parse CSV ────────────────────────────────────────────────────────────────

console.log(`📂  Reading ${INPUT_CSV} …`);
const raw  = fs.readFileSync(INPUT_CSV, "utf8");
const lines = raw.split(/\r?\n/).filter(Boolean);

// Header row:
// circlename,regionname,divisionname,officename,pincode,officetype,delivery,district,statename,latitude,longitude
const HEADER = parseCSVLine(lines[0]).map(h => h.toLowerCase());

const COL = {
  circle:   HEADER.indexOf("circlename"),
  region:   HEADER.indexOf("regionname"),
  division: HEADER.indexOf("divisionname"),
  office:   HEADER.indexOf("officename"),
  pincode:  HEADER.indexOf("pincode"),
  type:     HEADER.indexOf("officetype"),
  delivery: HEADER.indexOf("delivery"),
  district: HEADER.indexOf("district"),
  state:    HEADER.indexOf("statename"),
  lat:      HEADER.indexOf("latitude"),
  lon:      HEADER.indexOf("longitude"),
};

// Validate header
const missing = Object.entries(COL)
  .filter(([, v]) => v === -1)
  .map(([k]) => k);
if (missing.length) {
  console.error(`❌  Missing CSV columns: ${missing.join(", ")}`);
  process.exit(1);
}

// ─── Accumulate data ──────────────────────────────────────────────────────────

// pincodes[pincode]   → { state, district, offices[] }
const pincodes = {};

// statesMap[stateSlug] → { name, slug, districts: { districtSlug → { name, slug } } }
const statesMap = {};

// districtsMap[stateSlug][districtSlug] → { state, stateName, district, districtName, offices[] }
const districtsMap = {};

let skipped = 0;

console.log(`⚙️   Parsing rows …`);

for (let i = 1; i < lines.length; i++) {
  const row = parseCSVLine(lines[i]);
  if (row.length < 11) { skipped++; continue; }

  const stateName    = (row[COL.state]    || "").trim().toUpperCase();
  const districtName = (row[COL.district] || "").trim().toUpperCase();
  const pincode      = (row[COL.pincode]  || "").trim();

  if (!stateName || !districtName || !/^\d{6}$/.test(pincode)) {
    skipped++;
    continue;
  }

  const stateSlug    = toSlug(stateName);
  const districtSlug = toSlug(districtName);

  const office = {
    officeName:     (row[COL.office]    || "").trim(),
    officeType:     (row[COL.type]      || "").trim(),
    deliveryStatus: (row[COL.delivery]  || "").trim(),
    circleName:     (row[COL.circle]    || "").trim(),
    regionName:     (row[COL.region]    || "").trim(),
    divisionName:   (row[COL.division]  || "").trim(),
    latitude:       parseCoord(row[COL.lat]),
    longitude:      parseCoord(row[COL.lon]),
  };

  // ── pincodes ──
  if (!pincodes[pincode]) {
    pincodes[pincode] = { state: stateName, district: districtName, offices: [] };
  }
  pincodes[pincode].offices.push(office);

  // ── states ──
  if (!statesMap[stateSlug]) {
    statesMap[stateSlug] = { name: stateName, slug: stateSlug, districts: {} };
  }
  statesMap[stateSlug].districts[districtSlug] = {
    name: districtName,
    slug: districtSlug,
  };

  // ── districts ──
  if (!districtsMap[stateSlug]) districtsMap[stateSlug] = {};
  if (!districtsMap[stateSlug][districtSlug]) {
    districtsMap[stateSlug][districtSlug] = {
      state:        stateName,
      stateSlug:    stateSlug,
      district:     districtName,
      districtSlug: districtSlug,
      offices:      [],
    };
  }
  districtsMap[stateSlug][districtSlug].offices.push({
    ...office,
    pincode,
  });
}

console.log(`   Skipped ${skipped} malformed row(s).`);

// ─── Write pincodes/ ──────────────────────────────────────────────────────────

console.log(`\n📝  Writing pincodes/ …`);
let pcCount = 0;
for (const [pincode, data] of Object.entries(pincodes)) {
  writeJSON(path.join(OUTPUT_DIR, "pincodes", `${pincode}.json`), data);
  pcCount++;
}
console.log(`   ✅  ${pcCount} pincode files`);

// ─── Write districts/ ─────────────────────────────────────────────────────────

console.log(`📝  Writing districts/ …`);
let distCount = 0;
for (const [stateSlug, districts] of Object.entries(districtsMap)) {
  for (const [districtSlug, data] of Object.entries(districts)) {
    writeJSON(
      path.join(OUTPUT_DIR, "districts", stateSlug, `${districtSlug}.json`),
      data
    );
    distCount++;
  }
}
console.log(`   ✅  ${distCount} district files`);

// ─── Write states/{state-slug}.json ──────────────────────────────────────────

console.log(`📝  Writing states/ …`);
let stateCount = 0;
for (const [stateSlug, stateData] of Object.entries(statesMap)) {
  const districts = Object.values(stateData.districts)
    .sort((a, b) => a.name.localeCompare(b.name))
    .map(d => ({
      name:         d.name,
      slug:         d.slug,
      officeCount:  (districtsMap[stateSlug]?.[d.slug]?.offices || []).length,
    }));

  writeJSON(path.join(OUTPUT_DIR, "states", `${stateSlug}.json`), {
    name:          stateData.name,
    slug:          stateSlug,
    districtCount: districts.length,
    districts,
  });
  stateCount++;
}
console.log(`   ✅  ${stateCount} state files`);

// ─── Write states.json ────────────────────────────────────────────────────────

console.log(`📝  Writing states.json …`);
const statesList = Object.values(statesMap)
  .sort((a, b) => a.name.localeCompare(b.name))
  .map(s => {
    const dists   = Object.keys(s.districts);
    const offices = dists.reduce(
      (sum, d) => sum + (districtsMap[s.slug]?.[d]?.offices?.length || 0), 0
    );
    return {
      name:          s.name,
      slug:          s.slug,
      districtCount: dists.length,
      officeCount:   offices,
    };
  });

writeJSON(path.join(OUTPUT_DIR, "states.json"), statesList);
console.log(`   ✅  states.json (${statesList.length} states/UTs)`);

// ─── Summary ──────────────────────────────────────────────────────────────────

console.log(`
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅  Done!
   States / UTs  : ${stateCount}
   Districts     : ${distCount}
   Pincodes      : ${pcCount}
   Output dir    : ${OUTPUT_DIR}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

API endpoints (after GitHub Pages deploy):
  GET /states.json
  GET /states/{state-slug}.json
  GET /districts/{state-slug}/{district-slug}.json
  GET /pincodes/{pincode}.json
`);