// Assertions over the generated theme family. The build itself already runs
// JSON Schema validation; these tests lock down the mapping semantics:
// palette application, accent baking, HC overrides, One-key coverage and
// build determinism.
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import Ajv from 'ajv';
import { describe, expect, it } from 'vitest';
import { buildFamily, buildVariantColors, resolveAccent } from '../scripts/build-themes';
import { formatHex, mix, parseHex, applyColor, type ThemeFamily } from '../scripts/lib';
import oneUiKeys from './one-ui-keys.json';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '..');

const VARIANTS = [
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
];

const family = buildFamily();
const onDisk: ThemeFamily = JSON.parse(
	readFileSync(path.join(root, 'themes', 'my-dark-theme.json'), 'utf8'),
);
const byName = new Map(family.themes.map((t) => [t.name, t]));
const themeOf = (variant: string, hc = false): NonNullable<ReturnType<typeof byName.get>> => {
	const name = `My Dark Theme ${variant.charAt(0).toUpperCase()}${variant.slice(1)}${hc ? ' High Contrast' : ''}`;
	const t = byName.get(name);
	if (!t) throw new Error(`theme not found: ${name}`);
	return t;
};

const HEX_RE = /^#[0-9a-f]{6}([0-9a-f]{2})?$/;

function expectAllColorsValid(f: ThemeFamily): void {
	const check = (v: unknown, where: string): void => {
		if (typeof v === 'string') {
			if (v.startsWith('#')) expect(v).toMatch(HEX_RE);
		} else if (v && typeof v === 'object') {
			for (const [k, child] of Object.entries(v)) check(child, `${where}.${k}`);
		}
	};
	for (const t of f.themes) check(t.style, t.name);
}

describe('family shape', () => {
	it('has 20 dark themes with correct names', () => {
		expect(family.themes).toHaveLength(20);
		expect(family.name).toBe('My Dark Theme');
		for (const v of VARIANTS) {
			expect(byName.has(`My Dark Theme ${v[0]!.toUpperCase()}${v.slice(1)}`)).toBe(true);
			expect(byName.has(`My Dark Theme ${v[0]!.toUpperCase()}${v.slice(1)} High Contrast`)).toBe(true);
		}
		for (const t of family.themes) expect(t.appearance).toBe('dark');
	});

	it('covers every UI key used by Zed\'s One theme', () => {
		for (const t of family.themes) {
			for (const key of oneUiKeys as string[]) {
				expect(t.style[key], `${t.name} missing ${key}`).toBeDefined();
			}
		}
	});

	it('emits only valid hex colors', () => {
		expectAllColorsValid(family);
	});
});

describe('schema & determinism', () => {
	it('validates against the Zed theme JSON schema', () => {
		const schema = JSON.parse(readFileSync(path.join(root, 'scripts', 'theme.schema.json'), 'utf8'));
		const validate = new Ajv().compile(schema);
		expect(validate(family)).toBe(true);
	});

	it('builds byte-identical output on repeat runs', () => {
		const again = buildFamily();
		expect(JSON.stringify(again)).toBe(JSON.stringify(family));
	});

	it('matches the file on disk (rebuild before testing)', () => {
		expect(JSON.stringify(onDisk)).toBe(JSON.stringify(family));
	});
});

describe('accent baking (blue #5393ff)', () => {
	const accent = formatHex(parseHex(resolveAccent('blue')));

	it('surfaces the accent in text.accent / icon.accent / links', () => {
		for (const t of family.themes) {
			expect(t.style['text.accent']).toBe(accent);
			expect(t.style['icon.accent']).toBe(accent);
			expect(t.style['link_text.hover']).toBe(accent);
		}
	});

	it('applies per-key accent alphas (element.active @ 0.15)', () => {
		for (const t of family.themes) {
			expect(t.style['element.active']).toBe(formatHex({ ...parseHex(accent), a: 0.15 }));
		}
	});

	it('tints the active search match with the accent', () => {
		for (const t of family.themes) {
			expect(t.style['search.active_match_background']).toBe(formatHex({ ...parseHex(accent), a: 0.25 }));
		}
	});
});

