<template>
  <div class="flex h-full" @mousemove="onDrag" @mouseup="stopDrag" @mouseleave="stopDrag">
    <!-- Left: main content area -->
    <div class="flex-1 overflow-y-auto min-w-0">
      <div class="max-w-[900px] mx-auto py-7 px-9">
        <slot />
      </div>
    </div>

    <!-- Resize handle -->
    <div
      v-if="!panelCollapsed"
      class="resize-handle"
      :class="{ dragging: isDragging }"
      @mousedown="startDrag"
    >
      <!-- Collapse button -->
      <button
        class="panel-toggle-btn"
        style="position:absolute; top:50%; left:50%; transform:translate(-50%,-50%); z-index:1"
        @mousedown.stop
        @click.stop="togglePanel"
        :title="panelCollapsed ? '展开侧边栏' : '收起侧边栏'"
      >{{ panelCollapsed ? '◀' : '▶' }}</button>
    </div>

    <!-- Expand button when collapsed -->
    <button
      v-if="panelCollapsed"
      class="panel-toggle-btn"
      style="position:absolute; right:8px; top:8px; z-index:10; width:28px; height:28px"
      @click="togglePanel"
      title="展开侧边栏"
    >◀</button>

    <!-- Right: notes-panel (resizable) -->
    <aside
      class="notes-panel"
      :style="{ width: panelCollapsed ? '0px' : panelWidth + 'px', overflow: panelCollapsed ? 'hidden' : '' }"
    >
      <!-- Tab header (when showAiTab) -->
      <div class="notes-header" v-if="showAiTab">
        <div class="notes-tabs">
          <button
            class="notes-tab-btn"
            :class="{ active: activeTab === 'notes' }"
            @click="activeTab = 'notes'"
          >记事本</button>
          <button
            class="notes-tab-btn"
            :class="{ active: activeTab === 'ai' }"
            @click="activeTab = 'ai'"
          >AI 导师</button>
        </div>
      </div>

      <!-- Tab content with keep-alive -->
      <template v-if="showAiTab">
        <div class="flex-1 overflow-hidden flex flex-col" v-show="activeTab === 'notes'">
          <NotebookEditor :key="'notes-editor'" />
        </div>
        <div class="flex-1 overflow-y-auto" v-show="activeTab === 'ai'">
          <div class="notes-header">
            <div class="notes-title"><span class="dot"></span>AI 法学导师</div>
          </div>
          <slot name="ai-tutor" />
        </div>
      </template>

      <!-- Default: just notebook (no tabs) -->
      <template v-else>
        <slot name="notebook">
          <NotebookEditor />
        </slot>
      </template>
    </aside>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import NotebookEditor from './NotebookEditor.vue'

defineProps({
  subject: { type: String, default: '' },
  themeColor: { type: String, default: '#1B4965' },
  showAiTab: { type: Boolean, default: false }
})

const panelWidth = ref(320)
const panelCollapsed = ref(false)
const isDragging = ref(false)
let dragStartX = 0
let dragStartWidth = 0
let savedWidth = 320

function startDrag(e) {
  isDragging.value = true
  dragStartX = e.clientX
  dragStartWidth = panelWidth.value
  e.preventDefault()
}

function onDrag(e) {
  if (!isDragging.value) return
  const containerWidth = e.currentTarget.offsetWidth
  const dx = dragStartX - e.clientX
  let newWidth = dragStartWidth + dx

  const minWidth = Math.floor(containerWidth * 0.20)
  const maxWidth = Math.floor(containerWidth * 0.50)
  newWidth = Math.max(minWidth, Math.min(maxWidth, newWidth))

  panelWidth.value = newWidth
  savedWidth = newWidth
}

function stopDrag() {
  isDragging.value = false
}

function togglePanel() {
  if (panelCollapsed.value) {
    panelWidth.value = savedWidth
    panelCollapsed.value = false
  } else {
    savedWidth = panelWidth.value
    panelCollapsed.value = true
  }
}

const activeTab = ref('notes')

function switchToAiTab() {
  activeTab.value = 'ai'
}

defineExpose({ switchToAiTab })
</script>
