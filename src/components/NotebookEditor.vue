<template>
  <div class="flex flex-col h-full">
    <!-- Toolbar area: title input + save button -->
    <div class="flex items-center gap-2 px-3 py-2 border-b border-gray-200 bg-white">
      <input
        v-model="noteTitle"
        type="text"
        placeholder="笔记标题..."
        class="flex-1 text-sm px-2 py-1 border border-gray-200 rounded focus:outline-none focus:border-[#0068ef]"
      />
      <button
        @click="handleSave"
        class="shrink-0 px-3 py-1 text-xs font-medium text-white rounded transition-colors"
        style="background-color: #0068ef"
      >
        保存
      </button>
    </div>

    <!-- Vditor editor container -->
    <div ref="vditorRef" class="flex-1 overflow-hidden" />
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue'
import Vditor from 'vditor'
import 'vditor/dist/index.css'

const noteTitle = ref('')
const vditorRef = ref(null)
let vditorInstance = null

onMounted(() => {
  if (!vditorRef.value) return

  vditorInstance = new Vditor(vditorRef.value, {
    height: '100%',
    mode: 'wysiwyg',
    cdn: '/vditor',
    cache: false,
    placeholder: '边搜边记...',
    toolbar: [
      'headings',
      'bold',
      'italic',
      '|',
      'list',
      'ordered-list',
      'checklist',
      '|',
      'quote',
      'code',
      'inline-code',
      '|',
      'formula',
      '|',
      'undo',
      'redo'
    ],
    toolbarConfig: {
      hide: false
    },
    counter: { enable: true },
    outline: { enable: false }
  })
})

function handleSave() {
  if (!vditorInstance) return
  const markdown = vditorInstance.getValue()
  const title = noteTitle.value.trim() || '未命名笔记'
  console.log('[NotebookEditor] 保存笔记:', { title, markdown })
  // TODO: IPC 调用保存到 user_notes 表
}

onBeforeUnmount(() => {
  if (vditorInstance) {
    vditorInstance.destroy()
    vditorInstance = null
  }
})

defineExpose({ handleSave })
</script>
