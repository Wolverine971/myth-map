// scripts/build-locations.ts
//
// Reads `Mythmap locations - Sheet1.csv`, normalizes rows, parses addresses,
// (optionally) geocodes via Census→Mapbox fallback, and emits
// `src/lib/data/locations.json` in the shape the UI expects.
//
// Usage:
//   pnpm build:locations --parse-only   # parse CSV only, write scripts/.parsed.json
//   pnpm build:locations                # full pipeline incl. geocoding (Task 2)

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

const CSV_PATH = path.join(ROOT, 'Mythmap locations - Sheet1.csv');
const PARSED_OUT = path.join(ROOT, 'scripts/.parsed.json');
const FINAL_OUT = path.join(ROOT, 'src/lib/data/locations.json');
const CACHE_PATH = path.join(ROOT, 'scripts/.geocode-cache.json');
const OVERRIDES_PATH = path.join(ROOT, 'scripts/address-overrides.json');
const ENV_PATH = path.join(ROOT, '.env');

const args = new Set(process.argv.slice(2));
const PARSE_ONLY = args.has('--parse-only');
const FORCE_REGEOCODE = args.has('--force-regeocode');

// --- RFC4180-ish CSV parser (handles quoted fields w/ embedded commas + "" escapes) ---
function parseCSV(text: string): string[][] {
	const rows: string[][] = [];
	let row: string[] = [];
	let field = '';
	let inQuotes = false;
	for (let i = 0; i < text.length; i++) {
		const c = text[i];
		if (inQuotes) {
			if (c === '"') {
				if (text[i + 1] === '"') {
					field += '"';
					i++;
				} else {
					inQuotes = false;
				}
			} else {
				field += c;
			}
		} else if (c === '"') {
			inQuotes = true;
		} else if (c === ',') {
			row.push(field);
			field = '';
		} else if (c === '\n') {
			row.push(field);
			rows.push(row);
			row = [];
			field = '';
		} else if (c === '\r') {
			// swallow
		} else {
			field += c;
		}
	}
	if (field.length || row.length) {
		row.push(field);
		rows.push(row);
	}
	return rows;
}

function clean(s: string | undefined): string {
	if (!s) return '';
	return s
		.replace(/[​-‍﻿]/g, '') // zero-width chars
		.replace(/ /g, ' ') // non-breaking space
		.trim()
		.replace(/\s+/g, ' ');
}

const STREET_SUFFIXES = new Set([
	'rd',
	'road',
	'st',
	'street',
	'ave',
	'avenue',
	'blvd',
	'boulevard',
	'dr',
	'drive',
	'ln',
	'lane',
	'ct',
	'court',
	'way',
	'loop',
	'pike',
	'hwy',
	'highway',
	'pl',
	'place',
	'cir',
	'circle',
	'sq',
	'square',
	'pkwy',
	'pky',
	'parkway',
	'ter',
	'terrace',
	'trl',
	'trail'
]);

const STATE_NAMES: Record<string, string> = {
	MD: 'Maryland',
	VA: 'Virginia',
	DE: 'Delaware',
	DC: 'District of Columbia',
	WV: 'West Virginia',
	PA: 'Pennsylvania'
};

function parseAddress(fullAddress: string, state: string, zip: string) {
	let addr = clean(fullAddress);

	// Strip trailing zip (and anything after, e.g. trailing whitespace artifacts)
	if (zip) {
		const idx = addr.lastIndexOf(zip);
		if (idx !== -1) addr = addr.slice(0, idx).trim();
	}

	// Strip trailing "U.S.A." / "USA" / "United States"
	// (no trailing \b — a literal "." is non-word, so \b fails before end-of-string)
	addr = addr.replace(/[,\s]*(?:U\.?S\.?A\.?|United States)[,\s]*$/i, '').trim();

	// Strip trailing state (abbr or full name)
	const fullName = STATE_NAMES[state.toUpperCase()];
	const stateAlternates = [state, fullName].filter(Boolean).join('|');
	if (stateAlternates) {
		const re = new RegExp(`[,\\s]*\\b(${stateAlternates})\\b[,\\s]*$`, 'i');
		addr = addr.replace(re, '').trim();
	}

	// Trim trailing punctuation
	addr = addr.replace(/[,\s]+$/, '').trim();

	const parts = addr.split(',').map(clean).filter(Boolean);
	if (parts.length === 0) return { street: '', city: '' };
	if (parts.length === 1) {
		// No comma between street and city, e.g. "9309 Snowden River Pkwy Columbia".
		// Walk tokens from the end and collect alphabetic tokens until we hit a
		// digit or a street-suffix word — those collected tokens are the city.
		const tokens = parts[0].split(/\s+/);
		let cityStart = tokens.length;
		for (let i = tokens.length - 1; i >= 0; i--) {
			const t = tokens[i].toLowerCase().replace(/[.,]$/, '');
			if (/\d/.test(t)) break;
			if (STREET_SUFFIXES.has(t)) break;
			cityStart = i;
		}
		if (cityStart > 0 && cityStart < tokens.length) {
			return {
				street: tokens.slice(0, cityStart).join(' '),
				city: tokens.slice(cityStart).join(' ')
			};
		}
		return { street: '', city: parts[0] };
	}

	return {
		street: parts.slice(0, -1).join(', '),
		city: parts[parts.length - 1]
	};
}

