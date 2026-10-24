# PROGRESS.md

开发进度、决策记录与待办。每完成一个可交付单元立即更新本文件。

> 状态图例：`[x]` 完成 · `[~]` 进行中 · `[ ]` 未开始

## 当前状态

**阶段：M1–M3 + M4/M5 可做部分已完成（v0.1.0），待用户在 Zed 中验收** —— 20 个主题已生成并通过全部机器校验（Schema/调色板/accent/HC/覆盖完备性/确定性 33 项断言）。观感级校准与发布决策等待验收反馈。

## 里程碑

- [x] M0 调研与规划（2026-10-24）
- [x] M1 扩展骨架与构建管线（2026-10-24）
- [x] M2 语法映射打样（2026-10-24；截图对照并入用户验收）
- [x] M3 全变体 + High Contrast（2026-10-24）
- [x] M4 视觉校准（派生色已定稿；观感迭代待验收反馈）
- [x] M5 收尾（README/LICENSE/CI 完成）

## 已完成工作

### 2026-10-24 · README 双语化（面向公众）+ CI 打包产物

- **README 重构**：中文原版另存 `README_zh.md`（与英文版同步的对照版）；新写面向公众的英文 `README.md`——含预览图（`docs/images/preview-carbon.png`，Zed 实截 JetBrains Mono + 新边框）、主题表、设计要点、安装（CI 下载包 / dev extension 两种路径）、accent 覆盖、开发指南、发布前置说明、致谢与 License（私有现状 + 发布时转 MIT）。
- **CI 打包**：ci.yml 新增 `Package extension bundle` 步骤——校验通过后将 `extension.toml + themes/ + LICENSE + README` 打成 `my-dark-theme-zed-<version>.zip` 并以 `actions/upload-artifact` 附到 run（版本号从 extension.toml 提取）。**注意：Zed 无 vsix 式侧载格式，zip 需解压后以 Install Dev Extension 加载**；真正上架走 zed-industries/extensions PR（README 发布节已说明）。
- 预览图取自本机 Zed 实截（rust.rs + samples 文件树，裁掉 AI 面板与状态栏）。

### 2026-10-24 · 渲染对比第二轮（用户澄清 + Zig/Scala 补比）

- **用户澄清**：斜体已通过切换 JetBrains Mono 解决（印证 FiraCode 无斜体字面的诊断）；`//!` 暖红来自其注释增强插件（非主题）——文档已撤回该条；注释前缀着色能力将由用户**另立独立插件项目**实现，不在本项目范围。
- **Zig/Scala 补比**（VS Code 补装插件后重截）：Zig 高度一致（const/struct 紫、类型黄、数字橙、字段红、注释灰斜体；pub/fn 色调桶差异属语法层）；Scala 一致项为类型黄/字符串绿/函数蓝/注释斜体，差异为声明关键字色（VS 橙红系 vs Zed 紫）与包根路径（Zed 红 vs VS 白）——均语法捕获差异，维持现状，无映射修改。
- 本轮无代码变更；docs/rendering-comparison.md 修正两处结论并新增 §〇/§六。

### 2026-10-24 · 渲染对比（samples 语料库 + 三层验证）

- **语料库**：`samples/` 24 文件覆盖 C/C++/Rust/Zig/Java/C#/Go/Scala/Kotlin/Python/JS/TS/CSS/Ruby/PHP/SQL/XML/HTML/JSON/TOML/YAML/Markdown/Shell/Swift，每文件刻意覆盖声明/控制/修饰符关键字、函数/类型/属性、字符串转义/模板、注释三态、数字进制、装饰器/宏/预处理器等。
- **方法**：CLI 打开同目录 → computer use 截图（VS Code a11y 点击文件树 / Zed cmd+P，Zed 侧装齐 11 个语法扩展）→ 全帧拼接 → 2x 放大 → 像素采样 + VS Code Token Inspector 裁决。**教训**：1x 截图目测色相不可靠；Inspector 弹窗需光标在 token 内。
- **确认**（详见 docs/rendering-comparison.md）：Zig/Scala 在 VS Code 无 grammar（不可比）；**Zed 斜体实际会渲染**（修正上轮字体结论——合成倾斜生效，用户报的 import 无斜体是映射键缺失）；Rust `pub` VS=Storage 紫（Inspector）vs Zed 青（语法桶限制，不可修）；`//!` 内层文档注释 VS 暖红 vs Zed 灰（无 capture，不可分）；LSP 语义色层不迁移（策略）。
- **修复**：`markup.quote` ← 青斜体（Markdown 区块引用）。36 项测试全绿。
- **待用户复验 7 项**（markdown 粗斜体、JSON 键、Go 常量、Java 关键字桶、C# using、Rust 数字、C 结构体——复验步骤在文档第二节）。

