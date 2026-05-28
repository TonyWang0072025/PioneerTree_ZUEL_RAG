<template>
  <div class="markdown-body prose max-w-none" v-html="renderedHtml"></div>
</template>

<script setup>
import { computed } from 'vue'
import { marked } from 'marked'
import katex from 'katex'

const props = defineProps({
  markdown: { type: String, default: '' }
})

// Configure marked for safe rendering
marked.setOptions({
  breaks: true,
  gfm: true
})

/**
 * Render math expressions with KaTeX.
 * Handles $...$ (inline) and $$...$$ (block display).
 */
function renderMath(text) {
  // Process block math first ($$...$$)
  let result = text.replace(/\$\$([\s\S]*?)\$\$/g, (_match, formula) => {
    try {
      return katex.renderToString(formula.trim(), {
        displayMode: true,
        throwOnError: false
      })
    } catch {
      return `<pre>${formula}</pre>`
    }
  })

  // Then inline math ($...$), but not double $
  result = result.replace(/(?<!\$)\$(?!\$)([\s\S]*?)(?<!\$)\$(?!\$)/g, (_match, formula) => {
    try {
      return katex.renderToString(formula.trim(), {
        displayMode: false,
        throwOnError: false
      })
    } catch {
      return `<code>${formula}</code>`
    }
  })

  return result
}

const renderedHtml = computed(() => {
  if (!props.markdown) return ''
  // First pass: render math, then pass through marked for markdown
  // Math blocks use raw HTML that marked will preserve
  const withMath = renderMath(props.markdown)
  return marked.parse(withMath)
})
</script>

<style>
/* KaTeX requires its CSS; import once at component level */
@import 'katex/dist/katex.min.css';

/* Minimal prose baseline (Tailwind v4 prose not yet configured) */
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
