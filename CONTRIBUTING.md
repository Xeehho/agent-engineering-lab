# 贡献与课程编写约定

欢迎改进讲解、复现错误和补充失败案例。代码采用MIT，原创教学内容采用CC BY 4.0，提交前请阅读[许可范围](LICENSING.md)。贡献应为自己有权提交的内容，并按对应内容类型授权。

## 新课格式

网站内学习是默认路径；无需安装依赖的网页实验优先，真实组件与完整项目单列为进阶实操。入门讲义与代码在course/beginners/，入门练习在assessment.mjs；进阶代码在course/browser-demos/与course/tutorials/code/，函数阅读拆解在course/tutorials/walkthrough/。每课脑图源在course/knowledge-graphs.mjs，总架构源在course/architecture.mjs。不要直接修改生成的HTML、讲义或SVG。

示例先解释输入输出与一个具体执行过程，再给完整文件。使用明确命名、分段控制流、中文注释与有提示的故障练习。不要用长链或压缩语句省略教学步骤。运行teaching:format后再生成教材。

课程使用稳定编号，例如S1-L01。请配套提供：

- lessons/完整讲义：概念、例子、反例、限制及引用。
- notes/复习提要。
- exercises/随堂题；正式考试题与答案不预置在课程中。
- examples/可复现实验，说明是否离线、预期输出和验证边界。
- course/README.md中的目录项。

技术资料优先引用官方来源。示例使用合成数据，避免真实客户工单、账号、密钥或个人学习成绩。个人学习原始记录不要直接并入通用教材。

## 提交验证

运行npm run check；新增示例还应实际运行并核对预期。Markdown链接应能定位到已有文件或支持相关结论的来源。保留package-lock.json。

提交说明写清学了什么、增加了什么可验证示例、有哪些限制。不要因公开练习已经通过就修改考试结果。AI可参与写作和代码，但贡献者需要核对事实、引用和执行结果。

更多规则见[课堂资料沉淀约定](course/TEACHING.md)。

## Codex共同作者

本项目使用[Codex](https://github.com/codex)辅助课程编写、代码开发与验证。按维护者要求，后续由Codex协助完成并创建的提交统一保留共同作者署名；提交说明末尾空一行，再加入：

```text
Co-authored-by: Codex <noreply@openai.com>
```

保留实际开发者的作者身份与已有共同作者。GitHub按提交中的姓名、邮箱关联贡献者，规则见[多作者提交说明](https://docs.github.com/en/pull-requests/how-tos/commit-changes/creating-a-commit-with-multiple-authors)。仅使用AI工具不自动证明技术正确，提交者仍需核对内容和验证结果。
