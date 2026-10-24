# AGENTS.md

面向 AI Agent 与协作者的项目说明与开发约定。开始任何工作前请先阅读本文件。

## 1. 项目概述

**MineralThemeForZed** 把作者自己的 VS Code 主题（`migrate_source/`，视觉对标 Vira Theme）中的**颜色主题**复刻为 **Zed 主题扩展 Mineral Theme**。

- **范围**：只做 color theme——10 个背景变体（Carbon / Anthracite / Clay / Deepforest / Graphene / Montana / Ocean / Palenight / Sand / Teal）× 常规/High Contrast = 20 个主题，覆盖工作台 UI 色、编辑器语法色、终端 ANSI。
- **不做**：文件/产品图标主题（Zed 插件生态里 color 与 icon 分开实现，icon 后续另立项目）；VS Code 版的运行时自定义（accent 染色等——Zed 主题是静态 JSON，机制不存在）。
- **用途约束**：仅个人本地使用（dev extension + 私有仓库）；2026-10-24 决定**暂不公开**，待法律/合规风险评估后再决定是否发布到 Zed extensions registry（发布还要求公开仓库 + MIT 等接受的开源 license）。风险摘要与 accent 方案讨论见 `PROGRESS.md` 决策记录。

## 2. 参考资料

- **`DevWeb.txt`**：Zed 扩展开发文档入口（<https://zed.dev/docs/extensions/themes>）。
- **`docs/research.md`**（本轮调研产出，迁移的技术依据）：
  - Zed theme extension 形态：`extension.toml` + `themes/*.json`，theme-only 扩展**不需要 Rust/`Cargo.toml`**；
  - [Theme JSON Schema v0.2.0](https://zed.dev/schema/themes/v0.2.0.json)：ThemeFamily `{author, name, themes[]}` → `{name, appearance, style}`，style 约 141 键；
  - **syntax 键 = Tree-sitter capture 名**（非 TextMate scope），规范键参照 Zed 内置 One 主题（46 键）；
  - VS Code → Zed 差异分析、UI/syntax 完整映射表（M4 结束时从"草案"改"定稿"）；
  - dev extension 安装、发布流程（`zed-industries/extensions` PR + submodule）。
- **`migrate_source/`**：VS Code 版，**只读参考 + 颜色数据源**。其 `data/` 是唯一数据源，`AGENTS.md`/`PROGRESS.md` 记录了全部源项目决策。本仓库 gitignore 排除它（未来公开时不随之发布）。
- 本地文档缓存：`/tmp/zed-docs/`（schema 与官方 .md 抓取件，临时，重要结论已录入 research.md）。

## 3. 技术栈与仓库布局

- **技术栈**：TypeScript（strict）+ tsx（脚本）+ vitest（测试）+ ajv（Schema 校验）。**无 Rust**（theme-only 扩展不需要）。
- **布局**（仓库根 = 扩展根，即 dev extension 安装时选择的目录）：

  ```
  MineralThemeForZed/
  ├── extension.toml            # Zed 扩展清单（id: mineral-theme, schema_version: 1）
  ├── themes/                   # 构建产物：mineral-theme.json（family + 20 主题），禁止手改
  ├── data/                     # 颜色唯一数据源，vendor 自 migrate_source/data（仅颜色相关 7 个文件）
  ├── scripts/                  # build-themes.ts（生成）、ui-map.ts / syntax-map.ts（映射表）、lib.ts
  ├── test/                     # vitest：Schema 校验、确定性、映射完备性、palette 断言
  ├── docs/                     # research.md（调研）、plan.md（计划与里程碑）
  ├── AGENTS.md / PROGRESS.md / README.md
  └── migrate_source/           # 只读参考，gitignore
  ```

- 数据同步：`migrate_source/data/` 改色后**手动**重新 vendor 到 `data/`（7 个文件：`tokenColors` `palettes` `semanticTokenColors` `ui-shared` `variants/` `hc-overrides` `customization`；`variant-keys.json` 与 `icons.json` 不需要）。禁止让构建脚本直接跨目录读 `migrate_source/`。

## 4. 开发约定

- **生成优先**：`themes/` 下的产物一律由 `npm run build` 生成，禁止手工编辑；改色 → 改 `data/` 或映射表 → 重新构建。
- **映射表是代码**：UI 键映射（research.md §5.1）与 syntax 键映射（§5.2）以 `scripts/ui-map.ts` / `scripts/syntax-map.ts` 为准并保持文档同步；每个 Zed 键必须能溯源到源键或显式派生规则（测试强制）。
- **颜色格式**：沿用源项目风格——小写 hex、8 位表示 alpha（如 `#0000004d`）；Zed 原生支持 `#RRGGBBAA`。
- **命名**：扩展 id `mineral-theme`（满足发布前提：theme 结尾、kebab-case、不含 zed/extension 字样）；family 名 `Mineral Theme`；主题 name `Mineral Theme <Variant> [High Contrast]`；产物文件 `themes/mineral-theme.json`（单文件单 family，不拆分）。
- **accent 策略**：烘焙 **Blue `#5393FF`**（2026-10-24 用户拍板；等价 VS Code 版出厂基线）。换色两条路：构建参数 `npx tsx scripts/build-themes.ts --accent=<name|#hex>` 整体重烘焙，或用户侧 `theme_overrides`（受影响键仅 4–6 个，见 research.md §5.3）。
- **语言**：代码与 commit message 用英文（conventional commits：`feat:`/`fix:`/`chore:`/`docs:`…）；讨论与文档用中文。
- **文档同步**：每完成一个可交付单元立即更新 `PROGRESS.md`；映射表定稿后回写 `docs/research.md`。

## 5. 常用命令

```bash
npm install
npm run build          # 生成 themes/mineral-theme.json + ajv Schema 校验 + 确定性/映射完备性校验
npm run typecheck      # tsc --noEmit
npm test               # vitest

# 本机验证：Zed → Extensions 页 → Install Dev Extension → 选择本仓库根目录
# 日志：zed: open log；或终端 zed --foreground 启动看 INFO 输出
```

Zed 侧选择：主题选择器（`cmd-k cmd-t`）→ family「Mineral Theme」→ 切换 20 个主题对照 VS Code 版。

## 6. 里程碑与进度

里程碑定义见 `docs/plan.md`（M0 调研规划 ✅ → M1 骨架+管线 → M2 语法打样 → M3 全变体 → M4 校准 → M5 收尾/可选发布）；进度与决策记录在 `PROGRESS.md`。
