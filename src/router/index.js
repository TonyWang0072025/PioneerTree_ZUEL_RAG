import { createRouter, createWebHashHistory } from 'vue-router'
import LawSubject from '../views/LawSubject.vue'
import MathSubject from '../views/MathSubject.vue'
import EconSubject from '../views/EconSubject.vue'
import DocLibrary from '../views/DocLibrary.vue'
import Settings from '../views/Settings.vue'

const routes = [
  { path: '/', redirect: '/law' },
  { path: '/law', name: 'law', component: LawSubject, meta: { subject: '法学' } },
  { path: '/math', name: 'math', component: MathSubject, meta: { subject: '数学' } },
  { path: '/econ', name: 'econ', component: EconSubject, meta: { subject: '经管' } },
  { path: '/docs', name: 'docs', component: DocLibrary, meta: { subject: '文档库' } },
  { path: '/settings', name: 'settings', component: Settings, meta: { subject: '设置' } }
]

const router = createRouter({
  history: createWebHashHistory(),
  routes
})

export default router
