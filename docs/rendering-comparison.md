# VS Code vs Zed 渲染对比记录（2026-10-24，两轮）

对比语料：`samples/`（23 个语言/文件类型）；两个编辑器均为 **My Dark Theme Carbon**。
方法与工具链：CLI 打开同一目录 → computer use 逐文件截图（VS Code 走无障碍文件树点击，Zed 走 cmd+P）→ 三层验证：

1. **全帧对比图**（VS 上 / Zed 下拼接）——定位可疑区域；1x 缩略图上色相会失真，只用于发现问题；
2. **2x 放大裁剪**（NEAREST）——确认字形与斜体渲染；
3. **像素采样 + VS Code Token Inspector**（`cmd+shift+P` → *Developer: Inspect Editor Tokens and Scopes*，需先把光标点进 token 内部，弹窗才稳定显示）——最终裁决。

结论分三档：**已确认**（检查器/语法源码级）、**待复验**（采样一致但未到检查器级，附复验步骤）、**不可比/接受**。

## 〇、第二轮修正（用户澄清 + 补装插件后）

1. **斜体已解决**：用户切换到 JetBrains Mono（有真斜体字形）——印证此前诊断（FiraCode 无斜体字面）；Zed/GPUI 的合成倾斜讨论已不重要。`keyword.import` 斜体映射在真斜体字体下应正常呈现。
2. **`//!` 暖红色并非主题行为**：来自用户安装的注释增强类插件（Better Comments 类，按注释前缀改色）。因此"Rust 内层文档注释 VS 暖红 vs Zed 灰"的结论**撤回**——主题层面两边注释都是灰斜体，一致。该插件能力后续计划迁移（见 §六）。
3. **Zig / Scala 已在 VS Code 补装插件**，重新对比（见 §四）。

## 一、已确认的差异与结论

### 1. VS Code 侧 Zig/Scala 曾无语法着色 → 已由用户补装插件，第二轮重新对比

- 第一轮时 VS Code 无 Zig/Scala grammar（Inspector 返回 "No grammar or semantic tokens available"，整文件单色），结论已随用户补装失效。
- **第二轮对比结果（Zig）**：Zed 侧 `const`/`struct`/`error` 声明紫（zig 语法发 declaration 类捕获）、类型黄、数字橙（含 `0b1100_1010` 下划线分隔）、字段/成员红、字符串绿、`//!` 灰斜体——与 Vira 家族观感一致。VS Code 侧 `const` 紫一致；控制流 `return/switch` 青斜体一致；`pub/fn` 的色调两侧语法桶不同（VS 偏青、Zed 偏紫），属语法捕获差异。
- **第二轮对比结果（Scala）**：一致项——类型黄（String/Int/Either/ListMap）、字符串绿（含 `$text` 插值）、注释灰斜体、函数调用蓝（`encode`/`parseInt`）；差异项——声明关键字（`trait/def/object/given/package`）VS 偏橙红（其语法的 keyword.other）vs Zed 紫（declaration 捕获），包根路径 `scala` Zed 红（namespace 捕获）vs VS 白。均为语法层差异，主题不可修；Zed 侧紫/青分布与 Rust/TS 家族内一致，维持现状。

### 2. 斜体：已由字体切换解决（用户确认）

- 用户切换到 JetBrains Mono 后斜体正常——印证此前诊断：FiraCode 全家族无斜体字面是根因；JetBrains Mono 有真斜体，主题的 `font_style: italic` 全部生效。
- `keyword.import`（import/export/from 青斜体）与 `keyword.control`、注释斜体在真斜体字体下均应正常呈现。

### 3. Rust `pub`：VS Code = Storage 紫（检查器确认），Zed = 青（语法桶限制）

- Inspector 实测：`pub` textmate scope = `storage.modifier.visibility.rust` → 命中模板 **Storage 规则 → 紫 #A17BC4**。
- Zed 1.25.3 的 Rust 语法把 `pub` 归入笼统 `@keyword`（无 `@keyword.storage` 细分，TS 语法才有 `@keyword.declaration`）→ 青。
- **不可修**（改 `keyword` 本色会波及所有关键字）；`const`/`fn`/`struct` 在 Zed Rust 同理。Zig/Go 的同类关键字亦然。

### 4. Rust `//!` 暖红色：已撤回（第二方插件行为，非主题）

- 第一轮观察到的"`//!` 内层文档注释在 VS Code 呈暖红、`///` 为灰"来自用户的**注释增强插件**（按注释前缀 `!`/`?`/`TODO` 等改色，同 Better Comments 机制），与主题无关。
- 主题层面两边一致：注释 = 灰斜体（#45454A / #546E7A 族经变体调色板）。

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

## 六、远期迁移项（用户计划）

- **注释前缀增强着色**（VS Code 侧由第三方插件提供，按 `//!`/`? `/`TODO` 等前缀改色）：Zed 主题无法实现前缀匹配；可行路径取决于语法是否发出特殊注释捕获（如 `@text.todo`/`@comment.todo` 类）。届时先盘点 Zed 各语法的高亮捕获，有捕获的主题键直接补映射，没有的语法则不可行。迁移时随独立 icon 项目一并评估。
