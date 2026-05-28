<template>
  <div class="max-w-xl mx-auto p-8">
    <h2 class="text-2xl font-bold mb-6" style="color: #012d6a">设置</h2>

    <div class="bg-white border border-gray-200 rounded-lg p-6">
      <label class="block text-sm font-medium text-gray-700 mb-2">
        DeepSeek API Key
      </label>
      <div class="flex gap-2">
        <input
          v-model="apiKey"
          :type="showKey ? 'text' : 'password'"
          placeholder="sk-..."
          class="flex-1 px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:border-[#0068ef]"
        />
        <button
          @click="showKey = !showKey"
          class="px-3 py-2 text-sm text-gray-500 border border-gray-300 rounded hover:bg-gray-50"
        >
          {{ showKey ? '隐藏' : '显示' }}
        </button>
        <button
          @click="handleSave"
          :disabled="saving"
          class="px-5 py-2 text-sm font-medium text-white rounded transition-colors"
          style="background-color: #0068ef"
        >
          {{ saving ? '保存中...' : '保存' }}
        </button>
      </div>
      <p v-if="statusMsg" class="mt-3 text-sm" :class="statusOk ? 'text-green-600' : 'text-red-500'">
        {{ statusMsg }}
      </p>
      <p class="mt-3 text-xs text-gray-400">
        密钥仅存储在本地 SQLite 数据库中，不会上传至任何第三方服务器。DeepSeek API 调用通过主进程代理完成。
      </p>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'

const apiKey = ref('')
const showKey = ref(false)
const saving = ref(false)
const statusMsg = ref('')
const statusOk = ref(true)

onMounted(async () => {
  if (!window.electronAPI) return
  const result = await window.electronAPI.getApiKey()
  if (result.success) apiKey.value = result.data
})

async function handleSave() {
  if (!window.electronAPI) {
    statusMsg.value = '仅支持在桌面应用中配置'
    statusOk.value = false
    return
  }
  saving.value = true
  statusMsg.value = ''
  try {
    const result = await window.electronAPI.saveApiKey(apiKey.value.trim())
    statusOk.value = result.success
    statusMsg.value = result.success ? 'API Key 已保存' : (result.error || '保存失败')
  } catch (e) {
    statusOk.value = false
    statusMsg.value = e.message
  } finally {
    saving.value = false
  }
}
</script>
