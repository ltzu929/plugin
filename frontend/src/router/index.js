import { createRouter, createWebHistory } from 'vue-router'

// 导入页面组件
const DanmuAnalysis = () => import('../views/DanmuAnalysis.vue')
const AudioToText = () => import('../views/AudioToText.vue')

// 定义路由
const routes = [
  {
    path: '/',
    redirect: '/danmu'
  },
  {
    path: '/danmu',
    name: 'DanmuAnalysis',
    component: DanmuAnalysis,
    meta: {
      title: '弹幕分析'
    }
  },
  {
    path: '/audio',
    name: 'AudioToText',
    component: AudioToText,
    meta: {
      title: '音频转文字'
    }
  }
]

// 创建路由实例
const router = createRouter({
  history: createWebHistory(),
  routes
})

// 路由前置守卫，设置页面标题
router.beforeEach((to, from, next) => {
  document.title = to.meta.title || '视频工具箱'
  next()
})

export default router