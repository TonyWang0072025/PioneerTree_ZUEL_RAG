<template>
  <div class="h-screen flex flex-col overflow-hidden">
    <!-- Title bar (38px) -->
    <div class="titlebar">
      <div class="titlebar-left">
        <div class="titlebar-logo">树</div>
        <span class="titlebar-title">前人树 — AI 辅助学习</span>
      </div>
    </div>

    <!-- App shell: sidebar + main -->
    <div class="app-shell">
      <!-- Sidebar nav (220px) -->
      <nav class="sidebar">
        <a class="sidebar-brand" href="#" @click.prevent="navigate('/law')">
          <div class="sidebar-brand-icon">树</div>
          <span class="sidebar-brand-text">前人树</span>
        </a>
        <div class="sidebar-nav">
          <button
            v-for="tab in mainTabs"
            :key="tab.path"
            @click="navigate(tab.path)"
            class="nav-item"
            :class="{ active: isActive(tab.path) }"
          >
            <span class="nav-icon">{{ tab.icon }}</span>
            {{ tab.label }}
          </button>
          <div class="nav-divider"></div>
          <button
            v-for="tab in bottomTabs"
            :key="tab.path"
            @click="navigate(tab.path)"
            class="nav-item"
            :class="{ active: isActive(tab.path) }"
          >
            <span class="nav-icon">{{ tab.icon }}</span>
            {{ tab.label }}
          </button>
        </div>
      </nav>

      <!-- Main content -->
      <div class="main-content">
        <router-view />
      </div>
    </div>

    <!-- Status bar (28px) -->
    <div class="statusbar">
      <div
        class="statusbar-dot"
        :style="{ background: apiConnected ? 'var(--accent-tertiary)' : 'var(--fg-muted)' }"
      ></div>
      <span>{{ apiConnected ? 'DeepSeek API 已连接' : '未配置 API Key — 请在设置中配置' }}</span>
      <span style="margin-left:auto">前人树 v1.0.0</span>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'

const route = useRoute()
const router = useRouter()

const mainTabs = [
  { label: '法学', path: '/law', icon: '⚖' },
  { label: '数学', path: '/math', icon: '∑' },
  { label: '经管', path: '/econ', icon: '📊' },
  { label: '文档库', path: '/docs', icon: '📁' }
]

const bottomTabs = [
  { label: '设置', path: '/settings', icon: '⚙' }
]

const apiConnected = ref(false)

onMounted(async () => {
  if (window.electronAPI) {
    try {
      const result = await window.electronAPI.getApiKey()
      apiConnected.value = !!(result.success && result.data)
    } catch {
      apiConnected.value = false
    }
  }
})

function navigate(path) {
  if (route.path !== path) router.push(path)
}

function isActive(path) {
  return route.path === path || (path === '/law' && route.path === '/')
}
</script>
