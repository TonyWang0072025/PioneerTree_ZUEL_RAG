<template>
  <div class="h-full flex flex-col">
    <!-- Top Search Bar -->
    <div class="h-12 flex items-center gap-3 px-4 border-b border-gray-200 bg-white shrink-0">
      <svg class="w-4 h-4 text-gray-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
      </svg>
      <input
        v-model="searchQuery"
        @input="onSearchInput"
        type="text"
        placeholder="搜索文档内容（支持全文检索）..."
        class="flex-1 text-sm outline-none"
      />
      <select v-model="subjectFilter" @change="doSearch" class="text-xs border border-gray-200 rounded px-2 py-1 text-gray-600">
        <option value="">全部学科</option>
        <option value="法学">法学</option>
        <option value="数学">数学</option>
        <option value="经管">经管</option>
      </select>
      <span v-if="results.length > 0" class="text-xs text-gray-400">{{ results.length }} 条结果</span>
    </div>

    <!-- Body: 30/70 split -->
    <div class="flex-1 flex overflow-hidden">
      <!-- Left: Results list (30%) -->
      <div class="w-[30%] min-w-[240px] border-r border-gray-200 overflow-y-auto bg-white">
        <div v-if="results.length === 0 && hasSearched" class="p-6 text-center text-sm text-gray-400">
          未找到匹配文档
        </div>
        <div v-if="!hasSearched" class="p-6 text-center text-sm text-gray-400">
          输入关键词开始检索
        </div>
        <button
          v-for="doc in results"
          :key="doc.id"
          @click="selectDoc(doc)"
          class="w-full text-left px-4 py-3 border-b border-gray-50 hover:bg-gray-50 transition-colors relative"
          :class="{ 'bg-blue-50 border-l-2 border-l-[#0068ef]': selectedDoc?.id === doc.id }"
        >
          <div class="flex items-start justify-between">
            <div class="flex-1 min-w-0">
              <div class="text-sm font-medium text-gray-800 truncate">{{ doc.filename }}</div>
              <div class="flex items-center gap-2 mt-1">
                <span class="text-xs px-1.5 py-0.5 rounded" :style="{ background: subjectColor(doc.subject), color: '#fff' }">
                  {{ doc.subject }}
                </span>
                <span class="text-xs text-gray-400">{{ doc.path }}</span>
              </div>
            </div>
            <BookmarkStar target-type="document" :target-id="doc.id" @click.stop />
          </div>
          <div v-if="doc.snippet" class="text-xs text-gray-500 mt-1.5 leading-relaxed" v-html="doc.snippet" />
        </button>
      </div>

      <!-- Right: Preview area (70%) -->
      <div class="flex-1 overflow-y-auto bg-gray-50">
        <!-- No selection placeholder -->
        <div v-if="!selectedDoc" class="flex items-center justify-center h-full text-gray-400 text-sm">
          选择左侧文档以预览
        </div>

        <!-- Loading -->
        <div v-else-if="previewLoading" class="flex items-center justify-center h-full text-gray-400 text-sm">
          加载中...
        </div>

        <!-- Error -->
        <div v-else-if="previewError" class="flex flex-col items-center justify-center h-full gap-3">
          <p class="text-sm text-red-500">{{ previewError }}</p>
          <button
            v-if="selectedDoc"
            @click="openExternally"
            class="px-3 py-1.5 text-xs text-[#0068ef] border border-[#0068ef] rounded hover:bg-blue-50"
          >
            在文件管理器中显示
          </button>
        </div>

        <!-- PDF preview -->
        <div v-else-if="fileType === 'pdf'" class="p-4 flex flex-col items-center">
          <canvas v-for="page in pdfPages" :key="page" :ref="el => setCanvasRef(page, el)" class="mb-3 shadow-md max-w-full" />
        </div>

        <!-- DOCX preview -->
        <div v-else-if="fileType === 'docx'" class="p-6 max-w-[900px] mx-auto bg-white min-h-full">
          <div v-html="docxHtml" class="prose text-sm leading-relaxed" />
        </div>

        <!-- Markdown preview -->
        <div v-else-if="fileType === 'md'" class="p-6 max-w-[900px] mx-auto bg-white min-h-full">
          <MarkdownRenderer :markdown="mdContent" :subject="selectedDoc?.subject" />
        </div>

        <!-- Plain text -->
        <div v-else class="p-6 max-w-[900px] mx-auto bg-white min-h-full">
          <pre class="text-sm whitespace-pre-wrap font-mono">{{ txtContent }}</pre>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, nextTick } from 'vue'
