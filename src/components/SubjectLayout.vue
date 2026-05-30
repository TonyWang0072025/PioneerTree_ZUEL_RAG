<template>
  <div class="flex h-full">
    <!-- Left: main content area -->
    <div class="flex-1 overflow-y-auto min-w-0">
      <div class="max-w-[900px] mx-auto py-7 px-9">
        <slot />
      </div>
    </div>

    <!-- Right: notes-panel (320px) -->
    <aside class="notes-panel">
      <slot name="notebook">
        <NotebookEditor />
      </slot>
    </aside>
  </div>
</template>

<script setup>
import NotebookEditor from './NotebookEditor.vue'

defineProps({
  subject: { type: String, default: '' },
  themeColor: { type: String, default: '#1B4965' }
})
</script>