### 2026-10-24 · 验收反馈第 2 轮（斜体排查 + 边框二调）

- **斜体仍不显示 → 定位为字体问题，非主题问题**：证据链（a）主题产物确含 `font_style: italic`（keyword.import/comment/namespace 等）；（b）Zed 官方 One 主题使用同一字段（机制可用）；（c）用户 buffer 字体 `FiraCode Nerd Font Mono` 经字体清单证实全家族无斜体字形（仅 Light/Reg/Med/SemBd/Bold/Ret）；（d）VS Code 的 Chromium 渲染器会合成假斜体而 Zed/GPUI 不会 → 同一字体在 VS Code 有斜体、在 Zed 没有。**解法在用户侧**：换带真斜体的等宽字体（JetBrainsMono NF 最接近 FiraCode 观感；备选 Cascadia Code NF / Maple Mono NF / Iosevka / Victor Mono）。research.md 已记录该前置条件。
- **边框第二档调亮**：`border` 0.14→**0.18**（白）、`border.variant`/`pane_group.border` 0.12→**0.16**（变体前景族基色）；测试同步更新（36 项全绿）。

### 2026-10-24 · 验收反馈第 1 轮（TS 关键字 + 边框）

- **用户报告**：TS 中 `import` 无斜体；`const`/`type` 非紫色；边框偏暗。
- **取证**：Zed 把语法查询编译进二进制（应用包/资源目录均无 .scm）；经 git 历史定位 `crates/languages/src/typescript/highlights.scm`（commit `a75b8c8`）：TS 语法**有** `@keyword.declaration`（const/let/var/function/class/enum/interface/type）与 `@keyword.import`（import/export/from）捕获，首轮映射漏配这两个键——是映射缺口而非 Zed 不能区分。
- **修复**：`syntax-map.ts` 新增 `keyword.declaration` ← 紫、`keyword.import` ← 青斜体；`ui-map.ts` 发丝线族调亮（`border` 白 @0.14、`border.variant`/`pane_group.border` @0.12）。测试 +3（36 项全绿）；`npm run verify` 顺序改为 typecheck → build → test（测试校验磁盘产物新鲜度，build 必须先行）。

### 2026-10-24 · M1–M5 构建执行（v0.1.0）

- **工程**：TypeScript(strict)+tsx+vitest+ajv，无 Rust。仓库根即扩展根：`extension.toml`（id `my-dark-theme`，schema_version 1）、`data/`（vendor 源项目 6 个颜色文件 + variants/）、`scripts/{lib,ui-map,syntax-map,build-themes}.ts`、`test/build.test.ts`（33 项）、`vitest.config.ts`（限定 test/，防误扫 migrate_source）、`.github/workflows/ci.yml`（含确定性检查 `git diff --exit-code -- themes/`）。
- **构建管线**（`npm run build` → `themes/my-dark-theme.json`，单 family 20 主题，155KB）：
  - 合并语义与源项目 build-themes.ts 一致：`ui-shared + variants[v] (+ hc-overrides[v])`，然后 48 个 accentable 键按各自 alpha **重烘焙为 Blue `#5393FF`**（alpha≥1 六位、否则八位）；
  - UI 映射覆盖 Zed One 主题全部 139 个 UI 键（`test/one-ui-keys.json` 夹具强制完备性），派生规则见 research.md §5.3；
  - syntax 映射：46 个 One 规范键 + 7 个细分键（keyword.function/modifier/type、keyword.control、constant.builtin、function.builtin、variable.member），13 基色 × palettes.json 得全变体；
  - 内置 ajv 校验（vendor 的 schema v0.2.0）+ 输出色值全部小写规范化 + 纯函数式 buildFamily（同输入字节级一致）。
