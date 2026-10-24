# My Dark Theme for Zed

为 Zed 复刻的暗色主题扩展，移植自 VS Code 版 [My Dark Theme](./migrate_source)（视觉对标 Vira Theme，基于开源 Material 色板衍生配色）。

**仅个人使用**：通过 dev extension 装入本地 Zed；私有仓库，暂不发布（LICENSE 与发布前置条件见 `LICENSE.txt` / `docs/research.md`）。

## 内容

- **20 个颜色主题**：10 个背景变体（Carbon / Anthracite / Clay / Deepforest / Graphene / Montana / Ocean / Palenight / Sand / Teal）× 常规 + High Contrast，单 family「My Dark Theme」。
- **Accent 已烘焙为 Blue `#5393FF`**（等价 VS Code 版默认 accent）。Zed 主题是静态 JSON、无运行时，因此不做动态换色；想临时换 accent 可用 `theme_overrides`（见下）。
- 编辑器语法色按「13 基色 × 各变体调色板」生成（与 VS Code 版同一套数据），UI 色与终端 ANSI 逐键映射——映射表与取舍见 `docs/research.md`。

## 本地安装（dev extension）

```bash
npm install && npm run build   # 生成 themes/my-dark-theme.json
open -a Zed .                  # 或在 Zed 里：命令面板 → zed: open
```

然后在 Zed 中：Extensions 页 → **Install Dev Extension** → 选择本仓库根目录（含 `extension.toml` 的目录）。用主题选择器（`cmd-k cmd-t`）切换 20 个主题。

排查：`zed: open log` 查看日志；终端 `zed --foreground` 可看 INFO 级输出。

## 改 accent 色（可选）

在 Zed `settings.json` 中按主题名覆盖（示例 Carbon，其余主题名同理）：

```json
{
  "theme_overrides": {
    "My Dark Theme Carbon": {
      "text.accent": "#FF669Eff",
      "icon.accent": "#FF669Eff",
      "link_text.hover": "#FF669Eff",
      "element.active": "#FF669E26"
    }
  }
}
```

构建时也可整体换 accent 重新生成：`npx tsx scripts/build-themes.ts --accent=pink`（支持 14 个预设名或任意 `#hex`）。

## 开发

- 技术栈：TypeScript（strict）+ tsx + vitest + ajv，**无 Rust**（theme-only 扩展不需要）。
- 数据流：`data/`（vendor 自 `migrate_source/data` 的颜色数据）→ `scripts/build-themes.ts` → `themes/my-dark-theme.json`（生成产物，**禁止手改**）。`scripts/ui-map.ts` / `scripts/syntax-map.ts` 是 VS Code → Zed 的键位映射表。
- 校验：`npm run verify` = typecheck + vitest（Schema/调色板/accent/HC/覆盖完备性/确定性 33 项断言）+ build（内置 ajv Schema 校验）。
- 文档：`AGENTS.md`（项目约定）、`docs/research.md`（调研与映射表）、`docs/plan.md`（里程碑）、`PROGRESS.md`（进度与决策）。

## 致谢

- 配色基于 Material 开源色板与 Vira Theme 的公开可观察色彩值衍生；与 VS Code 版共享同一套颜色数据。
- Zed 侧 syntax 键名集合参照 Zed 内置 One 主题；主题格式遵循 [Zed Theme JSON Schema v0.2.0](https://zed.dev/schema/themes/v0.2.0.json)。
