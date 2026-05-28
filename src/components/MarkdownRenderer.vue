<template>
  <div ref="rootRef" class="markdown-body prose max-w-none" v-html="renderedHtml" @dblclick="onDblClick" />
  <FloatingTooltip ref="tooltipRef" />
</template>

<script setup>
import { ref, computed } from 'vue'
import { marked } from 'marked'
import katex from 'katex'
import FloatingTooltip from './FloatingTooltip.vue'

const props = defineProps({
  markdown: { type: String, default: '' },
  subject: { type: String, default: '' }
})

const rootRef = ref(null)
const tooltipRef = ref(null)

marked.setOptions({ breaks: true, gfm: true })

function renderMath(text) {
  let result = text.replace(/\$\$([\s\S]*?)\$\$/g, (_match, formula) => {
    try {
      return katex.renderToString(formula.trim(), { displayMode: true, throwOnError: false })
    } catch { return `<pre>${formula}</pre>` }
  })

  result = result.replace(/(?<!\$)\$(?!\$)([\s\S]*?)(?<!\$)\$(?!\$)/g, (_match, formula) => {
    try {
      return katex.renderToString(formula.trim(), { displayMode: false, throwOnError: false })
    } catch { return `<code>${formula}</code>` }
  })

  return result
}

const renderedHtml = computed(() => {
  if (!props.markdown) return ''
  return marked.parse(renderMath(props.markdown))
})

async function onDblClick(event) {
  const selection = window.getSelection()
  const word = selection?.toString().trim()
  if (!word || word.length < 2 || word.length > 30) return

  const rect = rootRef.value?.getBoundingClientRect()
  const x = event.clientX
  const y = rect ? rect.bottom - 8 : event.clientY

  tooltipRef.value?.show(word, x, y)

  let localChunks = []
  let aiText = ''

  // 1. Search local knowledge chunks
  if (window.electronAPI && props.subject) {
    try {
      const result = await window.electronAPI.searchKnowledge(word, props.subject)
      if (result.success) localChunks = result.data
    } catch { /* ignore */ }
  }

  // 2. Try AI enhancement
  if (window.electronAPI) {
    try {
      const contextPrompt = localChunks.length > 0
        ? `参考以下资料片段：\n${localChunks.map(c => c.content).join('\n---\n')}`
        : ''
      const aiResult = await window.electronAPI.callDeepSeek([
        { role: 'system', content: `你是${props.subject || '学科'}领域的辅导老师。请用1-2句简洁的话解释以下专业名词，帮助中南大学生期末复习。${contextPrompt}` },
        { role: 'user', content: `请解释：${word}` }
      ])
      if (!aiResult.offline && aiResult.content) {
        aiText = aiResult.content
      }
    } catch { /* ignore */ }
  }

  tooltipRef.value?.setResults(localChunks, aiText)
  tooltipRef.value?.autoDismiss(5000)
}
</script>

<style>
@import 'katex/dist/katex.min.css';

.markdown-body {
  line-height: 1.8;
  color: #333333;
}
.markdown-body h1, .markdown-body h2, .markdown-body h3 {
  font-weight: 700;
  margin-top: 1.5em;
  margin-bottom: 0.5em;
}
.markdown-body h1 { font-size: 1.75rem; }
.markdown-body h2 { font-size: 1.4rem; }
.markdown-body h3 { font-size: 1.15rem; }
.markdown-body p { margin-bottom: 0.75em; }
.markdown-body ul, .markdown-body ol {
  padding-left: 1.5em;
  margin-bottom: 0.75em;
}
.markdown-body li { margin-bottom: 0.25em; }
.markdown-body blockquote {
  border-left: 3px solid #0068ef;
  padding-left: 1em;
  margin: 0.75em 0;
  color: #555;
}
.markdown-body code {
  background: #f3f4f6;
  padding: 0.15em 0.4em;
  border-radius: 3px;
  font-size: 0.9em;
}
.markdown-body pre {
  background: #f3f4f6;
  padding: 1em;
  border-radius: 6px;
  overflow-x: auto;
  margin-bottom: 0.75em;
}
.markdown-body pre code {
  background: none;
  padding: 0;
}
.markdown-body table {
  border-collapse: collapse;
  width: 100%;
  margin-bottom: 0.75em;
}
.markdown-body th, .markdown-body td {
  border: 1px solid #ddd;
  padding: 0.5em 0.75em;
  text-align: left;
}
.markdown-body th {
  background: #f3f4f6;
  font-weight: 600;
}
.markdown-body a {
  color: #0068ef;
  text-decoration: underline;
}
</style>
