<template>
  <div class="flex flex-col h-full">
    <!-- Notes header: title + actions -->
    <div class="notes-header">
      <div class="notes-title"><span class="dot"></span>边搜边记</div>
      <div class="notes-actions">
        <button
          @click="showDrawer = !showDrawer"
          class="notes-btn" title="笔记列表"
        >☰</button>
        <button
          @click="handleSave"
          :disabled="saving"
          class="notes-btn save"
        >{{ saving ? '...' : '保存' }}</button>
        <button
          @click="handleExport"
          class="notes-btn"
          title="导出 .md 文件"
        >导出</button>
      </div>
    </div>
    <input
      v-model="noteTitle"
      class="note-title-input"
      type="text"
      placeholder="笔记标题..."
    />

    <!-- Editor area -->
    <div class="flex-1 overflow-hidden relative">
      <div ref="vditorRef" class="h-full note-editor-body" style="padding:0" />

      <!-- Notes list drawer overlay -->
      <Transition name="drawer">
        <div v-if="showDrawer" class="absolute inset-0 z-10 flex">
          <div class="flex-1" @click="showDrawer = false" />
          <div class="w-56 bg-white border-l border-gray-200 flex flex-col shadow-lg">
            <div class="px-3 py-2 border-b border-gray-100 text-xs font-semibold text-gray-500 flex justify-between">
              历史笔记
              <button @click="refreshNotes" class="notes-btn" style="padding:2px 8px; font-size:0.7rem">刷新</button>
            </div>
            <div class="flex-1 overflow-y-auto">
              <div v-if="notes.length === 0" class="p-3 text-xs text-gray-400">暂无笔记</div>
              <button
                v-for="note in notes"
                :key="note.id"
                @click="loadNote(note)"
                class="w-full text-left px-3 py-2 text-xs border-b border-gray-50 hover:bg-gray-50 transition-colors"
              >
                <div class="font-medium text-gray-700 truncate">{{ note.title }}</div>
                <div class="text-gray-400 mt-0.5">{{ note.created_at }}</div>
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </div>

    <!-- Save status toast -->
    <Transition name="fade">
      <div v-if="toastMsg" class="px-3 py-1.5 text-xs text-center border-t bg-green-50 text-green-700">
        {{ toastMsg }}
      </div>
    </Transition>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue'
import Vditor from 'vditor'
import 'vditor/dist/index.css'

const noteTitle = ref('')
const vditorRef = ref(null)
const saving = ref(false)
const showDrawer = ref(false)
const notes = ref([])
const toastMsg = ref('')
const currentNoteId = ref(null)
let vditorInstance = null

onMounted(async () => {
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
    toolbarConfig: { hide: false },
    counter: { enable: true },
    outline: { enable: false }
  })

  await refreshNotes()
})

async function handleSave() {
  if (!vditorInstance) return
  const markdown = vditorInstance.getValue()
  const title = noteTitle.value.trim() || '未命名笔记'
  saving.value = true

  if (window.electronAPI) {
    const result = await window.electronAPI.saveNote(title, markdown)
    if (result.success) {
      currentNoteId.value = result.data.id
      showToast('已保存 ' + new Date().toLocaleTimeString())
      await refreshNotes()
    } else {
      showToast('保存失败: ' + result.error)
    }
  } else {
    console.log('[NotebookEditor] 浏览器模式 —', { title, markdown })
    showToast('已保存 (浏览器模式)')
  }
  saving.value = false
}

async function refreshNotes() {
  if (window.electronAPI) {
    const result = await window.electronAPI.listNotes()
    if (result.success) notes.value = result.data
  }
}

async function loadNote(note) {
  if (window.electronAPI) {
    const result = await window.electronAPI.getNote(note.id)
    if (result.success && vditorInstance) {
      noteTitle.value = result.data.title
      currentNoteId.value = result.data.id
      vditorInstance.setValue(result.data.markdown)
    }
  }
  showDrawer.value = false
}

async function handleExport() {
  if (!vditorInstance || !window.electronAPI) return
  const markdown = vditorInstance.getValue()
  const defaultName = (noteTitle.value.trim() || '笔记') + '.md'

  const dialog = await window.electronAPI.showSaveDialog(defaultName)
  if (dialog.canceled || !dialog.filePath) return

  const write = await window.electronAPI.writeFile(dialog.filePath, markdown)
  if (write.success) {
    showToast('已导出: ' + dialog.filePath.split(/[\\/]/).pop())
  } else {
    showToast('导出失败: ' + write.error)
  }
}

function showToast(msg) {
  toastMsg.value = msg
  setTimeout(() => { toastMsg.value = '' }, 2000)
}

onBeforeUnmount(() => {
  if (vditorInstance) {
    vditorInstance.destroy()
    vditorInstance = null
  }
})

defineExpose({ handleSave })
</script>

<style scoped>
.drawer-enter-active, .drawer-leave-active { transition: opacity 0.15s ease; }
.drawer-enter-from, .drawer-leave-to { opacity: 0; }
.fade-enter-active, .fade-leave-active { transition: opacity 0.2s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
</style>