function parseTags(raw: string | undefined): string[] {
	if (!raw) return [];
	return raw.split(',').map(clean).filter(Boolean);
}

interface ParsedLocation {
	id: number;
	name: string;
	address_line_1: string;
	address_line_2: string;
	city: string;
	state: string;
	zip_code: string;
	full_address: string;
	website: string;
	type: string;
	indoor_outdoor: string;
	price: string;
	notes: string;
	lat: number | null;
	lng: number | null;
	tag_names: string[];
}

type AddressOverride = {
	full_address?: string;
	zip_code?: string;
	state?: string;
	note?: string;
};

function loadOverrides(): Record<string, AddressOverride> {
	if (!fs.existsSync(OVERRIDES_PATH)) return {};
	try {
		return JSON.parse(fs.readFileSync(OVERRIDES_PATH, 'utf8'));
	} catch (err) {
		console.warn(
			`⚠ Failed to parse ${path.relative(ROOT, OVERRIDES_PATH)}: ${(err as Error).message}`
		);
		return {};
	}
}

function loadAndParseCSV(): { locations: ParsedLocation[]; issues: string[] } {
	const csv = fs.readFileSync(CSV_PATH, 'utf8');
	const rows = parseCSV(csv);
	const header = rows[0].map(clean);
	const idx = (name: string) => header.indexOf(name);

	const cols = {
		name: idx('Name'),
		type: idx('Type'),
		tags: idx('Tags'),
		io: idx('Indoor/Outdoor'),
		price: idx('Price'),
		link: idx('Link'),
		notes: idx('Notes'),
		addr: idx('Full Address'),
		zip: idx('Zip Code'),
		state: idx('State')
	};

	const overrides = loadOverrides();
	const overridesApplied: string[] = [];

	const locations: ParsedLocation[] = [];
	const issues: string[] = [];

	rows.slice(1).forEach((row, i) => {
		const name = clean(row[cols.name]);
		if (!name) return; // skip empty/blank rows

		const id = i + 1;
		const override = overrides[name];

		let fullAddress = clean(row[cols.addr]);
		let state = clean(row[cols.state]).toUpperCase();
		let zip = clean(row[cols.zip]);

		if (override) {
			if (override.full_address) fullAddress = override.full_address;
			if (override.state) state = override.state.toUpperCase();
			if (override.zip_code) zip = override.zip_code;
			overridesApplied.push(name);
		}

		const { street, city } = parseAddress(fullAddress, state, zip);

		const loc: ParsedLocation = {
			id,
			name,
			address_line_1: street,
			address_line_2: '',
			city,
			state,
			zip_code: zip,
			full_address: fullAddress,
			website: clean(row[cols.link]),
			type: clean(row[cols.type]),
			indoor_outdoor: clean(row[cols.io]),
			price: clean(row[cols.price]),
			notes: clean(row[cols.notes]),
			lat: null,
			lng: null,
			tag_names: parseTags(row[cols.tags])
		};

		if (!street) issues.push(`row ${id} "${name}": no street parsed from "${fullAddress}"`);
		if (!city) issues.push(`row ${id} "${name}": no city parsed from "${fullAddress}"`);
		if (!zip) issues.push(`row ${id} "${name}": missing zip`);

		locations.push(loc);
	});

	if (overridesApplied.length) {
		console.log(
			`Applied ${overridesApplied.length} address override(s): ${overridesApplied.join(', ')}`
		);
	}

	return { locations, issues };
}