- **校验结果**：typecheck ✅ · vitest 33/33 ✅（Schema、确定性、20 主题命名、One 键覆盖、hex 合法性、调色板逐变体断言、accent 三键 + alpha、HC 覆盖、dim 合成、斜体/字重）· build ✅。
- **文档**：research.md §4.3/§5.3 更新为定稿；AGENTS.md accent 条目改为 Blue；plan.md 里程碑状态更新。

## 用户验收清单（M4 观感校准输入）

1. **安装**：Zed → Extensions → Install Dev Extension → 选仓库根；主题选择器 `cmd-k cmd-t` 出现 family「My Dark Theme」20 项。
2. **重点看**（对应已知有损点/派生色）：活动行高亮（源为行边框，现为 15% 底色）、tab 无 accent 指示条（Zed 无该 token）、CSS 属性名红色（Vira 为亮蓝）、关键字斜体是否生效（取决于语法捕获）、查找当前项的 Blue 底色、终端 dim 色、选区/光标（灰选区 + 黄光标）。
3. **待实测的开放问题**：dev extension 下主题文件改动是否热重载；`players[0].selection` 是否即本地选区色；`accents[]` 在 UI 中的实际表现。
4. 反馈方式：直接说现象，改动会落在 `scripts/ui-map.ts` / `syntax-map.ts` + `data/`，重跑 `npm run verify`。

### 2026-10-24 · M0 调研与规划

- **Zed 扩展信息收集**（来源：DevWeb.txt 指向的官方文档 + Theme JSON Schema v0.2.0 + Zed 内置 One 主题 + Catppuccin 扩展实例）：
  - theme-only 扩展 = `extension.toml` + `themes/*.json`，无 Rust；本地用 dev extension 安装调试。
  - Theme Family JSON：`{author, name, themes[{name, appearance, style}]}`；style 约 141 键 + `syntax`（Tree-sitter capture 名，参照 One 主题 46 键）+ `players`（本地光标/选区走 `players[0]`）+ `accents`。
  - 发布 = 向 `zed-industries/extensions` 提 PR（公开仓库 + 接受的 license + theme 结尾的 id）；发布与否留作用户决策。
- **源项目数据模型确认**：81 条 tokenColors 规则仅引用 13 个基色 × `palettes.json` → 全变体语法色可程序化推导；这是 Zed 版 syntax 映射表的设计依据。
- **关键差异与策略**（详见 `docs/research.md` §4）：
  1. TextMate scope → Tree-sitter capture：按类目建映射表，有损复刻（keyword/storage 不可分，取青）；
  2. `semanticTokenColors` 无对应机制，弃用；
  3. 无运行时 → accent 烘焙原生 teal（= VS Code 版 `accent: Default`）；
  4. HC 作为独立主题命名，无档位元数据；
  5. VS Code 279 UI 色 → Zed 141 键：~60% 直接对应，其余语义归类/派生（映射表草案见 research.md §5）。
- **产出文档**：`docs/research.md`、`docs/plan.md`、`AGENTS.md`、本文件。
- 待 M1 实测的开放问题：dev extension 主题文件热重载行为；`players[0].selection` 是否即本地选区；`accents[]` 实际用途。
- **Accent 专项分析（2026-10-24）**：程序化核对 `ui-shared.json` × `customization.json`——49 个 accent 染色键中能在 Zed 找到对应 token 的仅约 4–6 个（`text.accent`、`icon.accent`、`link_text.hover`、`element.active` 弱染色，可选 `border.selected`）；tab 底部指示条、按钮/徽章/progressBar/notebook/chat 等在 Zed 均无 token。结论：Zed 里 accent 的"表面积"远小于 VS Code，方案定为 A（MVP 烘焙原生 teal）先行，C（`theme_overrides` 片段）满足日常换色，B（accent 变体主题）为可选追加。

## 决策记录

