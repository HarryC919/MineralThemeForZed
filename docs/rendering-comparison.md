# VS Code vs Zed 渲染对比记录（2026-10-24）

对比语料：`samples/`（23 个语言/文件类型）；两个编辑器均为 **My Dark Theme Carbon**。
方法与工具链：CLI 打开同一目录 → computer use 逐文件截图（VS Code 走无障碍文件树点击，Zed 走 cmd+P）→ 三层验证：

1. **全帧对比图**（VS 上 / Zed 下拼接）——定位可疑区域；1x 缩略图上色相会失真，只用于发现问题；
2. **2x 放大裁剪**（NEAREST）——确认字形与斜体渲染；
3. **像素采样 + VS Code Token Inspector**（`cmd+shift+P` → *Developer: Inspect Editor Tokens and Scopes*，需先把光标点进 token 内部，弹窗才稳定显示）——最终裁决。

结论分三档：**已确认**（检查器/语法源码级）、**待复验**（采样一致但未到检查器级，附复验步骤）、**不可比/接受**。

## 一、已确认的差异与结论

### 1. VS Code 侧有两个语言没有语法着色（不可比）

- **Zig**：VS Code 无 Zig grammar（Inspector 返回 "No grammar or semantic tokens available"，状态栏 Plain Text，整文件单色前景）。Zed 侧 zig 扩展正常高亮。
- **Scala**：VS Code 同样单色（颜色多样性检验：亮像素 100% 为中性灰）。
- 影响：这两个文件只在 Zed 侧有效。若要对比，VS Code 需装 Zig/Scala 扩展后重截。

### 2. 斜体：Zed 实际会渲染（用户此前看到的现象是字体+映射缺口叠加）

- 2x 放大确认 Zed 注释（`//!`、`///`）**斜体字形可见**——Zed/GPUI 对无斜体字面会合成倾斜，此前"FiraCode 无斜体所以斜体全灭"的结论**修正**：合成斜体是生效的。
- 用户报告的 `import` 无斜体，根因是当时缺 `keyword.import` 映射键（青色与关键字同色，唯一信号就是斜体缺失）。**该键已补，请重验 `import`/`export`/`from` 是否倾斜。**
- 备注：VS Code 的合成斜体更"斜"（Chromium 风格），Zed 的合成倾斜幅度较小——观感差异存在但属渲染器行为，主题无法控制。

### 3. Rust `pub`：VS Code = Storage 紫（检查器确认），Zed = 青（语法桶限制）

- Inspector 实测：`pub` textmate scope = `storage.modifier.visibility.rust` → 命中模板 **Storage 规则 → 紫 #A17BC4**。
- Zed 1.25.3 的 Rust 语法把 `pub` 归入笼统 `@keyword`（无 `@keyword.storage` 细分，TS 语法才有 `@keyword.declaration`）→ 青。
- **不可修**（改 `keyword` 本色会波及所有关键字）；`const`/`fn`/`struct` 在 Zed Rust 同理。Zig/Go 的同类关键字亦然。

### 4. Rust 内层文档注释 `//!`：VS Code 暖红色，Zed 灰色

- 像素采样多行一致：VS Code `//!` 渲染为暖红棕色系，`///` 为灰 #45454A（模板 Comment 规则）——VS Code 的 Rust 语法对两者 scope 不同。
- Zed 无单独的 inner-doc capture（`comment` 顶层覆盖两种），**不可分**。接受。

### 5. LSP 语义色层：VS Code 有、Zed 无（系统性策略）

- VS Code 侧 rust-analyzer/tsserver/C# DevKit 会输出语义 token 并与 TextMate 规则做回退匹配，产生模板之外的着色（如 Rust 字段名白、部分类型名经 semantic class→蓝）。
- **策略：Zed 侧以模板 TextMate 规则原义为准，不模拟 LSP 语义色。** 因此 Rust 字段（VS 白 vs Zed 红）、Go 常量等按 TS 场景的观感优先。

### 6. Markdown 区块引用：已修复

- VS Code：`markup.quote` 文本 = 青色斜体（模板 "Markdown - Blockquote" 规则）。
- Zed：`@markup.quote` 原先无键 → 白色。**已补 `markup.quote` ← 青斜体**（syntax-map.ts），重建后生效。

## 二、待复验（采样指向差异，请用 Inspector 确认后告知）

复验方法：把光标点进目标 token → `cmd+shift+P` → `Inspect Editor Tokens and Scopes` → 把弹窗里的 textmate scopes / semantic token / foreground 告诉我即可。

| # | 位置 | VS Code 采样 | Zed 现状 | 猜测 |
|---|---|---|---|---|
| 1 | markdown `**粗体**` / `*斜体*`（samples/markdown.md L7） | 偏蓝（意外，模板应为红） | 红 | VS 的 markdown 语法可能把 emphasis 映射到别的 scope，需确认后决定 Zed 侧是否跟随 |
| 2 | JSON 键（samples/json.json） | 紫灰（"JSON Key Level 0" 紫规则） | 红（`property`） | VS 按嵌套层级变色（紫→黄→橙…），Zed 单键不可分层；确认后维持红或改紫 |
| 3 | Go 常量 `MaxWorkers` | 白 | 蓝青（`constant`） | VS 的 Go 语法把 const 名归 variable；确认后可把 Zed `constant` 改前景色 |
| 4 | Java `package`/`import` | 橙（keyword.other） | 白/青 | Java 语法关键字桶差异，大概率不可分 |
| 5 | C# `using`/`namespace` | 蓝灰系 | 灰白系 | C# DevKit 语义干扰，确认 TextMate 层 |
| 6 | Rust 数字 `0x1F90` | 采样偏灰（模板应为橙） | 暖橙 ✓ | 可能是采样落在选区上，复验 |
| 7 | C 结构体名 `Point` / `int` | 采样偏蓝（异常） | 黄 | 需确认（可能采样错位） |

## 三、本次已落地的修复

1. `keyword.declaration` ← 紫、`keyword.import` ← 青斜体（上一轮，TS 语法源码 ground truth）。
2. `markup.quote` ← 青斜体（本轮）。
3. 之前轮次：边框两轮调亮（border 0.18 / variant 0.16）。
4. 测试 36 项全绿；`npm run verify` 通过。

## 四、对比工件与复现

- 截图与放大图（临时目录，重启后清理）：`/tmp/theme-compare/`（`vs/`、`zed/`、`zoom/`、`sheet/`）。
- 复现：`sampler.py`/`table2.py`（像素采样+色相分类）、`sheet.py`（行级接触表）在 `/tmp/theme-compare/`；几何校准参数（VS: y1=63/lh=16.5/x0=268/cw=6.8；Zed: y1=99/lh=17.7/x0=228/cw=6.9）对该窗口布局有效。
- 经验教训（已固化到流程）：1x 截图目测色相不可靠（紫会被读成暖红）；Inspector 弹窗需要光标在 token 内；采样判定色相家族可信、判定精确色值不可信。

## 五、结构性差异备忘（不可修，来自 research.md §5.3）

- tab 底部 accent 指示条：Zed 无 token。
- semanticTokenColors / LSP 语义色：Zed 无此层。
- CSS 属性名：Vira 亮蓝，Zed 与 JSON/TS 成员共用 `property`（红）。
- `keyword.control` 斜体依赖语法捕获（Zed TS 有；部分语言没有）。
- JSON 键按嵌套层级变色：Zed 无层级 capture。
