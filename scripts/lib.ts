// Shared utilities for the theme build pipeline: JSON I/O, hex color math,
// and palette application. All emitted colors are normalized to lowercase
// 6-digit (#rrggbb) or 8-digit (#rrggbbaa) form.
import fs from 'node:fs';
import path from 'node:path';

export type Hex = string;

export interface Rgba {
	r: number;
	g: number;
	b: number;
	a: number; // 0..1
}

export function readJson<T>(p: string): T {
	return JSON.parse(fs.readFileSync(p, 'utf8')) as T;
}

export function writeJson(p: string, obj: unknown): void {
	fs.mkdirSync(path.dirname(p), { recursive: true });
	fs.writeFileSync(p, JSON.stringify(obj, null, 2) + '\n');
}

export function parseHex(hex: string): Rgba {
	const m = /^#([0-9a-fA-F]{3,8})$/.exec(hex);
	if (!m) throw new Error(`Invalid hex color: ${hex}`);
	let h = m[1]!;
	if (h.length === 3 || h.length === 4) {
		h = [...h].map((c) => c + c).join('');
	}
	if (h.length !== 6 && h.length !== 8) throw new Error(`Invalid hex color: ${hex}`);
	return {
		r: parseInt(h.slice(0, 2), 16),
		g: parseInt(h.slice(2, 4), 16),
		b: parseInt(h.slice(4, 6), 16),
		a: h.length === 8 ? parseInt(h.slice(6, 8), 16) / 255 : 1,
	};
}

export function formatHex(c: Rgba): Hex {
	const byte = (v: number): string => Math.round(Math.min(255, Math.max(0, v))).toString(16).padStart(2, '0');
	const base = byte(c.r) + byte(c.g) + byte(c.b);
	return c.a >= 1 ? `#${base}` : `#${base}${byte(c.a * 255)}`;
}

export function normalizeHex(hex: string): Hex {
	return formatHex(parseHex(hex));
}

/** Replace the alpha channel of `hex` with `alpha` (0..1). */
export function withAlpha(hex: string, alpha: number): Hex {
	const c = parseHex(hex);
	return formatHex({ ...c, a: alpha });
}

export function alphaOf(hex: string): number {
	return parseHex(hex).a;
}

/** Linear interpolation between `fg` and `bg` by weight `t` of fg (0..1). */
export function mix(fg: string, bg: string, t: number): Hex {
	const f = parseHex(fg);
	const b = parseHex(bg);
	return formatHex({
		r: f.r * t + b.r * (1 - t),
		g: f.g * t + b.g * (1 - t),
		b: f.b * t + b.b * (1 - t),
		a: 1,
	});
}

/** Apply a variant palette mapping (case-insensitive) to a template color. */
export function applyColor(value: string, palette: Record<string, string>): string {
	return value.startsWith('#') ? normalizeHex(palette[value.toLowerCase()] ?? value) : value;
}

export function cap(s: string): string {
	return s.charAt(0).toUpperCase() + s.slice(1);
}

// --- Zed theme content types (subset of schema v0.2.0) ---

export interface HighlightStyle {
	color?: string;
	background_color?: string | null;
	font_style?: 'normal' | 'italic' | 'oblique';
	font_weight?: number;
}

export interface PlayerColor {
	cursor?: string;
	background?: string;
	selection?: string;
}

export interface ThemeStyle extends Record<string, unknown> {
	syntax?: Record<string, HighlightStyle>;
	players?: PlayerColor[];
	accents?: string[];
}

export interface ThemeContent {
	name: string;
	appearance: 'light' | 'dark';
	style: ThemeStyle;
}

export interface ThemeFamily {
	author: string;
	name: string;
	themes: ThemeContent[];
}
