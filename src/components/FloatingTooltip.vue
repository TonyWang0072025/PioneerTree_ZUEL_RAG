<template>
  <Teleport to="body">
    <div
      v-if="visible"
      class="fixed z-50 bg-white border border-gray-300 rounded-lg shadow-lg p-4 max-w-sm"
      :style="{ left: x + 'px', top: y + 'px' }"
      @click.stop
    >
      <!-- Header -->
      <div class="flex items-center justify-between mb-2">
        <span class="text-sm font-semibold text-gray-800">{{ keyword }}</span>
        <button @click="close" class="text-gray-400 hover:text-gray-600 text-lg leading-none">&times;</button>
      </div>

      <!-- Loading -->
      <div v-if="loading" class="text-xs text-gray-400 py-2">查询中...</div>

      <!-- Local results -->
      <div v-else>
        <div v-if="aiContent" class="text-xs text-gray-700 leading-relaxed mb-2 pb-2 border-b border-gray-100">
          <span class="text-[#0068ef] font-medium">AI 解释: </span>{{ aiContent }}
        </div>
        <div v-if="localChunks.length > 0" class="space-y-1.5">
          <div class="text-xs text-gray-400 font-medium">本地相关片段:</div>
          <div v-for="(chunk, i) in localChunks" :key="i" class="text-xs text-gray-600 leading-relaxed bg-gray-50 p-2 rounded">
            {{ chunk.content?.substring(0, 200) }}{{ chunk.content?.length > 200 ? '...' : '' }}
          </div>
        </div>
        <div v-if="localChunks.length === 0 && !aiContent" class="text-xs text-gray-400 py-2">
          未找到相关内容
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
import { ref } from 'vue'

const visible = ref(false)
const x = ref(0)
const y = ref(0)
const keyword = ref('')
const loading = ref(false)
const localChunks = ref([])
const aiContent = ref('')
let dismissTimer = null

function show(word, posX, posY) {
  keyword.value = word
  x.value = Math.min(posX, window.innerWidth - 340)
  y.value = posY + 16
  visible.value = true
  loading.value = true
  localChunks.value = []
  aiContent.value = ''
}

function setResults(chunks, aiText) {
  localChunks.value = chunks || []
  aiContent.value = aiText || ''
  loading.value = false
}

function close() {
  visible.value = false
  if (dismissTimer) clearTimeout(dismissTimer)
}

function autoDismiss(delay = 3000) {
  if (dismissTimer) clearTimeout(dismissTimer)
  dismissTimer = setTimeout(() => {
    visible.value = false
  }, delay)
}

defineExpose({ show, setResults, close, autoDismiss })
</script>
