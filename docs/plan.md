# Mineral Theme for Zed · 开发计划

> 前置阅读：`docs/research.md`（本轮调研产出：技术栈、Schema、映射表草案）。背景与决策记录见 `PROGRESS.md`。
> 状态图例：`[x]` 完成 · `[~]` 进行中 · `[ ]` 未开始

## 总体思路

`migrate_source/` 的颜色数据模型（13 基色语法模板 × 调色板 × ui-shared/variants/hc-overrides）**原样复用**，新建一条「data/ → Zed Theme Family JSON」的构建管线，替换掉 VS Code 的主题 JSON 格式与 TextMate/运行时机制。产物为一个 theme-only Zed 扩展：`extension.toml` + 生成的 `themes/mineral-theme.json`（family「Mineral Theme」+ 20 个主题）。

里程碑顺序刻意让「管线先行、语法映射单变体打样、再铺全量、最后视觉校准」，每步都有机器校验 + 截图对照。

## 里程碑

- [x] **M0 调研与规划**（2026-10-24）：技术栈、Schema、差异分析、映射表草案、AGENTS.md —— 见 `docs/research.md`
- [x] **M1 扩展骨架与构建管线**（2026-10-24，一次成型为全量管线）：extension.toml、data vendoring、ui-map/syntax-map/build-themes、ajv 校验
- [x] **M2 语法映射打样**（2026-10-24）：81 条规则逐条落表（含 7 个细分键），断言测试锁定调色板应用；**截图对照留给用户验收**
- [x] **M3 全变体 + High Contrast**（2026-10-24）：20 主题单文件 family 生成，HC/调色板/accent 断言推广到全变体
- [~] **M4 视觉校准与细节打磨**：派生色已按 §5.3 定稿并落测试；**观感级校准待用户在 Zed 实际验收后反馈迭代**
- [~] **M5 收尾**：README/LICENSE/CI/版本 0.1.0 已完成；**发布与否待用户风险评审**（保持 dev extension + 私有仓库）

## M1 扩展骨架与构建管线 `[ ]`

**产出**：可被 Zed 以 dev extension 方式安装的扩展；`Mineral Theme Carbon` 的 UI 部分正确（syntax 先占位用 `primary`/`editor.foreground`）。

1. 目录布局（仓库根即扩展根；Git 已于 2026-10-24 初始化）：
   ```
   extension.toml            # id: mineral-theme, schema_version: 1
   themes/mineral-theme.json # 构建产物
   data/                     # vendor 自 migrate_source/data（tokenColors/palettes/semanticTokenColors/ui-shared/variants/hc-overrides/customization）
   scripts/                  # build-themes.ts、lib.ts、映射表 module
   test/                     # vitest
   docs/, AGENTS.md, PROGRESS.md, README.md, .gitignore(排除 migrate_source/)
   ```
2. `package.json` + TS(strict) + tsx + vitest + ajv；`npm run build` = 生成 + 校验。
3. 映射表落地为数据模块：`ui-map.ts`（§5.1）+ `syntax-map.ts`（§5.2 骨架）。
4. `build-themes.ts`：合并 ui-shared + variants + hc-overrides → 应用 ui-map → 产出 style；family + 20 主题一次生成（M1 允许 syntax 为占位）。
5. 校验：ajv 对 Schema v0.2.0、确定性（二次构建 diff 为空）、UI 键映射完备性（每个产出的 Zed UI 键都能溯源到源键或派生规则）。
6. 本机验证：Extensions 页 `Install Dev Extension` 选仓库根；主题选择器出现 family 并可切换；**实测主题文件改动后的热重载行为**（调研开放问题 1）。

**验收**：Zed 里 `Mineral Theme Carbon` 背景/侧栏/标签栏/状态栏/终端等 UI 观感正确；构建全绿。

## M2 语法映射打样 `[ ]`

**产出**：Carbon 单主题语法色与 VS Code 版逐类目对齐。

1. 逐条核对 81 条 tokenColors 规则 → 补全 `syntax-map.ts`（含 font_style/italic 继承）。
2. 断言测试：`tokenColors × palettes[carbon]` 解析出的每个类目颜色 == 产出的对应 syntax 键颜色。
3. 真实代码对照：TS/JSON/Rust/Python/HTML/CSS/Markdown 各一页，Zed(Carbon) vs VS Code(Carbon) 并排截图，逐类目校正（重点：keyword/storage 不可分的取舍、property/attribute、punctuation.special、string.special）。
4. HC 版抽查（Carbon High Contrast）。

**验收**：并排截图无明显类目级色差；全部断言测试通过。

## M3 全变体 + High Contrast `[ ]`

**产出**：family 内 20 个主题全部生成。

1. 全变体跑通（10 × 常规/HC），文件名与主题 name 规范：`Mineral Theme <Variant> [High Contrast]`。
2. 断言测试推广到全变体（palette 应用正确性、HC 覆盖条数与源一致）。
3. Zed 内逐个切换 20 主题快速走查。

**验收**：20 主题全部出现在选择器且无 schema/构建告警；走查无错色。

## M4 视觉校准 `[ ]`

**产出**：细节观感对齐 VS Code 版，派生键定稿。

1. 逐表面对照修派生键：active line（源为行边框，Zed 需低透明度底色）、ghost_element 族、success/hint/predictive/unreachable、terminal dim 档、scrollbar track/thumb 边框、players[1..4]。
2. 实测确认 `players[0].selection`（本地选区）、光标 `#FFCC00`、`accents[]` 效果。
3. 编辑器细节：indent guide、wrap guide、search match、document_highlight 三态、diff 高亮。
4. （可选）用官方 Theme Builder 交叉核对个别表面取值。

**验收**：日常使用一周无明显违和；`docs/research.md` 映射表从"草案"改为"定稿"。

## M5 收尾 `[ ]`

1. README（安装方式：dev extension / 后续 registry）、LICENSE 决策、版本号 0.1.0。
2. （可选）GitHub Actions：typecheck + test + build + ajv 校验。
3. **（可选，需用户决策）发布**：公开仓库 + 补 MIT license + 向 `zed-industries/extensions` 提 PR（submodule + extensions.toml 条目）。不发布则保持私有仓库 + dev extension 使用，与源项目"仅个人使用"政策一致。
4. （远期，独立扩展）文件图标主题 Zed 版（Zed icon theme 扩展机制，与本项目分开实现）。

## 关键决策待用户确认（不阻塞 M1–M3）

| 决策 | 默认方案 | 备选 |
|---|---|---|
| accent | 烘焙主题原生 teal `#80CBC4`（= VS Code 版 `accent: Default`）；日常换色用 `theme_overrides` 片段（方案 C） | 增加 Blue 等 accent 作为额外主题变体（方案 B，可选追加） |
| 发布 | **暂不公开**（2026-10-24，待法律/风险评估后决策） | 公开仓库 + MIT + registry PR |
| Git 仓库 | **已初始化**（2026-10-24，本目录根，扩展即仓库根） | — |
