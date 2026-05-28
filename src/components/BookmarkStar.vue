<template>
  <button
    @click="toggle"
    class="text-lg leading-none transition-colors hover:scale-110"
    :class="bookmarked ? 'text-yellow-500' : 'text-gray-300 hover:text-yellow-400'"
    :title="bookmarked ? '取消收藏' : '添加收藏'"
  >{{ bookmarked ? '★' : '☆' }}</button>
</template>

<script setup>
import { ref, watch } from 'vue'

const props = defineProps({
  targetType: { type: String, required: true },
  targetId: { type: Number, required: true }
})

const bookmarked = ref(false)

watch(() => props.targetId, async () => {
  await checkStatus()
}, { immediate: true })

async function checkStatus() {
  if (!window.electronAPI || !props.targetId) return
  const result = await window.electronAPI.checkBookmark(props.targetType, props.targetId)
  if (result.success) bookmarked.value = result.data
}

async function toggle() {
  if (!window.electronAPI) return
  if (bookmarked.value) {
    const result = await window.electronAPI.removeBookmark(props.targetType, props.targetId)
    if (result.success) bookmarked.value = false
  } else {
    const result = await window.electronAPI.addBookmark(props.targetType, props.targetId)
    if (result.success) bookmarked.value = true
  }
}
</script>