describe('palette application', () => {
	const palettes = JSON.parse(readFileSync(path.join(root, 'data', 'palettes.json'), 'utf8')) as Record<
		string,
		Record<string, string>
	>;

	it.each(VARIANTS)('%s: syntax colors follow template × palette', (variant) => {
		const palette = palettes[variant] ?? {};
		const t = themeOf(variant);
		const syntax = t.style.syntax as Record<string, { color: string; font_style?: string }>;
		const cases: Array<[string, string, string | undefined]> = [
			['string', '#C3E88D', undefined],
			['keyword', '#89DDFF', undefined],
			['function', '#82AAFF', undefined],
			['comment', '#546E7A', 'italic'],
			['type', '#FFCB6B', undefined],
			['number', '#F78C6C', undefined],
			['boolean', '#ff9cac', undefined],
			['property', '#f07178', undefined],
			['variable', '#D8DFDF', undefined],
			['namespace', '#f07178', 'italic'],
		];
		for (const [key, base, fontStyle] of cases) {
			const expected = formatHex(parseHex(applyColor(base, palette)));
			expect(syntax[key]!.color, `${variant}.${key}`).toBe(expected);
			expect(syntax[key]!.font_style, `${variant}.${key} font`).toBe(fontStyle);
		}
	});

	it.each(VARIANTS)('%s: terminal ansi colors come from the variant data', (variant) => {
		const t = themeOf(variant);
		const colors = buildVariantColors(variant, false, resolveAccent('blue'));
		const ansi = t.style['terminal.ansi.blue'] as string;
		expect(ansi).toBe(formatHex(parseHex(colors['terminal.ansiBlue']!)));
	});
});

describe('high contrast', () => {
	it('applies per-variant HC overrides (carbon editor background)', () => {
		const hc = JSON.parse(
			readFileSync(path.join(root, 'data', 'hc-overrides.json'), 'utf8'),
		) as Record<string, Record<string, string>>;
		const t = themeOf('carbon', true);
		expect(t.style['editor.background']).toBe(formatHex(parseHex(hc['carbon']!['editor.background']!)));
	});

	it('keeps non-accentable override keys exact for every variant', () => {
		const hc = JSON.parse(
			readFileSync(path.join(root, 'data', 'hc-overrides.json'), 'utf8'),
		) as Record<string, Record<string, string>>;
		const accentable = JSON.parse(
			readFileSync(path.join(root, 'data', 'customization.json'), 'utf8'),
		) as { accentable: Record<string, number> };
		for (const [variant, overrides] of Object.entries(hc)) {
			const t = themeOf(variant, true);
			const merged = buildVariantColors(variant, true, resolveAccent('blue'));
			for (const [key, value] of Object.entries(overrides)) {
				if (key in accentable.accentable) continue; // accent wins by design
				expect(formatHex(parseHex(merged[key]!)), `${variant} HC ${key}`).toBe(formatHex(parseHex(value)));
				// The baked Zed style must reflect it somewhere: spot-check editor keys directly.
				if (key === 'editor.background') expect(t.style['editor.background']).toBe(formatHex(parseHex(value)));
			}
		}
	});
});

describe('terminal dim synthesis', () => {
	it('mixes normal ansi colors into the terminal background', () => {
		const t = themeOf('carbon');
		const normal = t.style['terminal.ansi.blue'] as string;
		const bg = t.style['terminal.background'] as string;
		expect(t.style['terminal.ansi.dim_blue']).toBe(mix(normal, bg, 0.45));
	});
});

describe('fonts', () => {
	it('carries italic and weight from the template', () => {
		const t = themeOf('teal');
		const syntax = t.style.syntax as Record<string, { font_style?: string; font_weight?: number }>;
		expect(syntax['comment']!.font_style).toBe('italic');
		expect(syntax['variable.parameter']!.font_style).toBe('italic');
		expect(syntax['keyword.control']!.font_style).toBe('italic');
		expect(syntax['emphasis.strong']!.font_weight).toBe(700);
	});
});

describe('Zed TS grammar ground truth (2026-10-24 feedback)', () => {
	it('styles const/type keywords purple via keyword.declaration', () => {
		const t = themeOf('teal');
		const syntax = t.style.syntax as Record<string, { color: string; font_style?: string }>;
		expect(syntax['keyword.declaration']!.color).toBe(formatHex(parseHex('#C792EA')));
	});

	it('styles import/export/from cyan italic via keyword.import', () => {
		const t = themeOf('teal');
		const syntax = t.style.syntax as Record<string, { color: string; font_style?: string }>;
		expect(syntax['keyword.import']!.color).toBe(formatHex(parseHex('#89DDFF')));
		expect(syntax['keyword.import']!.font_style).toBe('italic');
	});

	it('brightens hairline borders above the VS Code source alphas', () => {
		// carbon's editorGroup.border base is #d9d9d9; other variants derive their
		// hairlines from their own foreground family (e.g. teal #d8dfdf).
		const t = themeOf('carbon');
		expect(t.style['border']).toBe('#ffffff24');
		expect(t.style['border.variant']).toBe('#d9d9d91f');
		expect(t.style['pane_group.border']).toBe('#d9d9d91f');
	});
});
