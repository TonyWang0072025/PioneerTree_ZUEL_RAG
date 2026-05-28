<template>
  <SubjectLayout subject="数学" theme-color="#5d9b50">
    <div class="space-y-6">
      <h3 class="text-lg font-bold text-gray-800">逐步解析推导</h3>

      <!-- Problem selector -->
      <div class="flex flex-wrap gap-2">
        <button
          v-for="(p, i) in problems" :key="i"
          @click="selectProblem(i)"
          class="px-3 py-1.5 text-sm rounded-full border transition-colors"
          :class="currentIdx === i
            ? 'text-white border-transparent'
            : 'text-gray-500 border-gray-300 hover:border-gray-400'"
          :style="currentIdx === i ? { backgroundColor: '#5d9b50' } : {}"
        >题目 {{ i + 1 }}</button>
      </div>

      <!-- Problem display -->
      <div v-if="current" class="bg-white border border-gray-200 rounded-lg p-5">
        <h4 class="font-semibold text-gray-800 mb-3">{{ current.title }}</h4>
        <div class="text-sm text-gray-700 leading-relaxed mb-4" v-html="renderedProblem" />

        <!-- Offline: full solution -->
        <div v-if="current.solution" class="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
          <div class="text-xs text-green-600 font-medium mb-2">标准答案</div>
          <div class="text-sm text-gray-700" v-html="renderedSolution" />
        </div>

        <!-- AI mode -->
        <div class="border-t border-gray-100 pt-4">
          <div class="flex items-center gap-2 mb-3">
            <input
              v-model="aiQuestion"
              type="text"
              placeholder="向 AI 提问，如：请分步解释第二步的推导..."
              class="flex-1 text-sm px-3 py-1.5 border border-gray-200 rounded focus:outline-none focus:border-[#5d9b50]"
              @keydown.enter="askAI"
            />
            <button
              @click="askAI"
              :disabled="aiLoading"
              class="px-4 py-1.5 text-xs font-medium text-white rounded transition-colors shrink-0"
              style="background-color: #5d9b50"
            >{{ aiLoading ? '思考中...' : '向 AI 请教' }}</button>
          </div>

          <!-- AI response -->
          <div v-if="aiSteps.length > 0" class="space-y-3">
            <div
              v-for="(step, si) in aiSteps"
              :key="si"
              class="bg-blue-50 border border-blue-100 rounded-lg p-4"
            >
              <div class="text-xs text-blue-500 font-medium mb-2">
                {{ step.role === 'user' ? '你的提问' : 'AI 解答' }}
              </div>
              <div class="text-sm text-gray-700 leading-relaxed" v-html="renderMath(step.content)" />
            </div>
          </div>

          <!-- Offline fallback hint -->
          <div v-if="aiOffline" class="mt-3 text-xs text-gray-400">
            AI 服务不可用，以上为标准答案。配置 API Key 后可获得逐步解析。
          </div>
        </div>
      </div>
    </div>
  </SubjectLayout>
</template>

<script setup>
import { ref, computed } from 'vue'
import { marked } from 'marked'
import katex from 'katex'
import SubjectLayout from '../components/SubjectLayout.vue'

marked.setOptions({ breaks: true, gfm: true })

const problems = [
  {
    title: '求极限',
    problem: '求下列极限：\n\n$$\\lim_{x \\to 0} \\frac{\\sin x}{x}$$\n\n并说明推导过程。',
    solution: '### 解法\n\n由 **重要极限** 可知：\n\n$$\\lim_{x \\to 0} \\frac{\\sin x}{x} = 1$$\n\n**推导思路**：\n1. 利用夹逼定理（Squeeze Theorem）\n2. 几何上，在单位圆中，$\\sin x \\leq x \\leq \\tan x$\n3. 两边同除 $\\sin x$ 取倒数，得 $\\cos x \\leq \\frac{\\sin x}{x} \\leq 1$\n4. 当 $x \\to 0$ 时，$\\cos x \\to 1$，由夹逼定理，极限为 1。'
  },
  {
    title: '求导数',
    problem: '求函数 $f(x) = x^3 - 3x^2 + 2x - 1$ 的导数 $f\'(x)$，并求其在 $x = 1$ 处的切线方程。',
    solution: '### 解法\n\n**第一步：求导**\n\n$$f\'(x) = 3x^2 - 6x + 2$$\n\n**第二步：求 $x=1$ 处的值**\n\n$$f(1) = 1 - 3 + 2 - 1 = -1$$\n\n$$f\'(1) = 3 - 6 + 2 = -1$$\n\n**第三步：切线方程**\n\n切线方程：$y - f(1) = f\'(1)(x - 1)$\n\n代入得：$y + 1 = -1(x - 1)$\n\n即：$y = -x$'
  },
  {
    title: '定积分计算',
    problem: '计算定积分：\n\n$$\\int_{0}^{1} x^2 \\, dx$$\n\n并解释定积分的几何意义。',
    solution: '### 解法\n\n**第一步：求原函数**\n\n$$F(x) = \\frac{x^3}{3} + C$$\n\n**第二步：代入上下限**\n\n$$\\int_{0}^{1} x^2 \\, dx = F(1) - F(0) = \\frac{1}{3} - 0 = \\frac{1}{3}$$\n\n**几何意义**：该定积分表示曲线 $y = x^2$ 在区间 $[0, 1]$ 上与 $x$ 轴围成的面积。'
  }
]

const currentIdx = ref(0)
const aiQuestion = ref('')
const aiLoading = ref(false)
const aiSteps = ref([])
const aiOffline = ref(false)

const current = computed(() => problems[currentIdx.value] || null)

const renderedProblem = computed(() => renderMath(current.value?.problem || ''))
const renderedSolution = computed(() => renderMath(current.value?.solution || ''))

function renderMath(text) {
  if (!text) return ''
  let result = text.replace(/\$\$([\s\S]*?)\$\$/g, (_m, f) => {
    try { return katex.renderToString(f.trim(), { displayMode: true, throwOnError: false }) }
    catch { return `<pre>${f}</pre>` }
  })
  result = result.replace(/(?<!\$)\$(?!\$)([\s\S]*?)(?<!\$)\$(?!\$)/g, (_m, f) => {
    try { return katex.renderToString(f.trim(), { displayMode: false, throwOnError: false }) }
    catch { return `<code>${f}</code>` }
  })
  return marked.parse(result)
}

function selectProblem(i) {
  currentIdx.value = i
  aiSteps.value = []
  aiOffline.value = false
  aiQuestion.value = ''
}

async function askAI() {
  const question = aiQuestion.value.trim()
  if (!question || !current.value) return

  aiLoading.value = true
  aiSteps.value.push({ role: 'user', content: question })
  aiQuestion.value = ''

  if (window.electronAPI) {
    const result = await window.electronAPI.callDeepSeek([
      {
        role: 'system',
        content: `你是数学辅导老师。题目：${current.value.problem}\n标准答案：${current.value.solution}\n请用分步推导的方式回答学生的问题，每个步骤用 markdown 格式，数学公式用 $...$ (行内) 和 $$...$$ (块级) LaTeX 语法。保持简洁，每步解释清楚。`
      },
      { role: 'user', content: question }
    ])
    if (!result.offline && result.content) {
      aiSteps.value.push({ role: 'assistant', content: result.content })
    } else {
      aiOffline.value = true
    }
  }

  aiLoading.value = false
}
</script>