function buildOutputShape(locations: ParsedLocation[]) {
	// Mirror the old Supabase response shape so the UI doesn't have to change:
	//   data.locations    = content_locations rows, each with { ..., location: {...} }
	//   data.tags         = [{ id, name }]
	//   data.locationTags = location_tags rows, each with { ..., location: {...}, tags: {...} }
	const tagSet = new Map<string, number>();
	for (const l of locations) {
		for (const t of l.tag_names) {
			if (!tagSet.has(t)) tagSet.set(t, tagSet.size + 1);
		}
	}
	const tags = Array.from(tagSet, ([name, id]) => ({ id, name }));

	const wrappedLocations = locations.map((l) => ({
		id: l.id,
		website: l.website,
		location: {
			id: l.id,
			name: l.name,
			address_line_1: l.address_line_1,
			address_line_2: l.address_line_2,
			city: l.city,
			state: l.state,
			zip_code: l.zip_code,
			full_address: l.full_address,
			website: l.website,
			type: l.type,
			indoor_outdoor: l.indoor_outdoor,
			price: l.price,
			notes: l.notes,
			lat: l.lat,
			lng: l.lng
		}
	}));

	let ltId = 1;
	const locationTags = locations.flatMap((l) =>
		l.tag_names.map((tagName) => ({
			id: ltId++,
			location: {
				id: l.id,
				name: l.name,
				city: l.city,
				state: l.state
			},
			tags: { id: tagSet.get(tagName)!, name: tagName }
		}))
	);

	return { locations: wrappedLocations, tags, locationTags };
}

function printSummary(locations: ParsedLocation[], issues: string[]) {
	const cities = [...new Set(locations.map((l) => l.city).filter(Boolean))].sort();
	const states = [...new Set(locations.map((l) => l.state).filter(Boolean))].sort();
	const allTags = [...new Set(locations.flatMap((l) => l.tag_names))].sort();
	const types = [...new Set(locations.map((l) => l.type).filter(Boolean))].sort();

	console.log(`\n=== Summary ===`);
	console.log(`Locations: ${locations.length}`);
	console.log(`States (${states.length}): ${states.join(', ')}`);
	console.log(`Cities (${cities.length}): ${cities.join(', ')}`);
	console.log(`Types (${types.length}): ${types.join(', ')}`);
	console.log(`Tags (${allTags.length}): ${allTags.join(', ')}`);

	if (issues.length) {
		console.log(`\n⚠ ${issues.length} issue(s):`);
		issues.forEach((i) => console.log(`  - ${i}`));
	} else {
		console.log(`\nNo parse issues.`);
	}
}

// --- Env loading (no SvelteKit at script time, so we parse .env ourselves) ---
function loadEnv(): Record<string, string> {
	if (!fs.existsSync(ENV_PATH)) return {};
	const out: Record<string, string> = {};
	for (const line of fs.readFileSync(ENV_PATH, 'utf8').split('\n')) {
		const trimmed = line.trim();
		if (!trimmed || trimmed.startsWith('#')) continue;
		const eq = trimmed.indexOf('=');
		if (eq === -1) continue;
		const key = trimmed.slice(0, eq).trim();
		let val = trimmed.slice(eq + 1).trim();
		if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
			val = val.slice(1, -1);
		}
		out[key] = val;
	}
	return out;
}

// --- Geocoding cache (keyed by full_address) ---
type GeoHit = { lat: number; lng: number; source: 'census' | 'mapbox'; queriedAt: string };
type GeoMiss = { lat: null; lng: null; source: 'miss'; queriedAt: string };
type GeoEntry = GeoHit | GeoMiss;

function loadCache(): Record<string, GeoEntry> {
	if (!fs.existsSync(CACHE_PATH)) return {};
	try {
		return JSON.parse(fs.readFileSync(CACHE_PATH, 'utf8'));
	} catch {
		return {};
	}
}

function saveCache(cache: Record<string, GeoEntry>) {
	fs.mkdirSync(path.dirname(CACHE_PATH), { recursive: true });
	fs.writeFileSync(CACHE_PATH, JSON.stringify(cache, null, 2));
}

// --- Geocoders ---
async function geocodeCensus(loc: ParsedLocation): Promise<GeoHit | null> {
	if (!loc.address_line_1 || !loc.city || !loc.state || !loc.zip_code) return null;
	const params = new URLSearchParams({
		street: loc.address_line_1,
		city: loc.city,
		state: loc.state,
		zip: loc.zip_code,
		benchmark: 'Public_AR_Current',
		format: 'json'
	});
	const url = `https://geocoding.geo.census.gov/geocoder/locations/address?${params.toString()}`;
	try {
		const res = await fetch(url);
		if (!res.ok) return null;
		const data: any = await res.json();
		const m = data?.result?.addressMatches?.[0];
		if (!m) return null;
		const lat = m.coordinates?.y;
		const lng = m.coordinates?.x;
		if (typeof lat !== 'number' || typeof lng !== 'number') return null;
		return { lat, lng, source: 'census', queriedAt: new Date().toISOString() };
	} catch (err) {
		console.error(`  census error for "${loc.name}":`, (err as Error).message);
		return null;
	}
}