| 日期 | 决策 | 理由 |
|---|---|---|
| 2026-10-24 | 范围只含 color theme；icon 另立项目 | 用户指定（Zed 插件生态 color/icon 分开实现） |
| 2026-10-24 | 技术栈 TS(strict)+tsx+vitest+ajv，无 Rust | theme-only 扩展不需要 Rust；与用户源项目工具链习惯一致 |
| 2026-10-24 | 单文件 `themes/my-dark-theme.json` 承载 family + 20 主题 | 单 family 单文件，规避多文件 family 合并行为的不确定性 |
| 2026-10-24 | `data/` vendor 自 `migrate_source/data`，手动同步；构建脚本不跨目录读源 | 未来公开仓库时源项目不随包；保证扩展自包含 |
| 2026-10-24 | accent 烘焙原生 teal | Zed 无运行时；原生色 = VS Code 版 `Default` 档观感，零额外决策 |
| 2026-10-24 | 仓库根即扩展根；`migrate_source/` gitignore | dev extension 直接选本目录；公开时不泄露源项目 |
| 2026-10-24 | 发布（registry）延后为可选里程碑 M5，需用户确认 | 发布要求公开仓库 + 开源 license，属用户决策（延续源项目"仅个人使用"政策） |
| 2026-10-24 | Git 仓库已初始化（本目录根，扩展即仓库根） | 用户执行 |
| 2026-10-24 | **暂不公开发布**，待法律/合规风险评估后再决策 | 用户要求；风险摘要：配色值不受版权保护、未复制 Vira 闭源代码/图标字体/文案资产、命名与商标无冲突；若发布需另过 registry 自查（查重、license、文案原创） |
| 2026-10-24 | Accent 方案：A（MVP 烘焙原生 teal）先行；C（`theme_overrides` 用户侧覆盖片段）满足日常换色；B（accent 变体主题）可选追加 | Zed 主题为静态 JSON 无运行时；accent 受影响 token 仅 4–6 个，B 的"每变体 20 个新主题"性价比低；A→B 可无缝升级（构建已参数化空间） |
| 2026-10-24 | **Accent 修订：A 方案落定，但烘焙色改为 Blue `#5393FF`**（非原生 teal） | 用户拍板：Vira 原生 teal 太轻，Blue 观感更好；等价于 VS Code 版出厂 Blue 基线（v0.5.2）。C（theme_overrides）记为未来可能的变更手段 |
| 2026-10-24 | 注释前缀着色能力将由用户**另立独立插件项目**实现，不在本项目范围 | 用户决策 |
| 2026-10-24 | **扩展更名 Mineral Theme**（id `mineral-theme`，family/主题名/产物文件/CI 产物/双语 README/LICENSE/样例语料同步更名；产物文件 themes/my-dark-theme.json → themes/mineral-theme.json） | 用户从矿物系候选（Mineral/Basalt/Stratum/Terrane/Lithic）中选定 Mineral——与 10 个地质系变体名（Carbon/Graphene/Clay…）谱系一致；VS Code 版项目名保留 My Dark Theme 不变 |
| 2026-10-24 | 市场显示名定为复数 **Mineral Themes**（id 保持单数 `mineral-theme`） | 用户观察 registry 惯例；id 侧官方示例与 468:23 的统计均为单数，家族/主题名单数 |
| 2026-10-24 | **发布准备完成**：LICENSE 换 MIT（HarryC919）、extension.toml 补 repository 字段、作者署名改 HarryC919；仓库已由用户公开推送（github.com/HarryC919/MineralThemeForZed）；剩余 = 用户向 zed-industries/extensions 提 PR（fork → submodule → extensions.toml 条目） | 用户决定上架并已自行 push |

## 待办 / 已知问题

- [ ] 用户向 `zed-industries/extensions` 提 PR 上架（fork → `git submodule add` → extensions.toml 条目 → `pnpm sort-extensions` → PR；规则：单 PR 单扩展、≤3 开放 PR、3 周内响应 review）
- [ ] 数据同步：`migrate_source/data` 改色后手动重新 vendor 到 `data/`（6 文件 + variants/；`semanticTokenColors.json` 仅存档，Zed 不使用）
