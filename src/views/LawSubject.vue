<template>
  <SubjectLayout
    ref="layoutRef"
    subject="法学"
    theme-color="#1B4965"
    :show-ai-tab="currentMode === 'lawstudent'"
  >
    <div class="law-content">
      <!-- Page header -->
      <div class="page-header">
        <h1 class="page-title">法学学习</h1>
        <p class="page-desc">用 AI 辅助背诵法条 — 自动挖空关键词，强化记忆</p>
      </div>

      <!-- Mode Switcher -->
      <div class="mode-switcher">
        <button
          v-for="m in modes" :key="m.key"
          @click="currentMode = m.key"
          class="mode-btn"
          :class="{ active: currentMode === m.key }"
        >
          <span class="mode-icon">{{ m.icon }}</span>
          {{ m.label }}
        </button>
      </div>

      <!-- Modes: Cloze + Align -->
      <div v-if="currentMode !== 'lawstudent'">
        <!-- Mode 1: Auto-Cloze -->
        <div v-if="currentMode === 'cloze'">
          <div class="card">
            <div class="card-header">
              <div class="icon blue">📝</div>
              <div>
                <div class="card-title">输入法条文本</div>
                <div class="card-subtitle">标记关键词，系统自动生成填空</div>
              </div>
            </div>

            <div class="tip-box">
              <span class="tip-icon">💡</span>
              <span>将法条中的关键词用 <code>**关键词**</code> 包裹，系统自动生成挖空练习。</span>
            </div>

            <div class="textarea-wrap">
              <textarea
                v-model="clozeSource"
                placeholder="在此输入法条文本，使用 **关键词** 标记需要挖空的内容..."
              />
              <span class="char-count">{{ clozeSource.length }} 字</span>
            </div>

            <button @click="generateCloze" class="btn btn-primary">生成挖空</button>
          </div>

          <div v-if="clozeItems.length > 0" class="card">
            <div class="card-header">
              <div class="icon green">✓</div>
              <div>
                <div class="card-title">挖空练习</div>
                <div class="card-subtitle">输入答案后自动比对</div>
              </div>
            </div>
            <div v-for="(item, idx) in clozeItems" :key="idx" class="result-text mb-3">
              <template v-for="(seg, si) in item.segments" :key="si">
                <span v-if="seg.type === 'text'">{{ seg.value }}</span>
                <input
                  v-else
                  v-model="seg.userAnswer"
                  @input="checkClozeItem(idx)"
                  type="text"
                  class="inline px-2 py-0.5 border-b-2 rounded text-sm font-medium outline-none"
                  :class="seg.correct === true ? 'border-green-500 bg-green-50 text-green-800' : seg.correct === false ? 'border-red-400 bg-red-50 text-red-800' : 'border-gray-300 bg-yellow-50'"
                  :style="{ width: Math.max(seg.answer.length * 1.2 + 2, 4) + 'em' }"
                  :placeholder="'________'"
                />
              </template>
              <div class="mt-2 text-xs text-gray-400">
                {{ item.answered }} / {{ item.total }} 已填 · 正确 {{ item.correct }}/{{ item.total }}
              </div>
            </div>
          </div>

          <div class="card">
            <div class="card-header">
              <div class="icon orange">📖</div>
              <div>
                <div class="card-title">示例</div>
                <div class="card-subtitle">参考格式，快速开始</div>
              </div>
            </div>
            <div class="example-box">
              <span class="label">民法典 · 第一条</span><br>
              为了保护<span class="keyword">民事主体</span>的合法权益，调整<span class="keyword">民事关系</span>，维护社会和经济秩序，适应中国特色社会主义发展要求，弘扬社会主义核心价值观，根据宪法，制定本法。
            </div>
          </div>
        </div>

        <!-- Mode 2: Recitation Alignment -->
        <div v-if="currentMode === 'align'">
          <div class="card">
            <div class="card-header">
              <div class="icon blue">📋</div>
              <div>
                <div class="card-title">背书对齐</div>
                <div class="card-subtitle">逐句默写，核对与原文的偏差</div>
              </div>
            </div>
            <div class="tip-box">
              <span class="tip-icon">💡</span>
              <span>左侧粘贴法条原文，右侧逐句默写。系统自动逐句比对。</span>
            </div>
            <div class="flex gap-4 mb-4">
              <div class="flex-1">
                <div class="text-xs text-gray-400 mb-1">原文</div>
                <textarea
                  v-model="alignSource"
                  class="w-full h-64 text-sm p-3 border border-gray-200 rounded font-mono focus:outline-none focus:border-[#1B4965]"
                  placeholder="法条原文..."
                />
              </div>
              <div class="flex-1">
                <div class="text-xs text-gray-400 mb-1">你的背诵</div>
                <textarea
                  v-model="alignUser"
                  @input="compareAlign"
                  class="w-full h-64 text-sm p-3 border border-gray-200 rounded font-mono focus:outline-none focus:border-[#1B4965]"
                  placeholder="在此默写..."
                />
              </div>
            </div>
          </div>
          <div v-if="alignResult.length > 0" class="card">
            <div class="card-header">
              <div class="icon green">✓</div>
              <div>
                <div class="card-title">逐句对比结果</div>
                <div class="card-subtitle">绿色匹配，红色差异</div>
              </div>
            </div>
            <div v-for="(line, i) in alignResult" :key="i" class="flex items-start gap-2 py-1 text-sm font-mono">
              <span class="shrink-0 w-5 text-xs text-gray-400">{{ i + 1 }}</span>
              <span :class="line.match ? 'text-green-700 bg-green-50' : 'text-red-600 bg-red-50'" class="flex-1 px-2 py-0.5 rounded">
                {{ line.user || '(空)' }}
              </span>
              <span v-if="!line.match" class="shrink-0 text-xs text-gray-500">{{ line.expected }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Mode 3: Law-Student! -->
      <div v-else class="law-student-panel">
        <!-- Search bar -->
        <div class="flex gap-2 mb-4">
          <div class="search-box" style="max-width:100%">
            <span class="search-icon">🔍</span>
            <input
              v-model="lsSearchQuery"
              @keydown.enter="doLawSearch"
              type="text"
              placeholder="搜索本地法学文献作为上下文..."
            />
          </div>
          <button
            @click="doLawSearch"
            :disabled="lsSearching"
            class="btn btn-primary shrink-0"
          >{{ lsSearching ? '搜索中...' : '搜索' }}</button>
        </div>

        <!-- Search results -->
        <div v-if="lsSearchResults.length > 0" class="card" style="padding:0; overflow:hidden">
          <div
            v-for="doc in lsSearchResults" :key="doc.id || doc.doc_id"
            @click="loadDocument(doc)"
            class="px-4 py-3 text-sm cursor-pointer hover:bg-gray-50 transition-colors border-b border-gray-50 last:border-b-0"
          >
            <div class="font-medium text-gray-800 truncate">{{ doc.title || doc.file_name || '未命名文档' }}</div>
            <div class="text-xs text-gray-400 mt-0.5 line-clamp-2" v-html="doc.snippet || doc.content?.slice(0, 120)"></div>
          </div>
        </div>

        <!-- Context text area -->
        <div class="mb-4">
          <div class="flex justify-between items-center mb-1">
            <span class="text-xs text-gray-400">上下文内容（可直接粘贴或编辑）</span>
            <span class="text-xs" :class="lsContextText.trim() ? 'text-green-600' : 'text-gray-400'">
              {{ lsContextText.trim() ? '已加载 ' + lsContextText.length + ' 字' : '待输入' }}
            </span>
          </div>
          <div class="textarea-wrap">
            <textarea
              v-model="lsContextText"
              placeholder="在此粘贴或编辑法条/案例文本，作为 AI 功能的上下文..."
              style="min-height: 180px"
            />
          </div>
        </div>

        <!-- 4 Function Cards -->
        <div class="skill-grid">
          <button
            v-for="sk in lawSkills" :key="sk.key"
            @click="runSkill(sk.key)"
            :disabled="lsLoading"
            class="skill-card"
            :class="{ loading: lsLoading && lsActiveSkill === sk.key }"
          >
            <div class="flex items-center gap-2 mb-1">
              <span class="skill-icon">{{ sk.icon }}</span>
              <span class="skill-title">{{ sk.title }}</span>
              <span v-if="lsLoading && lsActiveSkill === sk.key" class="ml-auto text-xs text-blue-500 animate-pulse">处理中...</span>
            </div>
            <div class="skill-desc">{{ sk.desc }}</div>
            <div class="skill-desc2">{{ sk.desc2 }}</div>
          </button>
        </div>

        <!-- Error message -->
        <div v-if="lsError" class="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
          {{ lsError }}
        </div>
      </div>
    </div>

    <!-- AI Tutor tab content (shown in right panel when tabs are active) -->
    <template #ai-tutor>
      <div class="p-4">
        <!-- Loading -->
        <div v-if="lsLoading" class="flex items-center justify-center h-64">
          <div class="text-center">
            <div class="animate-spin w-8 h-8 border-2 border-[#1B4965] border-t-transparent rounded-full mx-auto mb-2" />
            <div class="text-sm text-gray-400">AI 正在分析...</div>
          </div>
        </div>

        <!-- Empty state -->
        <div v-else-if="!lsResponse && !lsError" class="flex items-center justify-center h-64">
          <div class="text-center text-gray-400">
            <div class="text-3xl mb-2">📚</div>
            <div class="text-sm">在左侧选择一个 AI 功能开始</div>
            <div class="text-xs mt-1">分析结果将在此处显示</div>
          </div>
        </div>

        <!-- AI response -->
        <MarkdownRenderer v-else :source="lsResponse" subject="法学" />
      </div>
    </template>
  </SubjectLayout>
</template>

<script setup>
import { ref, reactive } from 'vue'
import SubjectLayout from '../components/SubjectLayout.vue'
import { coldCallPrep, examForecast, legalWritingFeedback, generateFlashcards } from '../services/LawStudentService.js'
import MarkdownRenderer from '../components/MarkdownRenderer.vue'

const layoutRef = ref(null)

const modes = [
  { key: 'cloze', label: '自动挖空', icon: '✎' },
  { key: 'align', label: '背书对齐', icon: '✓' },
  { key: 'lawstudent', label: 'Law-Student！', icon: '⚡' }
]
const currentMode = ref('cloze')

// ---- Auto-Cloze ----
const clozeSource = ref('')
const clozeItems = ref([])

function generateCloze() {
  const raw = clozeSource.value.trim()
  if (!raw) return

  const paragraphs = raw.split(/\n+/).filter(p => p.trim())
  const items = paragraphs.map(para => {
    const segments = []
    const re = /\*\*(.+?)\*\*/g
    let lastIdx = 0
    let match
    let total = 0

    while ((match = re.exec(para)) !== null) {
      if (match.index > lastIdx) {
        segments.push({ type: 'text', value: para.slice(lastIdx, match.index) })
      }
      segments.push({
        type: 'blank',
        answer: match[1],
        userAnswer: '',
        correct: null
      })
      total++
      lastIdx = match.index + match[0].length
    }

    if (lastIdx < para.length) {
      segments.push({ type: 'text', value: para.slice(lastIdx) })
    }

    return { segments, total, answered: 0, correct: 0 }
  })

  clozeItems.value = items
}

function checkClozeItem(itemIdx) {
  const item = clozeItems.value[itemIdx]
  let answered = 0
  let correct = 0

  for (const seg of item.segments) {
    if (seg.type === 'blank') {
      if (seg.userAnswer.trim()) answered++
      const userNorm = seg.userAnswer.replace(/\s+/g, '').toLowerCase()
      const answerNorm = seg.answer.replace(/\s+/g, '').toLowerCase()
      seg.correct = userNorm ? userNorm === answerNorm : null
      if (seg.correct) correct++
    }
  }

  item.answered = answered
  item.correct = correct
}

// ---- Recitation Alignment ----
const alignSource = ref('')
const alignUser = ref('')
const alignResult = ref([])

function compareAlign() {
  const srcLines = alignSource.value.split('\n').filter(l => l.trim())
  const userLines = alignUser.value.split('\n').filter(l => l.trim())
  const result = []

  for (let i = 0; i < srcLines.length; i++) {
    const expected = srcLines[i].trim()
    const user = userLines[i]?.trim() || ''
    const normalize = s => s.replace(/[\s，。、；：""''！？（）,《》.\-]/g, '')
    result.push({
      user,
      expected: user ? '' : expected,
      match: normalize(user) === normalize(expected)
    })
  }

  alignResult.value = result
}

// ---- Law-Student Mode ----
const lsSearchQuery = ref('')
const lsSearchResults = ref([])
const lsSearching = ref(false)
const lsContextText = ref('')
const lsActiveSkill = ref('')
const lsLoading = ref(false)
const lsResponse = ref('')
const lsError = ref('')

const lawSkills = [
  { key: 'coldcall', title: '冷不防提问', desc: '苏格拉底式课堂提问训练', desc2: '预测问题 · 追问训练 · 不给答案', icon: '⚡' },
  { key: 'forecast', title: '考试预测', desc: '历年考题模式分析', desc2: '科目权重 · 题型预测 · 复习建议', icon: '📊' },
  { key: 'writing', title: '写作反馈', desc: '法律写作结构性反馈', desc2: '结构评估 · 分析深度 · 绝不代写', icon: '📝' },
  { key: 'flashcards', title: '记忆卡片', desc: '从材料生成记忆卡片', desc2: '一问一卡 · Leitner 分层 · 来源标注', icon: '🃏' }
]

async function doLawSearch() {
  const q = lsSearchQuery.value.trim()
  if (!q) { lsSearchResults.value = []; return }

  lsSearching.value = true
  lsSearchResults.value = []
  try {
    const res = await window.electronAPI.searchDocuments(q, '法学')
    lsSearchResults.value = res.success ? res.data : []
  } catch (e) {
    lsSearchResults.value = []
  } finally {
    lsSearching.value = false
  }
}

async function loadDocument(doc) {
  lsContextText.value = ''
  try {
    const res = await window.electronAPI.getDocumentContent(doc.id || doc.doc_id)
    lsContextText.value = res.success ? (res.data.content || res.data.snippet || '') : (doc.snippet || doc.content || '')
  } catch (e) {
    lsContextText.value = doc.snippet || doc.content || ''
  }
}

async function runSkill(skillKey) {
  if (!lsContextText.value.trim()) {
    lsError.value = '请先在左侧搜索并选择一份法学文献作为上下文。'
    return
  }
  lsActiveSkill.value = skillKey
  lsLoading.value = true
  lsError.value = ''
  lsResponse.value = ''

  // Auto-switch right panel to AI tutor tab
  layoutRef.value?.switchToAiTab()

  let result
  try {
    switch (skillKey) {
      case 'coldcall':
        result = await coldCallPrep(lsContextText.value)
        break
      case 'forecast':
        result = await examForecast(lsContextText.value)
        break
      case 'writing':
        result = await legalWritingFeedback(lsContextText.value)
        break
      case 'flashcards':
        result = await generateFlashcards(lsContextText.value)
        break
    }

    if (result.offline) {
      lsError.value = result.message || 'AI 服务不可用'
    } else {
      lsResponse.value = result.content || ''
    }
  } catch (e) {
    lsError.value = '请求失败：' + (e.message || '未知错误')
  } finally {
    lsLoading.value = false
  }
}
</script>
