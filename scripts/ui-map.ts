// VS Code colors -> Zed UI style mapping.
//
// Input: the merged VS Code `colors` dict for one variant
// (ui-shared + variants/<v> + hc-overrides, with the 48 accentable keys
// already re-baked to the chosen accent). Output: every non-syntax Zed
// style key, plus `players` and `accents`.
//
// Mapping rationale is documented in docs/research.md §5.1; keys marked
// DERIVED have no VS Code counterpart and were synthesized to fit the
// theme's look (calibrate visually in M4 if needed).
import { mix, parseHex, formatHex, withAlpha, type PlayerColor } from './lib';

export interface UiMapOptions {
	/** Raw accent hex (e.g. #5393FF) for keys sourced directly from the accent. */
	accent: string;
	/** Cursor colors for collaborator players 1..n (palette-resolved). */
	playerCursors: string[];
	/** Accent palette entries for the Zed `accents` array. */
	accents: string[];
}

export interface UiMapResult {
	style: Record<string, string>;
	players: PlayerColor[];
	accents: string[];
}

export function buildUiStyle(colors: Record<string, string>, opts: UiMapOptions): UiMapResult {
	const c = (key: string): string => {
		const v = colors[key];
		if (typeof v !== 'string') throw new Error(`Missing source color for key "${key}"`);
		return formatHex(parseHex(v));
	};
	const base = (key: string): string => formatHex({ ...parseHex(c(key)), a: 1 });
	const fg = base('foreground');
	const bg = c('editor.background');

	const style: Record<string, string> = {
		// App & surfaces
		background: bg,
		'background.appearance': 'opaque',
		'surface.background': c('sideBar.background'),
		'panel.background': c('sideBar.background'),
		'elevated_surface.background': c('editorHoverWidget.background'),
		'title_bar.background': c('titleBar.activeBackground'),
		'title_bar.inactive_background': c('titleBar.inactiveBackground'),
		'toolbar.background': c('editorGroupHeader.tabsBackground'),
		'tab_bar.background': c('editorGroupHeader.tabsBackground'),
		'tab.active_background': c('tab.activeBackground'),
		'tab.inactive_background': c('tab.inactiveBackground'),
		'status_bar.background': c('statusBar.background'),

		// Editor
		'editor.background': bg,
		'editor.foreground': c('editor.foreground'),
		'editor.gutter.background': bg,
		'editor.line_number': c('editorLineNumber.foreground'),
		'editor.hover_line_number': c('editorLineNumber.activeForeground'),
		'editor.active_line_number': c('editorLineNumber.activeForeground'),
		// VS Code draws the active line as a transparent fill + border; Zed has no
		// line border token, so approximate with a low-alpha fill of the border color.
		'editor.active_line.background': withAlpha(base('editor.lineHighlightBorder'), 0.15),
		'editor.highlighted_line.background': withAlpha(base('editor.lineHighlightBorder'), 0.25),
		'editor.invisible': c('editorWhitespace.foreground'),
		'editor.indent_guide': c('editorIndentGuide.background'),
		'editor.indent_guide_active': c('editorIndentGuide.activeBackground'),
		'editor.wrap_guide': c('editorRuler.foreground'),
		'editor.active_wrap_guide': c('editorRuler.foreground'),
		'editor.document_highlight.read_background': c('editor.wordHighlightBackground'),
		'editor.document_highlight.write_background': c('editor.wordHighlightStrongBackground'),
		// VS Code highlights matching brackets with a border; Zed uses a background fill.
		'editor.document_highlight.bracket_background': withAlpha(base('editorBracketMatch.border'), 0.2),
		'editor.subheader.background': bg,

		// Borders (Vira flat look: hairlines over saturated focus rings).
		// Hairline alphas are calibrated brighter than the VS Code source values
		// (6% white): 0.14/0.12 after round 1, 0.18/0.16 after round 2 —
		// 2026-10-24 user feedback ("borders still a bit dark").
		border: withAlpha(base('widget.border'), 0.18),
		'border.variant': withAlpha(base('editorGroup.border'), 0.16),
		'border.focused': c('focusBorder'),
		'border.selected': c('inputOption.activeBorder'),
		'border.disabled': withAlpha(fg, 0.1),
		'border.transparent': '#00000000',
		'pane.focused_border': c('focusBorder'),
		'pane_group.border': withAlpha(base('editorGroup.border'), 0.16),
		'panel.focused_border': c('panel.border'),

		// Text
		text: fg,
		'text.muted': c('descriptionForeground'),
		'text.disabled': c('disabledForeground'),
		'text.placeholder': c('input.placeholderForeground'),
		'text.accent': c('pickerGroup.foreground'),

		// Elements
		'element.background': c('input.background'),
		'element.hover': c('toolbar.hoverBackground'),
		'element.active': c('toolbar.activeBackground'),
		'element.selected': c('menu.selectionBackground'),
		'element.disabled': withAlpha(fg, 0.05),
		'ghost_element.background': c('sideBar.background'),
		'ghost_element.hover': c('toolbar.hoverBackground'),
		'ghost_element.active': c('list.focusBackground'),
		'ghost_element.selected': c('list.inactiveSelectionBackground'),
		'ghost_element.disabled': '#00000000',

		// Icons
		icon: c('icon.foreground'),
		'icon.muted': c('activityBar.inactiveForeground'),
		'icon.disabled': c('disabledForeground'),
		'icon.accent': c('activityBarBadge.background'),
		'icon.placeholder': c('input.placeholderForeground'),

		// Scrollbar
		'scrollbar.thumb.background': c('scrollbarSlider.background'),
		'scrollbar.thumb.hover_background': c('scrollbarSlider.hoverBackground'),
		'scrollbar.thumb.border': '#00000000',
		'scrollbar.track.background': bg,
		'scrollbar.track.border': '#00000000',

		// Search & links
		// VS Code outlines the current find match with the accent; Zed has no border
		// token here, so keep that intent via an accent-tinted background.
		'search.active_match_background': withAlpha(opts.accent, 0.25),
		'search.match_background': c('editor.findMatchHighlightBackground'),
		'link_text.hover': c('textLink.foreground'),
		'drop_target.background': c('list.dropBackground'),

		// Terminal
		'terminal.background': bg,
		'terminal.foreground': fg,
		'terminal.bright_foreground': fg,
		'terminal.dim_foreground': c('descriptionForeground'),
		'terminal.ansi.background': bg,
	};

	// Terminal ANSI palette. VS Code camelCase -> Zed kebab-case; VS Code has no
	// dim_* slot, so synthesize each dim color by mixing the normal one into the
	// terminal background.
	const ansiNames: Array<[string, string]> = [
		['black', 'Black'],
		['red', 'Red'],
		['green', 'Green'],
		['yellow', 'Yellow'],
		['blue', 'Blue'],
		['magenta', 'Magenta'],
		['cyan', 'Cyan'],
		['white', 'White'],
	];
	for (const [zed, vs] of ansiNames) {
		const normal = c(`terminal.ansi${vs}`);
		style[`terminal.ansi.${zed}`] = normal;
		style[`terminal.ansi.bright_${zed}`] = colors[`terminal.ansiBright${vs}`]
			? c(`terminal.ansiBright${vs}`)
			: normal;
		style[`terminal.ansi.dim_${zed}`] = mix(normal, bg, 0.45);
	}
	style['terminal.ansi.bright_black'] = colors['terminal.ansiBrightBlack']
		? c('terminal.ansiBrightBlack')
		: style['terminal.ansi.black']!;

	// Status colors: base + synthesized .background/.border
	const statusSources: Array<[string, string]> = [
		['error', 'editorError.foreground'],
		['warning', 'editorWarning.foreground'],
		['info', 'editorInfo.foreground'],
		['created', 'gitDecoration.untrackedResourceForeground'],
		['deleted', 'gitDecoration.deletedResourceForeground'],
		['modified', 'gitDecoration.modifiedResourceForeground'],
		['renamed', 'gitDecoration.modifiedResourceForeground'],
		['conflict', 'gitDecoration.conflictingResourceForeground'],
		['unreachable', 'gitDecoration.conflictingResourceForeground'],
		['ignored', 'gitDecoration.ignoredResourceForeground'],
		['hidden', 'disabledForeground'],
		['hint', 'descriptionForeground'],
		['success', 'gitDecoration.untrackedResourceForeground'],
	];
	for (const [key, src] of statusSources) {
		const v = c(src);
		style[key] = v;
		style[`${key}.background`] = withAlpha(base(src), 0.15);
		style[`${key}.border`] = withAlpha(base(src), 0.4);
	}
	// Ghost-text / AI suggestion color: noticeably muted foreground.
	style['predictive'] = withAlpha(fg, 0.45);
	style['predictive.background'] = withAlpha(fg, 0.08);
	style['predictive.border'] = withAlpha(fg, 0.15);

	// Version control (git decorations, merge markers, diff words)
	style['version_control.added'] = c('gitDecoration.untrackedResourceForeground');
	style['version_control.modified'] = c('gitDecoration.modifiedResourceForeground');
	style['version_control.deleted'] = c('gitDecoration.deletedResourceForeground');
	style['version_control.conflict_marker.ours'] = c('merge.currentHeaderBackground');
	style['version_control.conflict_marker.theirs'] = c('merge.incomingHeaderBackground');
	style['version_control.word_added'] = c('diffEditor.insertedTextBackground');
	style['version_control.word_deleted'] = c('diffEditor.removedTextBackground');

	// Players: index 0 is the local user (cursor + editor selection); 1..n are
	// collaborators, synthesized from the palette.
	const players: PlayerColor[] = [
		{
			cursor: c('editorCursor.foreground'),
			background: bg,
			selection: c('editor.selectionBackground'),
		},
		...opts.playerCursors.map((cursor) => ({
			cursor,
			background: bg,
			selection: withAlpha(cursor, 0.3),
		})),
	];

	return { style, players, accents: opts.accents.map((a) => formatHex(parseHex(a))) };
}
