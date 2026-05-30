<template>
  <SubjectLayout subject="法学" theme-color="#012d6a">
    <div class="space-y-6">
      <!-- Mode Switcher -->
      <div class="flex gap-2">
        <button
          v-for="m in modes" :key="m.key"
          @click="currentMode = m.key"
          class="px-4 py-1.5 text-sm rounded-full border transition-colors"
          :class="currentMode === m.key
            ? 'text-white border-transparent'
            : 'text-gray-500 border-gray-300 hover:border-gray-400'"
          :style="currentMode === m.key ? { backgroundColor: '#012d6a' } : {}"
        >{{ m.label }}</button>
      </div>

      <!-- Modes: Cloze + Align -->
      <div v-if="currentMode !== 'lawstudent'">
        <!-- Mode 1: Auto-Cloze -->
        <div v-if="currentMode === 'cloze'">
          <h3 class="text-lg font-bold text-gray-800 mb-3">自动挖空练习</h3>
          <div class="bg-gray-50 rounded-lg p-4 mb-4 text-sm text-gray-500">
            提示：将法条中的关键词用 <code class="bg-gray-200 px-1 rounded">**关键词**</code> 包裹，系统自动生成填空。
          </div>

          <textarea
            v-model="clozeSource"
            class="w-full h-40 text-sm font-mono p-3 border border-gray-200 rounded focus:outline-none focus:border-[#012d6a] mb-4"
            placeholder="在此输入法条文本，使用 **关键词** 标记需要挖空的内容..."
          />

          <button
            @click="generateCloze"
            class="px-4 py-1.5 text-sm font-medium text-white rounded mb-6"
            style="background-color: #012d6a"
          >生成挖空</button>

          <div v-if="clozeItems.length > 0" class="space-y-4">
            <div
              v-for="(item, idx) in clozeItems"
              :key="idx"
              class="bg-white border border-gray-200 rounded-lg p-4"
            >
              <div class="text-sm text-gray-800 leading-loose">
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
              </div>
              <div class="mt-2 text-xs text-gray-400">
                {{ item.answered }} / {{ item.total }} 已填 · 正确 {{ item.correct }}/{{ item.total }}
              </div>
            </div>
          </div>
        </div>

        <!-- Mode 2: Recitation Alignment -->
        <div v-if="currentMode === 'align'">
          <h3 class="text-lg font-bold text-gray-800 mb-3">背书对齐</h3>
          <div class="flex gap-4">
            <div class="flex-1">
              <div class="text-xs text-gray-400 mb-1">原文</div>
              <textarea
                v-model="alignSource"
                class="w-full h-64 text-sm p-3 border border-gray-200 rounded font-mono focus:outline-none"
                placeholder="法条原文..."
              />
            </div>
            <div class="flex-1">
              <div class="text-xs text-gray-400 mb-1">你的背诵</div>
              <textarea
                v-model="alignUser"
                @input="compareAlign"
                class="w-full h-64 text-sm p-3 border border-gray-200 rounded font-mono focus:outline-none"
                placeholder="在此默写..."
              />
            </div>
          </div>

          <div v-if="alignResult.length > 0" class="mt-4 p-4 bg-white border border-gray-200 rounded">
            <div class="text-xs text-gray-400 mb-2">逐句对比结果</div>
            <div v-for="(line, i) in alignResult" :key="i" class="flex items-start gap-2 py-1 text-sm font-mono">
              <span class="shrink-0 w-5 text-xs text-gray-400">{{ i + 1 }}</span>
              <span :class="line.match ? 'text-green-700 bg-green-50' : 'text-red-600 bg-red-50'" class="flex-1 px-2 py-0.5 rounded">
                {{ line.user || '(空)' }}
              </span>
              <span v-if="!line.match" class="shrink-0 text-xs text-gray-500">{{ line.expected }}</span>
            </div>
          </div>
        </div>

        <!-- Sample content for demo -->
        <div class="mt-4 p-3 bg-blue-50 rounded text-xs text-gray-600">
          <strong>示例内容：</strong>《民法典》第一条 为了保护<strong>**民事主体**</strong>的合法权益，调整<strong>**民事关系**</strong>，维护社会和经济秩序，适应中国特色社会主义发展要求，弘扬社会主义核心价值观，根据宪法，制定本法。
        </div>
      </div>

      <!-- Mode 3: Law-Student! -->
      <div v-else class="space-y-4">
        <!-- Search bar -->
        <div class="flex gap-2">
          <input
            v-model="lsSearchQuery"
            @keydown.enter="doLawSearch"
            type="text"
            class="flex-1 px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:border-[#012d6a]"
            placeholder="搜索本地法学文献作为上下文..."
          />
          <button
            @click="doLawSearch"
            :disabled="lsSearching"
            class="px-4 py-2 text-sm font-medium text-white rounded"
            style="background-color: #012d6a"
          >{{ lsSearching ? '搜索中...' : '搜索' }}</button>
        </div>

        <!-- Search results -->
        <div v-if="lsSearchResults.length > 0" class="border border-gray-200 rounded divide-y max-h-48 overflow-y-auto">
          <div
            v-for="doc in lsSearchResults" :key="doc.id || doc.doc_id"
            @click="loadDocument(doc)"
            class="px-3 py-2 text-sm cursor-pointer hover:bg-gray-50 transition-colors"
          >
            <div class="font-medium text-gray-800 truncate">{{ doc.title || doc.file_name || '未命名文档' }}</div>
            <div class="text-xs text-gray-400 mt-0.5 line-clamp-2" v-html="doc.snippet || doc.content?.slice(0, 120)"></div>
          </div>
        </div>

        <!-- Context text area (editable) -->
        <div>
          <div class="text-xs text-gray-400 mb-1">
            上下文内容（可直接粘贴或编辑）—
            <span :class="lsContextText.trim() ? 'text-green-600' : 'text-gray-400'">
              {{ lsContextText.trim() ? '已加载 ' + lsContextText.length + ' 字' : '待输入' }}
            </span>
          </div>
          <textarea
            v-model="lsContextText"
            class="w-full h-44 text-sm font-mono p-3 border border-gray-200 rounded focus:outline-none focus:border-[#012d6a]"
            placeholder="在此粘贴或编辑法条/案例文本，作为 AI 功能的上下文..."
          />
        </div>

        <!-- 4 Function Cards -->
        <div class="grid grid-cols-2 gap-3">
          <button
            v-for="sk in lawSkills" :key="sk.key"
            @click="runSkill(sk.key)"
            :disabled="lsLoading"
            class="text-left p-4 rounded-lg border-2 transition-all hover:shadow-md"
            :class="lsLoading && lsActiveSkill === sk.key
              ? 'border-[#012d6a] bg-blue-50 opacity-70'
              : 'border-gray-200 hover:border-[#012d6a] bg-white'"
          >
            <div class="flex items-center gap-2 mb-1">
              <span class="text-lg">{{ sk.icon }}</span>
              <span class="text-sm font-bold" style="color: #012d6a">{{ sk.title }}</span>
              <span v-if="lsLoading && lsActiveSkill === sk.key" class="ml-auto text-xs text-blue-500 animate-pulse">处理中...</span>
            </div>
            <div class="text-xs text-gray-500">{{ sk.desc }}</div>
            <div class="text-xs text-gray-400 mt-0.5">{{ sk.desc2 }}</div>
          </button>
        </div>

        <!-- Error message -->
        <div v-if="lsError" class="p-3 bg-red-50 border border-red-200 rounded text-sm text-red-700">
          {{ lsError }}
        </div>
      </div>
    </div>

    <!-- Override right panel for law-student mode: AI response -->
    <template v-if="currentMode === 'lawstudent'" #notebook>
      <div class="flex flex-col h-full">
        <div class="px-4 py-3 border-b border-gray-200 bg-white">
          <h3 class="text-sm font-semibold" style="color: #012d6a">AI 法学导师</h3>
        </div>
        <div class="flex-1 overflow-y-auto p-4">
          <!-- Loading placeholder -->
          <div v-if="lsLoading" class="flex items-center justify-center h-full">
            <div class="text-center">
              <div class="animate-spin w-8 h-8 border-2 border-[#012d6a] border-t-transparent rounded-full mx-auto mb-2" />
              <div class="text-sm text-gray-400">AI 正在分析...</div>
            </div>
          </div>

          <!-- Empty state -->
          <div v-else-if="!lsResponse && !lsError" class="flex items-center justify-center h-full">
            <div class="text-center text-gray-400">
              <div class="text-3xl mb-2">📚</div>
              <div class="text-sm">选择一个功能开始</div>
              <div class="text-xs mt-1">AI 分析结果将在此处显示</div>
            </div>
          </div>

          <!-- AI response -->
          <MarkdownRenderer v-else :source="lsResponse" subject="法学" />
        </div>
      </div>
    </template>
  </SubjectLayout>
</template>

<script setup>
import { ref, reactive } from 'vue'
import SubjectLayout from '../components/SubjectLayout.vue'
import { coldCallPrep, examForecast, legalWritingFeedback, generateFlashcards } from '../services/LawStudentService.js'
import MarkdownRenderer from '../components/MarkdownRenderer.vue'

const modes = [
  { key: 'cloze', label: '自动挖空' },
  { key: 'align', label: '背书对齐' },
  { key: 'lawstudent', label: 'Law-Student！' }
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
