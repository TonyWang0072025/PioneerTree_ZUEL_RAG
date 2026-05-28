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

      <!-- Mode 1: Auto-Cloze -->
      <div v-if="currentMode === 'cloze'">
        <h3 class="text-lg font-bold text-gray-800 mb-3">自动挖空练习</h3>
        <div class="bg-gray-50 rounded-lg p-4 mb-4 text-sm text-gray-500">
          提示：将法条中的关键词用 <code class="bg-gray-200 px-1 rounded">**关键词**</code> 包裹，系统自动生成填空。
        </div>

        <!-- Editable source area -->
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

        <!-- Rendered cloze cards -->
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
          <!-- Left: Original text -->
          <div class="flex-1">
            <div class="text-xs text-gray-400 mb-1">原文</div>
            <textarea
              v-model="alignSource"
              class="w-full h-64 text-sm p-3 border border-gray-200 rounded font-mono focus:outline-none"
              placeholder="法条原文..."
            />
          </div>
          <!-- Right: User recitation -->
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

        <!-- Alignment result -->
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
  </SubjectLayout>
</template>

<script setup>
import { ref, reactive } from 'vue'
import SubjectLayout from '../components/SubjectLayout.vue'

const modes = [
  { key: 'cloze', label: '自动挖空' },
  { key: 'align', label: '背书对齐' }
]
const currentMode = ref('cloze')

// ---- Auto-Cloze ----
const clozeSource = ref('')
const clozeItems = ref([])

function generateCloze() {
  const raw = clozeSource.value.trim()
  if (!raw) return

  // Split by paragraphs/lines
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
      // Compare ignoring case and whitespace
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
    // Simple comparison ignoring punctuation and spaces
    const normalize = s => s.replace(/[\s，。、；：""''！？（）,《》.\-]/g, '')
    result.push({
      user,
      expected: user ? '' : expected,
      match: normalize(user) === normalize(expected)
    })
  }

  alignResult.value = result
}
</script>