import MarkdownRenderer from '../components/MarkdownRenderer.vue'
import BookmarkStar from '../components/BookmarkStar.vue'

const searchQuery = ref('')
const subjectFilter = ref('')
const results = ref([])
const hasSearched = ref(false)
const selectedDoc = ref(null)
const previewLoading = ref(false)
const previewError = ref('')
const fileType = ref('')
const docxHtml = ref('')
const mdContent = ref('')
const txtContent = ref('')
const pdfPages = ref(0)
let searchTimer = null
let pdfDoc = null
const canvasRefs = {}

function setCanvasRef(page, el) {
  if (el) canvasRefs[page] = el
}

function subjectColor(subject) {
  const map = { '法学': '#012d6a', '数学': '#5d9b50', '经管': '#e42312' }
  return map[subject] || '#666'
}

function onSearchInput() {
  if (searchTimer) clearTimeout(searchTimer)
  searchTimer = setTimeout(doSearch, 250)
}

async function doSearch() {
  const q = searchQuery.value.trim()
  if (!q) { results.value = []; hasSearched.value = false; return }
  hasSearched.value = true

  if (window.electronAPI) {
    const result = await window.electronAPI.searchDocuments(
      q,
      subjectFilter.value || null
    )
    if (result.success) results.value = result.data
    else results.value = []
  }
}

async function selectDoc(doc) {
  selectedDoc.value = doc
  previewLoading.value = true
  previewError.value = ''
  pdfPages.value = 0
  pdfDoc = null

  const ext = doc.filename.split('.').pop().toLowerCase()
  fileType.value = ext

  if (!window.electronAPI) {
    previewError.value = '仅支持在桌面应用中预览'
    previewLoading.value = false
    return
  }

  try {
    const result = await window.electronAPI.getDocumentContent(doc.id)
    if (!result.success) {
      previewError.value = result.error || '无法加载文档'
      previewLoading.value = false
      return
    }

    const content = result.data.content || ''
    switch (ext) {
      case 'md':
        mdContent.value = content
        break
      case 'txt':
        txtContent.value = content
        break
      case 'docx':
        await renderDocx(doc.path)
        break
      case 'pdf':
        await renderPdf(doc.path)
        break
      default:
        txtContent.value = content
    }
  } catch (e) {
    previewError.value = '预览失败: ' + e.message
  }
  previewLoading.value = false
}

// ---- PDF Rendering ----
async function renderPdf(docPath) {
  const pdfjsLib = await import('pdfjs-dist')
  pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdfjs/build/pdf.worker.min.mjs'

  // Load PDF via IPC (returns base64 or buffer)
  const fs = await window.electronAPI.getDocumentFile(docPath)
  if (!fs?.success) {
    previewError.value = '无法读取 PDF 文件'
    return
  }

  const data = Uint8Array.from(atob(fs.data), c => c.charCodeAt(0))
  pdfDoc = await pdfjsLib.getDocument({ data }).promise
  pdfPages.value = pdfDoc.numPages

  await nextTick()

  for (let i = 1; i <= pdfDoc.numPages; i++) {
    const page = await pdfDoc.getPage(i)
    const canvas = canvasRefs[i]
    if (!canvas) continue
    const viewport = page.getViewport({ scale: 1.5 })
    canvas.height = viewport.height
    canvas.width = viewport.width
    const ctx = canvas.getContext('2d')
    await page.render({ canvasContext: ctx, viewport }).promise
  }
}

// ---- DOCX Rendering ----
async function renderDocx(docPath) {
  const result = await window.electronAPI.getDocumentFile(docPath)
  if (!result?.success) {
    previewError.value = '无法读取 DOCX 文件'
    return
  }
  const mammoth = await import('mammoth')
  const arrayBuffer = Uint8Array.from(atob(result.data), c => c.charCodeAt(0)).buffer
  const convertResult = await mammoth.convertToHtml({ arrayBuffer })
  docxHtml.value = convertResult.value
}

// ---- External ----
function openExternally() {
  if (selectedDoc.value && window.electronAPI) {
    window.electronAPI.showItemInFolder(selectedDoc.value.path)
  }
}
</script>
