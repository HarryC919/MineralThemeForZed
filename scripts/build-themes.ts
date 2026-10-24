// Theme family builder: data/ -> themes/my-dark-theme.json (Zed ThemeFamily).
//
// Replicates the merge semantics of the VS Code project's build-themes.ts:
//   colors = ui-shared + variants/<v> (+ hc-overrides when HC)
//   then the 48 accentable keys are re-baked to the configured accent
//   (alpha >= 1 -> 6-digit, otherwise 8-digit), matching the VS Code
//   factory-baseline behavior (default accent: blue).
// Syntax styles come from syntax-map.ts resolved through the variant palette.
//
// Usage:
//   npm run build                          # default accent (blue)
//   npx tsx scripts/build-themes.ts --accent=purple   # or any #hex
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import Ajv from 'ajv';
import {
	applyColor,
	cap,
	formatHex,
	parseHex,
	readJson,
	writeJson,
	type ThemeContent,
	type ThemeFamily,
} from './lib';
import { buildUiStyle } from './ui-map';
import { buildSyntaxStyle } from './syntax-map';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dataDir = path.join(root, 'data');
const outDir = path.join(root, 'themes');

const DEFAULT_ACCENT = 'blue';
const FAMILY_NAME = 'My Dark Theme';
const AUTHOR = 'Harry';

const VARIANT_ORDER = [
	'carbon',
	'anthracite',
	'clay',
	'deepforest',
	'graphene',
	'montana',
	'ocean',
	'palenight',
	'sand',
	'teal',
] as const;

type Palette = Record<string, string>;
type ColorMap = Record<string, string>;

const tokenTemplate = readJson<Array<{ name?: string; scope?: string | string[]; settings: Record<string, string> }>>(
	path.join(dataDir, 'tokenColors.json'),
);
const uiShared = readJson<ColorMap>(path.join(dataDir, 'ui-shared.json'));
const palettes = readJson<Record<string, Palette>>(path.join(dataDir, 'palettes.json'));
const hcOverridesAll = readJson<Record<string, ColorMap>>(path.join(dataDir, 'hc-overrides.json'));
const customization = readJson<{ accents: Record<string, string>; accentable: Record<string, number> }>(
	path.join(dataDir, 'customization.json'),
);

/** Resolve `--accent=<name|#hex>` against customization.json. */
export function resolveAccent(spec: string): string {
	const hex = spec.startsWith('#')
		? formatHex(parseHex(spec))
		: customization.accents[spec.toLowerCase()];
	if (!hex) {
		throw new Error(
			`Unknown accent "${spec}"; known: ${Object.keys(customization.accents).join(', ')} or #hex`,
		);
	}
	return hex;
}

/** Merged VS Code colors for one variant, with accentable keys re-baked. */
export function buildVariantColors(variant: string, highContrast: boolean, accentHex: string): ColorMap {
	const variantColors = readJson<ColorMap>(path.join(dataDir, 'variants', `${variant}.json`));
	const colors: ColorMap = {
		...uiShared,
		...variantColors,
		...(highContrast ? (hcOverridesAll[variant] ?? {}) : {}),
	};
	for (const [key, alpha] of Object.entries(customization.accentable)) {
		colors[key] = formatHex({ ...parseHex(accentHex), a: Math.min(alpha, 1) });
	}
	return colors;
}

/** Full Zed theme content for one variant. */
export function buildTheme(variant: string, highContrast: boolean, accentHex: string): ThemeContent {
	const palette = palettes[variant];
	if (!palette) throw new Error(`No palette for variant ${variant}`);
	const colors = buildVariantColors(variant, highContrast, accentHex);

	// Collaborator player cursors: a few palette colors, resolved per variant.
	const playerCursors = ['#82aaff', '#c792ea', '#c3e88d'].map((base) =>
		formatHex(parseHex(applyColor(base, palette))),
	);

	const ui = buildUiStyle(colors, {
		accent: accentHex,
		playerCursors,
		accents: Object.values(customization.accents),
	});

	return {
		name: `My Dark Theme ${cap(variant)}${highContrast ? ' High Contrast' : ''}`,
		appearance: 'dark',
		style: { ...ui.style, syntax: buildSyntaxStyle(palette), players: ui.players, accents: ui.accents },
	};
}

/** Assemble the whole theme family. Pure: same inputs -> byte-identical output. */
export function buildFamily(accentSpec: string = DEFAULT_ACCENT): ThemeFamily {
	const accentHex = resolveAccent(accentSpec);
	return {
		author: AUTHOR,
		name: FAMILY_NAME,
		themes: VARIANT_ORDER.flatMap((v) => [buildTheme(v, false, accentHex), buildTheme(v, true, accentHex)]),
	};
}

function validateAgainstSchema(family: ThemeFamily): void {
	const ajv = new Ajv();
	const schema = readJson<Record<string, unknown>>(path.join(root, 'scripts', 'theme.schema.json'));
	const validate = ajv.compile(schema);
	if (!validate(family)) {
		const first = validate.errors?.[0];
		throw new Error(`Schema validation failed: ${first ? `${first.instancePath} ${first.message}` : 'unknown'}`);
	}
}

function main(): void {
	const accentArg = process.argv
		.map((a) => (a.startsWith('--accent=') ? a.slice('--accent='.length) : null))
		.find((a): a is string => a !== null);
	const accentSpec = accentArg ?? DEFAULT_ACCENT;
	const family = buildFamily(accentSpec);
	validateAgainstSchema(family);

	const outFile = path.join(outDir, 'my-dark-theme.json');
	writeJson(outFile, family);
	console.log(
		`✓ ${path.relative(root, outFile)}  themes=${family.themes.length}  accent=${resolveAccent(accentSpec)}`,
	);
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) {
	main();
}
