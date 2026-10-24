# My Dark Theme for Zed · 迁移调研（2026-10-24）

本轮信息收集的产出。数据来源：`DevWeb.txt` 指向的 [Zed 官方文档](https://zed.dev/docs/extensions/themes)、[Theme JSON Schema v0.2.0](https://zed.dev/schema/themes/v0.2.0.json)、[发布文档](https://zed.dev/docs/extensions/publishing/overview.md)、Zed 内置 One 主题（`assets/themes/one/one.json`，作为 syntax 规范键名的参照）、Catppuccin Zed 扩展（作为 theme-only 扩展结构的参照），以及 `migrate_source/`（VS Code 版，数据与决策见其 `AGENTS.md` / `PROGRESS.md`）。

## 1. 目标与范围

把 `migrate_source/`（VS Code 版 My Dark Theme，视觉对标 Vira Theme）中的 **颜色主题** 复刻为 Zed 主题扩展。

- **做**：10 个背景变体 × 常规/High Contrast = 20 个颜色主题的观感复刻（工作台 UI 色 + 编辑器语法色 + 终端 ANSI）。
- **不做**（Zed 插件分开实现）：文件图标主题、产品图标主题（后续独立 icon 主题扩展）；VS Code 版的运行时自定义（accent 染色等，Zed 主题是纯静态 JSON，无运行时，见 §4.3）。

## 2. 源项目数据模型（迁移的输入）

`migrate_source/data/` 是唯一数据源，颜色部分：

| 文件 | 内容 | 规模 |
|---|---|---|
| `tokenColors.json` | TextMate 语法规则模板（Teal 基） | 81 条规则，仅引用 **13 个基色**（青/蓝/紫/绿/黄/橙/红/粉/灰/棕/亮灰/淡灰 + 前景） |
| `palettes.json` | 各变体「基色 → 变体色」映射（teal 为空 = 基准） | 10 变体，每变体 0~14 条 |
| `semanticTokenColors.json` | VS Code 语义 token 色 | 18 键 |
| `ui-shared.json` | 全变体共享 UI 色（含 accent 占位键） | 76 项 |
| `variants/<v>.json` | 各变体 UI 色 | 每变体约 200 项 |
| `hc-overrides.json` | 逐变体 High Contrast 覆盖 | 每变体 33~43 项 |
| `customization.json` | 14 个 accent 色 + 48 个 accentable 键透明度 | 运行时自定义用，**Zed 版仅作参考** |

构建产物 `themes/My-Dark-Theme-<Variant>[-High-Contrast].json` = `ui-shared + variants[v] (+ hc-overrides[v])` 的 `colors` × `tokenColors × palettes[v]` × `semanticTokenColors`。**关键结论：语法色可以完全由「13 基色 × 调色板映射」程序化得出**，这决定了 Zed 版语法映射只需建一张「基色角色 → Zed syntax 键」的表。

## 3. Zed 主题扩展技术栈

### 3.1 扩展形态（theme-only，无 Rust）

- Zed 扩展 = 一个 Git 仓库，根目录含 `extension.toml`。theme-only 扩展 **不需要任何 Rust 代码**（官方文档：只有 language server / context server / debugger 扩展需要 Rust；无需 `Cargo.toml`）。
- `extension.toml` 最小字段（参照 Catppuccin 实例）：

  ```toml
  id = "my-dark-theme"        # 发布前提：kebab-case、唯一、以 -theme 结尾、不含 zed/extension 字样
  name = "My Dark Theme"
  version = "0.0.1"
  schema_version = 1
  authors = ["..."]
  description = "..."
  repository = "https://github.com/<user>/<repo>"   # 发布时必须公开
  ```

- 主题放在扩展根的 `themes/` 目录，每个文件是一个 **Theme Family**，无需在 extension.toml 里注册。
- 本地开发用 **dev extension**：Extensions 页 → `Install Dev Extension` → 选择扩展目录；已发布版会被 dev 版覆盖（"Overridden by dev extension"）。排查日志：`zed: open log`，或 `zed --foreground` 启动看 INFO 级输出。
- 若发布：向 `zed-industries/extensions` 仓库提 PR（fork → `git submodule add <https url> extensions/<id>` → `extensions.toml` 加条目 → `pnpm sort-extensions`）。前提：仓库**公开**、含接受的开源 license（MIT/Apache-2.0 等，放在扩展目录内）、theme 扩展**只提供 theme**。同一时间最多 3 个开放 PR，3 周内须回应 review。

### 3.2 Theme JSON Schema v0.2.0

一个主题文件：

```json
{
  "author": "...",
  "name": "My Dark Theme",          // family 名（选择器里的分组）
  "themes": [
    {
      "name": "My Dark Theme Carbon", // 单个主题（选择器里的一行）
      "appearance": "dark",           // light | dark
      "style": { "...": "..." }       // ThemeStyle，约 141 键
    }
  ]
}
```

`style` 键分类：

| 分类 | 代表键 |
|---|---|
| 表面 | `background`、`background.appearance`（opaque/transparent/blurred）、`surface.background`、`panel.background`、`elevated_surface.background`、`title_bar.background(-inactive)`、`toolbar.background`、`tab_bar.background`、`tab.active/inactive_background`、`status_bar.background` |
| 编辑器 | `editor.background/foreground`、`editor.gutter.background`、`editor.line_number`、`editor.active_line.number`、`editor.active_line.background`、`editor.highlighted_line.background`、`editor.invisible`、`editor.indent_guide(-active)`、`editor.wrap_guide(-active)`、`editor.document_highlight.{read,write,bracket}_background`、`editor.subheader.background` |
| 边框 | `border`、`border.variant/focused/selected/disabled/transparent`、`pane.focused_border`、`pane_group.border`、`panel.focused_border` |
| 文本 | `text`、`text.muted/accent/disabled/placeholder` |
| 元素 | `element.{background,hover,active,selected,disabled}`、`ghost_element.*`（与所在表面同色的元素） |
| 图标 | `icon`、`icon.accent/muted/disabled/placeholder` |
| 状态 | `error/warning/info/success/hint/created/deleted/modified/renamed/conflict/hidden/ignored/predictive/unreachable`（各带 `.background`/`.border`） |
| 终端 | `terminal.background/foreground(-bright/-dim)`、`terminal.ansi.{black…white}`、`terminal.ansi.bright_*`、`terminal.ansi.dim_*`、`terminal.ansi.background` |
| 滚动条等 | `scrollbar.thumb.{background,border,hover_background}`、`scrollbar.track.{background,border}`、`search.match_background`、`link_text.hover`、`drop_target.background` |
| 协作 | `players[]: {cursor, background, selection}`（**本地选区/光标也走 players[0]**，schema 无独立 editor.selection 键）、`accents[]`（UI 附加色数组） |
| 语法 | `syntax: { <任意键>: {color, background_color, font_style: normal|italic|oblique, font_weight: 100…900} }` |

颜色值为 CSS 风格 hex：`#RGB` / `#RRGGBB` / `#RRGGBBAA`（8 位带 alpha）均可用——源项目的 alpha 写法可直接沿用。

### 3.3 syntax 键 = Tree-sitter 高亮名（核心差异）

`syntax` 的键不是 TextMate scope，而是 **Tree-sitter capture 名**（`@keyword` → `"keyword"`，支持层级如 `comment.doc`、`string.escape`）。Zed 官方 One 主题用了 46 个键：

> `attribute, boolean, comment, comment.doc, constant, constructor, diff.minus, diff.plus, embedded, emphasis, emphasis.strong, enum, function, hint, keyword, label, link_text, link_uri, namespace, number, operator, predictive, preproc, primary, property, punctuation, punctuation.bracket, punctuation.delimiter, punctuation.list_marker, punctuation.markup, punctuation.special, selector, selector.pseudo, string, string.escape, string.regex, string.special, string.special.symbol, tag, text.literal, title, type, variable, variable.parameter, variable.special, variant`

未覆盖的 capture 回落规则：Zed 按层级回落（如 `function.call` 无定义时回落 `function`），最终回落 `editor.foreground`。主题只需覆盖想要定制的键。

### 3.4 Theme Builder

官方 [Theme Builder](https://zed.dev/theme-builder) 可基于现有主题微调各表面并导出 JSON——适合 M4 视觉校准阶段辅助取值，不进构建管线。

## 4. VS Code → Zed 关键差异与迁移策略

### 4.1 语法：TextMate scope → Tree-sitter capture

- VS Code 的 81 条规则按 scope 列表匹配；Zed 按 capture 名。**无法逐条机械转换**，但源模板只引用 13 个基色 → 建一张「**基色角色 → Zed syntax 键**」映射表（§5.2），再叠加 `palettes.json` 即得全部变体的 syntax。
- 部分细分无法保留：如 Vira 中 `keyword`（青）与 `storage`（紫）分色，而 Zed 的 TS/JS 语法把多数关键字统一捕获为 `keyword` → 只能取其一（拟取青，Vira 中视觉占比更高）。这是**有损复刻**，需在 M2 用真实代码页面对照校准。
- `semanticTokenColors` 无对应机制（Zed 无 LSP 语义 token 主题色），整体弃用；语义信息已由 Tree-sitter capture 承担。

### 4.2 UI：279 项 VS Code 色 → 141 键 Zed style

语义近似映射（草案见 §5.1）：约 60% 键有直接对应（tab/status bar/title bar/terminal/indent guide/gutter/diff 等），其余按语义归类（如 `elevated_surface.background` ← menu/notifications/editorWidget）。派生键（Zed 有而 VS Code 无：`ghost_element.*`、`success`、`predictive` 等）从背景/前景/状态色推导，M4 视觉校准。

### 4.3 无运行时 → accent 直接烘焙

VS Code 版的 `viraTheme.accent`（14 色 + customAccent，48 个 accentable 键按透明度染色）依赖运行时改写主题文件，Zed 主题是静态 JSON 且扩展无设置界面，**机制不可复制**。策略（2026-10-24 用户拍板）：

- **accent 烘焙为 Blue `#5393FF`**（等价 VS Code 版 v0.5.2+ 出厂基线；用户偏好，Vira 原生 teal 太轻）。构建管线支持 `--accent=<name|#hex>` 整体重烘焙（14 个预设色在 `customization.json`）。
- 用户侧临时换色可用 Zed 原生 `theme_overrides`（受影响键仅 4–6 个，见 §5.3）；accent 变体主题（如 "My Dark Theme Blue" 独立 family）作为可选后续，零返工成本。

### 4.4 High Contrast 无独立档位

Zed 无 high-contrast 元数据，HC 版直接作为独立主题 `My Dark Theme <Variant> High Contrast`（appearance 仍 `dark`），应用 `hc-overrides[v]`。

### 4.5 斜体/字重

Zed 支持 `font_style`（italic）与 `font_weight`（数值）。源模板的斜体规则（如 Modules）照搬为 `italic`；VS Code 的 `disableItalics` 开关不迁移（同 §4.3，无运行时；如有需要可出 "No Italics" 变体）。

## 5. 映射表（草案，M2/M4 校准）

### 5.1 UI 颜色（Zed 键 ← 源键，源键均为 `ui-shared + variants[v] (+hc)` 合并后的 `colors`）

| Zed 键 | 来源（VS Code 键） | 说明 |
|---|---|---|
| `background` | `editor.background` | 应用主背景 |
| `background.appearance` | — | 固定 `opaque` |
| `surface.background` | `sideBar.background` | |
| `panel.background` | `sideBar.background` | Zed 的 panel=侧栏/底部面板 |
| `elevated_surface.background` | `editorHoverWidget.background`（备选 menu/notifications） | 弹层 |
| `title_bar.background` | `titleBar.activeBackground` | |
| `title_bar.inactive_background` | `titleBar.inactiveBackground` | |
| `toolbar.background` | `editorGroupHeader.tabsBackground` | |
| `tab_bar.background` | `editorGroupHeader.tabsBackground` | |
| `tab.active_background` | `tab.activeBackground` | |
| `tab.inactive_background` | `tab.inactiveBackground` | |
| `status_bar.background` | `statusBar.background` | |
| `editor.background` | `editor.background` | |
| `editor.foreground` | `editor.foreground` | |
| `editor.gutter.background` | `editor.background` | |
| `editor.line_number` | `editorLineNumber.foreground` | |
| `editor.active_line_number` | `editorLineNumber.activeForeground` | |
| `editor.active_line.background` | 派生 | 源为透明底+边框（`editor.lineHighlightBorder`），Zed 无行边框 → 用 `#2F3237` 族低透明度近似 |
| `editor.highlighted_line.background` | 派生（同上略强） | |
| `editor.invisible` | `editorWhitespace.foreground` | |
| `editor.indent_guide` | `editorIndentGuide.background` | |
| `editor.indent_guide_active` | `editorIndentGuide.activeBackground` | |
| `editor.wrap_guide` | `editorRuler.foreground` | |
| `editor.active_wrap_guide` | `editorRuler.foreground` | |
| `editor.document_highlight.read_background` | `editor.wordHighlightBackground` | |
| `editor.document_highlight.write_background` | `editor.wordHighlightStrongBackground` | |
| `editor.document_highlight.bracket_background` | `editorBracketMatch.background` | 源为背景同色；Zed 用背景高亮 → 可用 `editorBracketMatch.border` 低透明度 |
| `editor.subheader.background` | `editor.background` | |
| `border` | `panel.border` | Vira 扁平风：多为低透明度 |
| `border.variant` | `widget.border` | `#ffffff0f` 细分隔线 |
| `border.focused` | `focusBorder` | 源为全透明 → 保持透明（扁平观感） |
| `border.selected` | `inputOption.activeBorder` | |
| `border.disabled` / `border.transparent` | 派生 | |
| `pane.focused_border` / `pane_group.border` / `panel.focused_border` | `editorGroup.border` / `panel.border` | |
| `text` | `foreground` | |
| `text.muted` | `descriptionForeground` | |
| `text.disabled` | `disabledForeground` | |
| `text.placeholder` | `input.placeholderForeground` | |
| `text.accent` | `pickerGroup.foreground`（= accent） | |
| `element.background` | `input.background` | |
| `element.hover` | `toolbar.hoverBackground`（备选 `list.hoverBackground`） | |
| `element.active` | `toolbar.activeBackground` | |
| `element.selected` | `menu.selectionBackground`（备选 `list.activeSelectionBackground`） | |
| `element.disabled` | 派生 | |
| `ghost_element.background` | `panel.background` | 与表面同色 |
| `ghost_element.hover/active/selected/disabled` | `list.hoverBackground` / `list.focusBackground` / `list.inactiveSelectionBackground` / 派生 | 列表交互本是"表面内"效果 |
| `icon` | `icon.foreground` | |
| `icon.muted` | `activityBar.inactiveForeground` | |
| `icon.disabled` | 派生（`disabledForeground`） | |
| `icon.accent` | `activityBarBadge.background`（= accent） | |
| `icon.placeholder` | 派生（`icon.foreground` 低透明度） | |
| `error` / `warning` / `info` | `editorError.foreground` / `editorWarning.foreground` / `editorInfo.foreground` | |
| `created` | `gitDecoration.untrackedResourceForeground` | |
| `deleted` | `gitDecoration.deletedResourceForeground` | |
| `modified` | `gitDecoration.modifiedResourceForeground` | |
| `renamed` | `modified` | |
| `conflict` | `gitDecoration.conflictingResourceForeground` | |
| `ignored` | `gitDecoration.ignoredResourceForeground` | |
| `hidden` | 派生（`text.disabled`） | |
| `success` | 派生（取 gitDecoration.untracked/ansi green 之间） | Zed 特有 |
| `hint` / `predictive` / `unreachable` | 派生（前景低透明度族） | Zed 特有 |
| `terminal.background` | `editor.background`（源未单列 terminal bg） | |
| `terminal.foreground` | `foreground` | |
| `terminal.bright_foreground` | `foreground` | |
| `terminal.dim_foreground` | `descriptionForeground` | |
| `terminal.ansi.{black,red,green,yellow,blue,magenta,cyan,white}` | `terminal.ansi{Black,…}` | 直接改名（camelCase→snake） |
| `terminal.ansi.bright_*` | `terminal.ansiBright*` | 同上 |
| `terminal.ansi.dim_*` | 派生（对应 normal 色 60% 混背景） | VS Code 无 dim 档 |
| `scrollbar.thumb.background` | `scrollbarSlider.background` | |
| `scrollbar.thumb.hover_background` | `scrollbarSlider.hoverBackground` | |
| `scrollbar.thumb.border` / `scrollbar.track.*` | 派生（透明/表面色） | |
| `search.match_background` | `editor.selectionHighlightBackground` | 源为 `#FFCC0033` 黄 |
| `link_text.hover` | `textLink.foreground` | |
| `drop_target.background` | `list.dropBackground`（备选 `panelSection.dropBackground`） | |
| `players[0].cursor` | `editorCursor.foreground` | Vira 黄色光标 `#FFCC00` |
| `players[0].selection` | `editor.selectionBackground` | 本地选区走 players[0]（M4 实测确认） |
| `players[0].background` | `editor.background` | |
| `players[1..4]` | 从调色板派生 | 协作者占位 |
| `accents[]` | `customization.json` 的 14 个 accent 色 | UI 附加色 |

### 5.2 Syntax（基色角色 → Zed syntax 键，叠加 `palettes[v]` 得全变体）

| 基色（Teal 基） | 源 TextMate 角色 | → Zed syntax 键 |
|---|---|---|
| `#89DDFF` 青 | Keyword / Punctuation | `keyword`、`operator`、`punctuation`、`punctuation.bracket`、`punctuation.delimiter`、`punctuation.list_marker`、`punctuation.special`、`variable.special`（this/self）、`string.special`、`label` |
| `#82AAFF` 蓝 | Function call | `function`、`selector`、`selector.pseudo` |
| `#C792EA` 紫 | Storage | `constructor`（keyword 与 storage 在 Zed 部分语法中不可分，主关键字取青） |
| `#FFCB6B` 黄 | Type / 常量键名 | `type`、`enum`、`title`、`attribute`、`property`（待校准，可能偏前景） |
| `#C3E88D` 绿 | String | `string`、`text.literal`、`string.special.symbol`、`embedded` |
| `#F78C6C` 橙 | Number / Other Keyword | `number`、`string.regex`、`preproc` |
| `#f07178` 红 | Tag / Modules（斜体） | `tag`、`namespace`（italic） |
| `#ff9cac` 粉 | Boolean / 正则类 | `boolean` |
| `#546E7A` 灰 | Comment | `comment`、`comment.doc` |
| `#D8DFDF` 前景 | Variable / Escape 等 | `primary`、`variable`、`variable.parameter`、`string.escape`、`property`（备选）、`emphasis`、`emphasis.strong`（+weight）、`variant`、`preproc`、`hint` |
| `#B2CCD6`/`#916b53` | 个别规则 | 按所属 scope 归入上述键（M2 逐条核对 81 规则） |
| —（git 色） | diffEditor.inserted/removed | `diff.plus`、`diff.minus` |
| —（accent） | link | `link_text`、`link_uri` |
| —（前景弱化） | AI 补全 | `predictive` |

M2 时逐条过一遍 `tokenColors.json` 的 81 条规则核对本表，并在真实代码（TS/Rust/Python/HTML/CSS/Markdown）里截图对照 VS Code 版。

### 5.3 实现定稿（2026-10-24，代码为准）

上表已全部实现，**实现以 `scripts/ui-map.ts` 与 `scripts/syntax-map.ts` 为准**（本节记录与草案的差异与补充；观感级微调待用户验收反馈）。

UI 侧实现要点与派生规则：

- accent 烘焙发生在**合并后的 VS Code colors 层**（48 个 accentable 键按 `customization.json` 各自 alpha 重写为 Blue），UI 映射只读色值——与 VS Code 版 build-themes.ts 语义一致。
- `editor.active_line.background` ← `editor.lineHighlightBorder` 基色 @ 0.15（`highlighted_line` @ 0.25）；`editor.document_highlight.bracket_background` ← `editorBracketMatch.border` 基色 @ 0.2（VS Code 用边框、Zed 只有底色）。
- `search.active_match_background` ← accent @ 0.25（Vira 用 accent 描边当前查找项，Zed 无边框 token，以底色保留意图）；`search.match_background` ← `editor.findMatchHighlightBackground`。
- 状态色族（error/warning/info/created/deleted/modified/renamed/conflict/unreachable/ignored/hidden/hint/success）统一派生：`.background` = 基色 @ 0.15、`.border` = 基色 @ 0.4；`predictive` = 前景 @ 0.45（bg 0.08 / border 0.15）。
- `editor.hover_line_number` ← `editorLineNumber.activeForeground`；`terminal.ansi.dim_*` = normal 色 × `mix(bg, 0.45)`；`version_control.*` ← gitDecoration / merge / diffEditor 键。
- `border` ← `widget.border`（白色 6% 发丝线，Vira 扁平观感的实际可见边框）；`border.focused`/`pane.focused_border` ← `focusBorder`（全透明，保持 Vira 无焦点环）。

Syntax 侧实现要点（较草案的修订）：

- 新增 7 个 One 集合之外的键：`keyword.function` / `keyword.modifier` / `keyword.type` ← 紫（回收 storage 观感）、`keyword.control` ← 青斜体（Material 招牌）、`constant.builtin` ← 青、`function.builtin` ← 蓝、`variable.member` ← 红。Zed 有层级回退，语法未用到的键无副作用。
- 修订：`string.regex` / `string.special` ← 绿（跟随源 string 规则，非橙）；`string.special.symbol` ← 青（`constant.other.symbol` 规则）；`label` ← 青；`link_uri` ← 红（与 link_text 同，Vira 链接整体红）；`selector.pseudo` ← 紫（attribute 族）；`hint` / `preproc` ← 灰（C# preprocessor 规则）；`emphasis.strong` = 红 + font_weight 700。
- 已知有损点（验收时留意）：CSS 属性名在 Vira 为亮蓝 `#B2CCD6`，但 Zed 与 JSON/TS 成员共用 `property`（红）；`markup.underline` 无对应能力；`variable.special` 统一青（TS `this` 正确，Python self 的前景斜体丢失）；关键字斜体依赖语法用 `keyword.control` 捕获，若语法只发 `keyword` 则无斜体。

## 6. 构建管线与工程选型

- **语言/工具**：TypeScript（strict）+ tsx 跑脚本 + vitest 校验 + ajv 做 JSON Schema 校验——与源项目习惯一致。**不引入 Rust**。
- **数据源**：把 `migrate_source/data/` 中颜色相关文件（`tokenColors/palettes/semanticTokenColors/ui-shared/variants/hc-overrides/customization`）**vendor** 进本仓库 `data/`（供脚本与发布使用；`migrate_source/` 本身 gitignore，仅本地参考）。跨仓库同步为手动（源项目改色后重新拷贝），`variant-keys.json`/`icons.json` 不需要。
- **输出**：单文件 `themes/my-dark-theme.json` = family「My Dark Theme」+ 全部 20 个主题（单文件保证同 family 合并展示；不拆多文件避免 family 行为疑问）。
- **校验**：
  1. ajv 校验产物符合 `https://zed.dev/schema/themes/v0.2.0.json`；
  2. 确定性：两次构建输出逐字节一致；
  3. 语义断言：每个变体的 `syntax` 经 palette 映射后与源 81 规则解析结果一致（抽样断言）；每个 Zed UI 键都有显式来源（映射表完备性测试）；
  4. `tsc --noEmit` + vitest。
- **人工验证**：`Install Dev Extension` 载入 → 主题选择器切换 20 个主题；`zed --foreground` 看日志；与 VS Code 同代码页并排截图对比（M2 起每阶段做）。

## 7. 待实现期验证的开放问题

1. **dev extension 的主题文件热重载行为**：修改 `themes/*.json` 后是否即时生效/需要重装/restart——M1 首次装机时实测（影响迭代效率）。
2. **同 family 多文件是否合并展示**：我们采用单文件规避；不依赖该行为。
3. **`players[0].selection` 是否即本地选区色**、`accents[]` 的实际用途（M4 实测）。
4. **`background.appearance: "transparent"/"blurred"`** 不使用（保持 opaque）。
5. **发布与否**：Zed 唯一分发渠道是 extensions registry（要求公开仓库 + MIT 等 license）。颜色值不受版权保护、语法为自建映射表，合规风险与源项目结论一致；是否公开仓库/发布由用户决策（计划中作为可选 M5）。

## 8. 关键参考链接

- 主题扩展文档：<https://zed.dev/docs/extensions/themes>
- Theme JSON Schema：<https://zed.dev/schema/themes/v0.2.0.json>
- 扩展开发总览：<https://zed.dev/docs/extensions/developing-extensions>
- 发布前提 / 指南 / license：<https://zed.dev/docs/extensions/publishing/prerequisites.md> · `publishing-guide.md` · `license-requirements.md`
- 官方语法键参照：Zed 源码 `assets/themes/one/one.json`
- Theme Builder：<https://zed.dev/theme-builder>
- 第三方主题画廊（对照观感用）：<https://zed-themes.com>
- 本地文档缓存（本轮抓取）：`/tmp/zed-docs/`（含 schema、各 .md、one.json；临时目录，重要结论已录入本文）
