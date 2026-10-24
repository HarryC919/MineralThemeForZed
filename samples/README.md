# 渲染对比示例语料库

用于对比 **VS Code（Mineral Theme Carbon）** 与 **Zed（Mineral Theme Carbon）** 的语法渲染差异。每个文件刻意覆盖尽可能多的语法构造：

- 关键字：声明（const/let/fn/class/interface/type…）、控制流（if/for/while/match/try…）、修饰符（public/static/final…）、导入（import/use/using…）
- 函数：定义 / 调用 / 方法 / 内置函数 / 宏 / lambda
- 类型：类 / 接口 / 枚举 / 结构体 / trait / 泛型 / 内置类型
- 字符串：普通 / 转义 / 模板插值 / 正则 / 原始字符串 / 多行
- 注释：行 / 块 / 文档（`///`、`/** */`、`#!`）
- 数字：十进制 / 浮点 / 十六进制 / 二进制 / 带分隔符
- 其他：装饰器 / 属性 / 宏 / 预处理器 / 运算符 / 标点 / 异常 / 空值

| 文件 | 语言 | 备注 |
|---|---|---|
| `c.c` | C | 预处理器、指针、struct/enum/union |
| `cpp.cpp` | C++ | 模板、命名空间、STL、lambda |
| `rust.rs` | Rust | 宏、生命周期、trait/impl、? 运算符 |
| `zig.zig` | Zig | @内置函数、comptime、错误集 |
| `java.java` | Java | 注解、record、泛型、switch 表达式 |
| `csharp.cs` | C# | LINQ、async、属性、#region |
| `go.go` | Go | goroutine/channel、defer、接口 |
| `scala.scala` | Scala | case class、模式匹配、given |
| `kotlin.kt` | Kotlin | data class、when、扩展函数、协程 |
| `python.py` | Python | 装饰器、推导式、async、match、类型注解 |
| `javascript.js` | JS | 箭头函数、类、模板串、正则、生成器 |
| `typescript.ts` | TS | 接口/类型/枚举、泛型、as/satisfies |
| `css.css` | CSS | 各类选择器、@规则、变量、函数 |
| `ruby.rb` | Ruby | 符号、块、元编程、正则、heredoc |
| `php.php` | PHP | 命名空间、trait、#[属性]、match |
| `sql.sql` | SQL | DDL、JOIN、CTE、窗口函数、CASE |
| `xml.xml` | XML | 命名空间、CDATA、PI、实体 |
| `html.html` | HTML | 语义标签、属性、内联样式/脚本 |
| `json.json` | JSON | 嵌套、转义、数字、布尔、null |
| `toml.toml` | TOML | 表、行内表、多行字符串、日期 |
| `yaml.yaml` | YAML | 锚点/引用、多行字符串、类型隐式转换 |
| `markdown.md` | Markdown | 标题/强调/代码/链接/表格/引用 |
| `shell.sh` | Shell | 变量展开、控制流、函数、管道重定向 |
| `swift.swift` | Swift | 协议、扩展、闭包、可选值、guard |

对比结论记录在 `docs/rendering-comparison.md`。
