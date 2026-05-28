<template>
  <SubjectLayout subject="经管" theme-color="#e42312">
    <div class="space-y-6">
      <h3 class="text-lg font-bold text-gray-800">踩点核对练习</h3>

      <!-- Question card -->
      <div
        v-for="(q, qi) in questions"
        :key="qi"
        class="bg-white border border-gray-200 rounded-lg p-5"
      >
        <div class="flex items-start gap-3 mb-4">
          <span class="shrink-0 w-6 h-6 flex items-center justify-center rounded-full text-white text-xs font-bold" style="background-color: #e42312">{{ qi + 1 }}</span>
          <div>
            <h4 class="font-semibold text-gray-800">{{ q.title }}</h4>
            <p class="text-sm text-gray-600 mt-1">{{ q.question }}</p>
          </div>
        </div>

        <!-- Answer input -->
        <textarea
          v-model="q.userAnswer"
          class="w-full h-32 text-sm p-3 border border-gray-200 rounded focus:outline-none focus:border-[#e42312] mb-3"
          placeholder="在此输入你的答案，尽可能覆盖关键概念..."
        />

        <button
          @click="checkAnswer(qi)"
          class="px-4 py-1.5 text-xs font-medium text-white rounded"
          style="background-color: #e42312"
        >提交核对</button>

        <!-- Results -->
        <div v-if="q.result !== null" class="mt-4 pt-4 border-t border-gray-100">
          <!-- Score -->
          <div class="text-sm font-medium mb-3">
            踩点得分：
            <span class="text-lg font-bold" :class="q.result.score === q.result.total ? 'text-green-600' : 'text-red-500'">
              {{ q.result.score }} / {{ q.result.total }}
            </span>
          </div>

          <!-- Hit points -->
          <div v-if="q.result.hits.length > 0" class="mb-2">
            <span class="text-xs text-green-600 font-medium">命中踩点词：</span>
            <span
              v-for="(pt, pi) in q.result.hits" :key="pi"
              class="inline-block ml-1.5 mb-1 px-2 py-0.5 text-xs rounded bg-green-50 text-green-700 border border-green-200"
            >{{ pt }}</span>
          </div>

          <!-- Missed points -->
          <div v-if="q.result.misses.length > 0">
            <span class="text-xs text-red-500 font-medium">缺失踩点词：</span>
            <span
              v-for="(pt, pi) in q.result.misses" :key="pi"
              class="inline-block ml-1.5 mb-1 px-2 py-0.5 text-xs rounded bg-red-50 text-red-600 border border-red-200"
            >{{ pt }}</span>
          </div>
        </div>
      </div>

      <div class="p-3 bg-orange-50 rounded text-xs text-gray-600">
        <strong>提示：</strong>系统将遍历你答案中的关键词，与预设的踩分点进行匹配（忽略大小写）。答案中涵盖的踩点词越多，得分越高。
      </div>
    </div>
  </SubjectLayout>
</template>

<script setup>
import { reactive } from 'vue'
import SubjectLayout from '../components/SubjectLayout.vue'

const questions = reactive([
  {
    title: '微观经济学 · 供需平衡',
    question: '请阐述需求定律的含义，并解释价格变动如何影响需求量。',
    key_points: ['需求定律', '价格上升需求下降', '需求曲线', '替代效应', '收入效应', '边际效用递减', '需求量', '负相关'],
    userAnswer: '',
    result: null
  },
  {
    title: '管理学 · 马斯洛需求层次',
    question: '请默写马斯洛需求层次理论的五个层次，并简要说明各层次的含义。',
    key_points: ['生理需求', '安全需求', '社交需求', '尊重需求', '自我实现', '层次递进', '激励理论', '底层优先'],
    userAnswer: '',
    result: null
  },
  {
    title: '宏观经济学 · GDP 核算',
    question: '请列出国内生产总值 (GDP) 的三种核算方法，并简述每种方法的核心思想。',
    key_points: ['生产法', '收入法', '支出法', '消费', '投资', '政府购买', '净出口', '增加值', '最终产品'],
    userAnswer: '',
    result: null
  }
])

function checkAnswer(qi) {
  const q = questions[qi]
  const answer = q.userAnswer.toLowerCase()

  const hits = []
  const misses = []

  for (const point of q.key_points) {
    if (answer.includes(point.toLowerCase())) {
      hits.push(point)
    } else {
      misses.push(point)
    }
  }

  q.result = {
    hits,
    misses,
    score: hits.length,
    total: q.key_points.length
  }
}
</script>
