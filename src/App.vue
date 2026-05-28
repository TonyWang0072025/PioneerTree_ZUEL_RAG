<template>
  <div class="h-screen flex flex-col overflow-hidden">
    <!-- Top Navigation Bar: 56px -->
    <nav class="h-14 flex items-center px-4 bg-white border-b border-gray-200 shrink-0 select-none">
      <span class="text-lg font-bold mr-8" style="color: #012d6a">前人树</span>
      <div class="flex gap-1 h-full">
        <button
          v-for="tab in tabs"
          :key="tab.path"
          @click="$router.push(tab.path)"
          class="px-5 h-full flex items-center text-sm font-medium border-b-[3px] border-transparent transition-colors"
          :class="[
            isActive(tab.path)
              ? 'border-current'
              : 'text-gray-500 hover:text-gray-700'
          ]"
          :style="isActive(tab.path) ? { color: tab.color, borderBottomColor: tab.color } : {}"
        >
          {{ tab.label }}
        </button>
      </div>
    </nav>

    <!-- Main Content Area (fills remaining height) -->
    <main class="flex-1 overflow-hidden">
      <router-view />
    </main>
  </div>
</template>

<script setup>
import { useRoute } from 'vue-router'

const route = useRoute()

const tabs = [
  { label: '法学', path: '/law', color: '#012d6a' },
  { label: '数学', path: '/math', color: '#5d9b50' },
  { label: '经管', path: '/econ', color: '#e42312' },
  { label: '文档库', path: '/docs', color: '#0068ef' },
  { label: '设置', path: '/settings', color: '#0068ef' }
]

function isActive(path) {
  return route.path === path || (path === '/law' && route.path === '/')
}
</script>
