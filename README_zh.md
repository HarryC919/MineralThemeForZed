# Mineral Themes for Zed（中文说明）

> 英文版 [README.md](README.md) 为正式版，本文件为中文对照；两者内容保持同步。

一个面向 [Zed](https://zed.dev) 的暗色主题家族：**10 个背景变体**，每个都有常规与高对比两档——单 family 共 **20 个主题**。语法色基于经典开源 Material 色板构建，各变体带独立的去饱和调色板、独立终端 ANSI 配色，accent 全表面一致。

![Mineral Theme Carbon 预览](docs/images/preview-carbon.png)

## 主题

| 变体 | 编辑器背景 | 变体 | 编辑器背景 |
|---|---|---|---|
| Carbon | `#0A0A0A` | Ocean | `#0F111A` |
| Anthracite | `#151719` | Palenight | `#232634` |
| Clay | `#1B1818` | Sand | `#131210` |
| Deepforest | `#111816` | Teal | `#263238` |
| Graphene | `#212121` | Montana | `#130F15` |

每个变体都有对应的 **High Contrast** 版（如 *Mineral Theme Carbon High Contrast*），编辑器背景提亮一档并重新校准对比度。主题选择器中呈现为单一 family：**Mineral Theme**。

## 设计要点

- **语法高亮按 Tree-sitter 捕获映射**（非 TextMate scope）：声明关键字（紫）、控制流（青斜体）、类型（黄）、函数（蓝）、属性/成员（红）、字符串（绿）、数字（橙）、注释（灰斜体）。
- **斜体**覆盖注释、文档注释、控制流关键字、import 与 markup——想获得预期观感请使用带真斜体的字体（如 JetBrains Mono）。
- **accent 烘焙为蓝 `#5393FF`**，作用于 `text.accent`、`icon.accent`、链接、激活态元素微染与查找当前项。Zed 主题没有运行时，accent 可通过 Zed 的 `theme_overrides` 按主题覆盖（见下），或在构建时更换。
- 终端色为逐变体完整 ANSI 调色板（normal / bright / 合成的 dim 行）。
- UI 色逐键翻译自 VS Code 原版（约 140 个 Zed style 键，有覆盖完备性测试），含 git 状态、diff 高亮、滚动条、查找匹配与编辑器文档高亮。

## 安装

### 从 CI 产物安装（下载包）

每次 CI 都会附上可直接使用的 bundle（`extension.toml` + 生成的 `themes/`）：

1. 从最新一次 CI run 下载 `mineral-theme-zed-<version>.zip`。
2. 解压到任意位置。
3. Zed：打开 Extensions 页（`zed: extensions`）→ **Install Dev Extension** → 选择解压后的文件夹。
4. 主题选择器（`cmd-k cmd-t` / `ctrl-k ctrl-t`）中选择变体。

> 注意：Zed 没有可侧载的包格式（没有 vsix 等价物）——扩展要么以 dev extension 方式从目录加载，要么从[扩展市场](https://zed.dev/extensions)安装。CI 的 zip 就是那个目录的压缩包。

### 从源码以 dev extension 安装

```bash
git clone <本仓库>
cd MineralForZed
npm install
npm run build        # 生成 themes/mineral-theme.json
```

然后在 Zed 中 **Install Dev Extension**，选择仓库根目录（含 `extension.toml` 的目录）。

## 更换 accent 色

烘焙的 accent 有两种覆盖方式：

**按主题，在 Zed 设置里**（即时生效，无需重建）：

```json
{
  "theme_overrides": {
    "Mineral Theme Carbon": {
      "text.accent": "#FF669Eff",
      "icon.accent": "#FF669Eff",
      "link_text.hover": "#FF669Eff",
      "element.active": "#FF669E26"
    }
  }
}
```

**构建时**（以另一个 accent 重新生成整个家族）：

```bash
npx tsx scripts/build-themes.ts --accent=pink   # 14 个预设名或任意 #hex
```

## 开发

仓库根即扩展根。`themes/mineral-theme.json` 是**生成产物**——改色请改 `data/` 与 `scripts/` 里的映射表，不要手改输出。

```
extension.toml            Zed 扩展清单（id: mineral-theme）
themes/                   生成的主题家族（单文件 20 主题）
data/                     颜色唯一数据源（调色板、逐变体 UI 色、HC 覆盖、accent 规格）
scripts/ui-map.ts         VS Code → Zed UI 色映射（覆盖 One 主题全部 139 键，有测试）
scripts/syntax-map.ts     语法键 → 调色板角色（46 规范键 + 7 扩展键）
scripts/build-themes.ts   构建器 + JSON Schema 校验 + accent 烘焙
test/                     vitest：Schema、确定性、调色板、accent、HC 断言
```

常用命令：

```bash
npm run verify    # typecheck + build（ajv Schema 校验）+ 36 项测试
npm run build     # 仅构建
npm test          # 仅测试
```

构建是确定性的（相同输入产出字节级一致的输出），并对照[官方 Zed 主题 JSON Schema](https://zed.dev/schema/themes/v0.2.0.json) 校验。CI 在每次 push 时跑完整管线并重新打包可下载 bundle。

## 开发 Agent

本扩展由 **ZCode** 编码 Agent 端到端完成，底层模型为 **GLM-5.3-Flash**（Z.ai）——调研、里程碑规划、数据管线与映射表、20 个生成主题、测试套件、VS Code 与 Zed 的像素级渲染对比，以及你正在读的这些文档。关键决策（命名、accent 色、范围、是否上架）均由人工把关。

## 致谢

- 颜色值衍生自作者自己的 VS Code 主题，其配色基于开源 **Material 色板**（因 Material Theme 与 Vira Theme 而广为人知）。
- 语法键集合遵循 Zed 内置 **One** 主题的约定；主题格式对齐[官方 Theme JSON Schema v0.2.0](https://zed.dev/schema/themes/v0.2.0.json)。

## License

以 [MIT License](LICENSE.txt) 发布。
