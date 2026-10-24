# Mineral Theme 渲染示例

> 一个用于对比 VS Code 与 Zed 渲染的 Markdown 文件。

## 行内元素

普通文本与 **粗体**、*斜体*、***粗斜体***、~~删除线~~、`行内代码`、
[链接](https://example.com)、自动链接 https://zed.dev 以及 [引用式链接][ref]。
还包括图片：![预览](img/preview.png "标题") 和 HTML `<em>行内</em>` 元素。

[ref]: https://example.com/ref "引用式链接"

### 列表

1. 有序第一项
2. 有序第二项
   - 嵌套无序
   - 另一项
     1. 更深一层
3. 待办
   - [x] 已完成
   - [ ] 未完成

### 代码块

```rust
fn main() {
    let accent = "#5393FF"; // rust fence inside markdown
}
```

```json
{"theme": "carbon", "contrast": false}
```

无语言围栏：

```
plain fenced text
```

缩进代码：

    indented code block

### 表格与分隔线

| 变体 | 背景 | 高对比 |
|:-----|-----:|:------:|
| Carbon | `#0A0A0A` | ✅ |
| Teal | `#263238` | ❌ |

---

### 其他

脚注[^1] 与术语。

[^1]: 脚注内容。

任务关键词：if for return while class def —— 这些不会高亮（纯文本）。
