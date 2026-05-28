<template>
  <div class="min-h-screen flex flex-col items-center justify-center p-8">
    <h1 class="text-3xl font-bold text-[#012d6a] mb-6">前人树</h1>
    <div class="max-w-2xl w-full border rounded-lg p-6">
      <MarkdownRenderer :markdown="sampleMarkdown" />
    </div>
  </div>
</template>

<script setup>
import MarkdownRenderer from './components/MarkdownRenderer.vue'

const sampleMarkdown = `## 欢迎使用前人树

这是一段 **Markdown** 示例文本，支持 *斜体* 和行内代码 \`const x = 1\`。

### 数学公式

行内公式：$E = mc^2$

块级公式：

$$
\\int_{-\\infty}^{\\infty} e^{-x^2} dx = \\sqrt{\\pi}
$$

> 引用：前人栽树，后人乘凉。

- 法学
- 数学
- 经管
`
</script>
