<template>
  <!-- 应用主容器 -->
  <div class="app-container">
    <el-container>
      <!-- 页面顶部导航栏 -->
      <el-header>
        <div class="header-content">
          <!-- 应用标志 -->
          <div class="logo">切片工具箱</div>
          <!-- 导航菜单 -->
          <el-menu
            :default-active="activeIndex"
            class="el-menu-demo"
            mode="horizontal"
            router
            @select="handleSelect"
          >
            <!-- 弹幕分析功能入口 -->
            <el-menu-item index="/danmu">弹幕分析</el-menu-item>
            <!-- 音频转文字功能入口 -->
            <el-menu-item index="/audio">音频转文字</el-menu-item>
          </el-menu>
        </div>
      </el-header>
      <!-- 主内容区域，用于显示路由组件 -->
      <el-main>
        <router-view />
      </el-main>
      <!-- 页脚信息 -->
      <el-footer>
        <p>© 2023 视频工具箱 - 让视频剪辑更高效</p>
      </el-footer>
    </el-container>
  </div>
</template>

<script>
/**
 * App.vue - 应用程序主组件
 * 
 * 该组件是整个应用的根组件，负责以下功能：
 * 1. 提供应用的整体布局结构（头部导航、主内容区、页脚）
 * 2. 管理导航菜单的状态和交互
 * 3. 通过router-view加载不同的功能页面
 */
export default {
  name: 'App',
  data() {
    return {
      // 当前激活的导航菜单项，默认为弹幕分析页
      activeIndex: '/danmu'
    }
  },
  methods: {
    /**
     * 处理导航菜单项选择事件
     * @param {string} key - 被选中的菜单项的路由路径
     */
    handleSelect(key) {
      this.activeIndex = key;
    }
  },
  mounted() {
    // 组件挂载时，根据当前路由路径设置活动菜单项
    this.activeIndex = this.$route.path;
  }
}
</script>

<style>
body {
  margin: 0;
  padding: 0;
}

#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  color: #2c3e50;
  height: 100vh;
}

.app-container {
  height: 100%;
}

.el-container {
  height: 100%;
}

.el-header {
  background-color: #fff;
  color: #333;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.12);
  position: relative;
  z-index: 1;
  padding: 0;
}

.header-content {
  display: block;
  height: 100%;
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 20px;
  line-height: 60px;
}

.logo {
  font-size: 20px;
  font-weight: bold;
  margin-right: 20px;
}

.el-menu-item {
  min-width: auto !important;
  padding: 0 10px !important;
  font-size: 16px !important;
  white-space: nowrap !important;
}

.el-menu--horizontal .el-menu-item {
  text-overflow: initial;
  overflow: visible;
  flex: 0 0 auto;
  white-space: nowrap;
  overflow:visible !important;
}

.el-main {
  background-color: #f5f7fa;
  padding: 20px;
}

.el-footer {
  text-align: center;
  color: #909399;
  padding: 20px;
  background-color: #fff;
  border-top: 1px solid #ebeef5;
}
</style>
