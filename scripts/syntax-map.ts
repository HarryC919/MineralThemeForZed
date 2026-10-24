// Zed syntax keys -> My Dark Theme palette mapping.
//
// Zed styles syntax via Tree-sitter capture names (not TextMate scopes), so a
// 1:1 port of the 81 VS Code rules is impossible. The source template only
// references 13 distinct colors, so we map each Zed key to one palette color
// role; the per-variant palettes then produce all variants. Hierarchical
// captures fall back in Zed (e.g. `function.call` -> `function`), so the
// table only needs the keys we want to style.
//
// Extras beyond Zed's One theme key set (keyword.function/type/modifier,
// keyword.control, constant.builtin, function.builtin, variable.member)
// restore the purple "storage" / cyan italic "control" looks where the
// grammars use those captures; unused keys are harmless.
//
// Known lossy spots (see docs/research.md §4.1):
// - `keyword` and `storage` cannot be separated in every grammar; the main
//   keyword slot takes the cyan from Vira, storage-ish captures go purple.
// - CSS property names are light blue in VS Code but share `property` (red)
//   with JSON/TS members here.
// - Underline-only styles (markup.underline) have no Zed equivalent.
import { applyColor, withAlpha, type HighlightStyle } from './lib';

// Base (Teal-variant) template colors; each maps through palettes.json.
const FG = '#d8dfdf';
const COMMENT = '#546e7a';
const STRING = '#c3e88d';
const CYAN = '#89ddff';
const BLUE = '#82aaff';
const PURPLE = '#c792ea';
const YELLOW = '#ffcb6b';
const ORANGE = '#f78c6c';
const RED = '#f07178';
const PINK = '#ff9cac';

interface SyntaxEntry {
	color: string;
	/** Optional alpha applied after palette resolution (e.g. ghost text). */
	alpha?: number;
	font_style?: 'italic';
	font_weight?: number;
}

export const SYNTAX_MAP: Record<string, SyntaxEntry> = {
	primary: { color: FG },

	// Comments (italic in Vira)
	comment: { color: COMMENT, font_style: 'italic' },
	'comment.doc': { color: COMMENT, font_style: 'italic' },
	hint: { color: COMMENT },
	preproc: { color: COMMENT },

	// Strings & literals
	string: { color: STRING },
	'string.escape': { color: FG },
	'string.regex': { color: STRING },
	'string.special': { color: STRING },
	'string.special.symbol': { color: CYAN },
	'text.literal': { color: STRING },
	embedded: { color: FG },

	// Keywords & operators
	keyword: { color: CYAN },
	'keyword.control': { color: CYAN, font_style: 'italic' },
	'keyword.function': { color: PURPLE },
	'keyword.modifier': { color: PURPLE },
	'keyword.type': { color: PURPLE },
	operator: { color: CYAN },
	label: { color: CYAN },

	// Functions, types, storage
	function: { color: BLUE },
	'function.builtin': { color: BLUE },
	type: { color: YELLOW },
	enum: { color: YELLOW },
	constructor: { color: PURPLE },
	namespace: { color: RED, font_style: 'italic' },

	// Variables, properties, constants
	variable: { color: FG },
	'variable.parameter': { color: FG, font_style: 'italic' },
	'variable.special': { color: CYAN },
	'variable.member': { color: RED },
	constant: { color: CYAN },
	'constant.builtin': { color: CYAN },
	boolean: { color: PINK },
	number: { color: ORANGE },
	property: { color: RED },
	attribute: { color: PURPLE },
	tag: { color: RED },

	// Markup / CSS / misc
	title: { color: CYAN },
	selector: { color: YELLOW },
	'selector.pseudo': { color: PURPLE },
	emphasis: { color: RED, font_style: 'italic' },
	'emphasis.strong': { color: RED, font_weight: 700 },
	link_text: { color: RED },
	link_uri: { color: RED },
	variant: { color: FG },
	predictive: { color: FG, alpha: 0.45 },

	// Diff
	'diff.plus': { color: STRING },
	'diff.minus': { color: RED },

	// Punctuation (classic Material: all cyan, brackets included)
	punctuation: { color: CYAN },
	'punctuation.bracket': { color: CYAN },
	'punctuation.delimiter': { color: CYAN },
	'punctuation.list_marker': { color: CYAN },
	'punctuation.markup': { color: CYAN },
	'punctuation.special': { color: CYAN },
};

/** Resolve the table against one variant's palette into Zed syntax styles. */
export function buildSyntaxStyle(palette: Record<string, string>): Record<string, HighlightStyle> {
	const out: Record<string, HighlightStyle> = {};
	for (const [key, entry] of Object.entries(SYNTAX_MAP)) {
		let color = applyColor(entry.color, palette);
		if (entry.alpha !== undefined) color = withAlpha(color, entry.alpha);
		const style: HighlightStyle = { color };
		if (entry.font_style) style.font_style = entry.font_style;
		if (entry.font_weight) style.font_weight = entry.font_weight;
		out[key] = style;
	}
	return out;
}
