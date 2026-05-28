<template>
  <div class="space-y-4">
    <!-- Controls -->
    <div class="flex items-center gap-3">
      <select
        v-model="subject"
        class="text-sm border border-gray-200 rounded px-3 py-1.5 text-gray-700"
      >
        <option value="">选择学科</option>
        <option value="法学">法学</option>
        <option value="数学">数学</option>
        <option value="经管">经管</option>
      </select>
      <button
        @click="loadQuiz"
        :disabled="!subject || loading"
        class="px-4 py-1.5 text-sm font-medium text-white rounded transition-colors"
        style="background-color: #0068ef"
      >{{ loading ? '抽取中...' : '随机抽题' }}</button>
      <span v-if="questions.length > 0" class="text-xs text-gray-400">
        共 {{ questions.length }} 题
      </span>
    </div>

    <!-- Empty state -->
    <div v-if="!hasLoaded" class="text-center text-gray-400 text-sm py-8">
      选择学科并点击"随机抽题"开始练习
    </div>
    <div v-else-if="questions.length === 0" class="text-center text-gray-400 text-sm py-8">
      该学科暂无题目，请在 question_bank 中添加
    </div>

    <!-- Question cards -->
    <div class="space-y-4">
      <div
        v-for="(q, qi) in questions"
        :key="qi"
        class="bg-white border border-gray-200 rounded-lg overflow-hidden"
      >
        <!-- Card header -->
        <div class="flex items-center justify-between px-4 py-2.5 bg-gray-50 border-b border-gray-100">
          <span class="text-xs font-medium text-gray-500">第 {{ qi + 1 }} 题</span>
          <BookmarkStar target-type="question" :target-id="q.id" />
        </div>

        <!-- Card body -->
        <div class="p-4">
          <div class="text-sm text-gray-800 leading-relaxed mb-3">
            {{ q.question_text }}
          </div>

          <!-- Answer reveal -->
          <div v-if="q.showAnswer" class="bg-green-50 border border-green-100 rounded p-3 mt-3">
            <div class="text-xs text-green-600 font-medium mb-1">参考答案</div>
            <div class="text-sm text-gray-700">{{ q.answer_content }}</div>
          </div>

          <button
            v-else
            @click="q.showAnswer = true"
            class="text-xs text-[#0068ef] hover:underline mt-2"
          >显示答案</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import BookmarkStar from './BookmarkStar.vue'

const subject = ref('')
const loading = ref(false)
const hasLoaded = ref(false)
const questions = ref([])

async function loadQuiz() {
  if (!subject.value || !window.electronAPI) return
  loading.value = true
  hasLoaded.value = true

  const result = await window.electronAPI.getRandomQuestions(subject.value, 20)
  if (result.success) {
    questions.value = result.data.map(q => ({ ...q, showAnswer: false }))
  } else {
    questions.value = []
  }
}
</script>