async function geocodeMapbox(loc: ParsedLocation, token: string): Promise<GeoHit | null> {
	if (!token) return null;
	const search =
		loc.full_address ||
		[loc.address_line_1, loc.city, loc.state, loc.zip_code].filter(Boolean).join(', ');
	const url =
		`https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(search)}.json` +
		`?access_token=${token}&country=us&limit=1&types=address,poi`;
	try {
		const res = await fetch(url);
		if (!res.ok) {
			console.error(`  mapbox HTTP ${res.status} for "${loc.name}"`);
			return null;
		}
		const data: any = await res.json();
		const f = data?.features?.[0];
		if (!f?.center || f.center.length < 2) return null;
		return {
			lat: f.center[1],
			lng: f.center[0],
			source: 'mapbox',
			queriedAt: new Date().toISOString()
		};
	} catch (err) {
		console.error(`  mapbox error for "${loc.name}":`, (err as Error).message);
		return null;
	}
}

async function geocodeAll(locations: ParsedLocation[], mapboxToken: string) {
	const cache = loadCache();
	let hits = 0;
	let misses = 0;
	let cached = 0;
	let bySource = { census: 0, mapbox: 0, miss: 0 };

	for (const loc of locations) {
		const key = loc.full_address;
		if (!FORCE_REGEOCODE && cache[key]) {
			cached++;
			const entry = cache[key];
			loc.lat = entry.lat;
			loc.lng = entry.lng;
			bySource[entry.source]++;
			if (entry.source !== 'miss') hits++;
			else misses++;
			continue;
		}

		process.stdout.write(`  ${loc.name} ... `);
		let result: GeoHit | null = await geocodeCensus(loc);
		if (!result) result = await geocodeMapbox(loc, mapboxToken);

		if (result) {
			loc.lat = result.lat;
			loc.lng = result.lng;
			cache[key] = result;
			hits++;
			bySource[result.source]++;
			console.log(`${result.source} (${result.lat.toFixed(4)}, ${result.lng.toFixed(4)})`);
		} else {
			cache[key] = {
				lat: null,
				lng: null,
				source: 'miss',
				queriedAt: new Date().toISOString()
			};
			misses++;
			bySource.miss++;
			console.log('MISS');
		}

		// Persist cache after each call so a crash mid-run doesn't lose progress
		saveCache(cache);

		// Be polite to free APIs
		await new Promise((r) => setTimeout(r, 150));
	}

	return { hits, misses, cached, bySource };
}

async function main() {
	const { locations, issues } = loadAndParseCSV();
	printSummary(locations, issues);

	fs.mkdirSync(path.dirname(PARSED_OUT), { recursive: true });
	fs.writeFileSync(PARSED_OUT, JSON.stringify(buildOutputShape(locations), null, 2));
	console.log(`\nWrote ${path.relative(ROOT, PARSED_OUT)}`);

	if (PARSE_ONLY) {
		console.log('\n--parse-only set; skipping geocoding.');
		return;
	}

	const env = loadEnv();
	const mapboxToken = env.PUBLIC_MAP_KEY || process.env.PUBLIC_MAP_KEY || '';
	if (!mapboxToken) {
		console.warn('\n⚠ No PUBLIC_MAP_KEY found in .env — Mapbox fallback disabled. Census-only.');
	} else {
		console.log(
			`\nMapbox token loaded: ${mapboxToken.slice(0, 3)}...${mapboxToken.slice(-4)} (length ${mapboxToken.length})`
		);
		// Smoke test before we burn 50+ calls on a bad token.
		const test = await fetch(
			`https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent('Baltimore, MD')}.json?access_token=${mapboxToken}&limit=1`
		);
		console.log(`  smoke test: HTTP ${test.status}${test.ok ? ' ✓' : ' (token rejected)'}`);
		if (!test.ok) {
			const body = await test.text();
			console.log(`  response body: ${body.slice(0, 200)}`);
		}
	}

	console.log(`\n=== Geocoding ${locations.length} locations ===`);
	const stats = await geocodeAll(locations, mapboxToken);

	console.log(
		`\nGeocoding done. Cached: ${stats.cached}, hits: ${stats.hits}, misses: ${stats.misses}`
	);
	console.log(
		`  by source — census: ${stats.bySource.census}, mapbox: ${stats.bySource.mapbox}, miss: ${stats.bySource.miss}`
	);

	const misses = locations.filter((l) => l.lat === null || l.lng === null);
	if (misses.length) {
		console.log(`\n⚠ ${misses.length} location(s) failed to geocode:`);
		misses.forEach((l) => console.log(`  - ${l.name} (${l.full_address})`));
	}

	const finalOutput = buildOutputShape(locations);
	fs.mkdirSync(path.dirname(FINAL_OUT), { recursive: true });
	fs.writeFileSync(FINAL_OUT, JSON.stringify(finalOutput, null, 2));
	console.log(`\nWrote ${path.relative(ROOT, FINAL_OUT)}`);
}

main().catch((err) => {
	console.error(err);
	process.exit(1);
});
