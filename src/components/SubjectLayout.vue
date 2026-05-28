<template>
  <div class="flex h-full">
    <!-- Left: 70% content area -->
    <div class="flex-1 overflow-y-auto bg-white" style="flex-basis: 70%">
      <div class="max-w-[900px] mx-auto py-6 px-8">
        <slot />
      </div>
    </div>

    <!-- Right: 30% floating notebook -->
    <div class="shrink-0 border-l border-gray-200 bg-gray-50 flex flex-col" style="flex-basis: 30%">
      <div class="px-4 py-3 border-b border-gray-200 bg-white">
        <h3 class="text-sm font-semibold text-gray-700">边搜边记</h3>
      </div>
      <div class="flex-1 overflow-hidden">
        <slot name="notebook">
          <NotebookEditor />
        </slot>
      </div>
    </div>
  </div>
</template>

<script setup>
import NotebookEditor from './NotebookEditor.vue'

defineProps({
  subject: { type: String, default: '' },
  themeColor: { type: String, default: '#333333' }
})
</script>
