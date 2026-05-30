<template>
  <div class="h-screen flex flex-col overflow-hidden">
    <!-- Title bar (38px) -->
    <div class="titlebar">
      <div class="titlebar-left">
        <div class="titlebar-logo">树</div>
        <span class="titlebar-title">前人树 — AI 辅助学习</span>
      </div>
      <div class="titlebar-controls">
        <button class="titlebar-btn" title="最小化">&#x2014;</button>
        <button class="titlebar-btn" title="最大化">&#9633;</button>
        <button class="titlebar-btn close" title="关闭">&#10005;</button>
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
        <div class="sidebar-footer">
          <div class="avatar">ZJ</div>
          <div class="sidebar-user-info">
            <div class="sidebar-user-name">周杰</div>
            <div class="sidebar-user-role">学习中</div>
          </div>
        </div>
      </nav>

      <!-- Main content -->
      <div class="main-content">
        <router-view />
      </div>
    </div>

    <!-- Status bar (28px) -->
    <div class="statusbar">
      <div class="statusbar-dot"></div>
      <span>DeepSeek API 已连接</span>
      <span style="margin-left:auto">前人树 v1.0.0</span>
    </div>
  </div>
</template>

<script setup>
import { useRoute, useRouter } from 'vue-router'

const route = useRoute()
const router = useRouter()

const mainTabs = [
  { label: '法学', path: '/law', icon: '⚖', color: '#1B4965' },
  { label: '数学', path: '/math', icon: '∑', color: '#81B29A' },
  { label: '经管', path: '/econ', icon: '📊', color: '#E07A5F' },
  { label: '文档库', path: '/docs', icon: '📁', color: '#1B4965' }
]

const bottomTabs = [
  { label: '设置', path: '/settings', icon: '⚙', color: '#1B4965' }
]

function navigate(path) {
  if (route.path !== path) router.push(path)
}

function isActive(path) {
  return route.path === path || (path === '/law' && route.path === '/')
}
</script>
