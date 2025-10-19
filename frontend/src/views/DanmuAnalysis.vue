<template>
  <!-- 弹幕分析页面主容器 -->
  <div class="danmu-analysis">
    <el-card class="box-card">
      <!-- 卡片标题 -->
      <template #header>
        <div class="card-header">
          <h2>弹幕分析</h2>
        </div>
      </template>
      <!-- 输入表单 -->
      <el-form :model="form" label-width="120px">
        <el-form-item label="B站视频链接">
          <el-input v-model="form.videoUrl" placeholder="请输入B站视频链接" clearable></el-input>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="analyzeDanmu" :loading="loading">开始分析</el-button>
        </el-form-item>
      </el-form>
      
      <!-- 分析结果展示区域 -->
      <div v-if="result" class="result-container">
        <h3>分析结果</h3>
        <el-divider></el-divider>
        
        <!-- 视频基本信息 -->
        <div v-if="result.videoInfo" class="video-info">
          <h4>视频信息</h4>
          <p><strong>标题：</strong>{{ result.videoInfo.title }}</p>
          <p><strong>UP主：</strong>{{ result.videoInfo.uploader.name }}</p>
          <p><strong>时长：</strong>{{ formatDuration(result.videoInfo.duration) }}</p>
        </div>
        
        <!-- 高能时刻列表 -->
        <div v-if="result.highlights && result.highlights.length > 0" class="highlights">
          <h4>高能时刻</h4>
          <el-timeline>
            <el-timeline-item
              v-for="(highlight, index) in result.highlights"
              :key="index"
              :timestamp="highlight.displayTime"
              type="primary"
            >
              {{ highlight.hotWords.join(', ') }}
            </el-timeline-item>
          </el-timeline>
        </div>
      </div>
    </el-card>
  </div>
</template>

<script>
/**
 * DanmuAnalysis.vue - 弹幕分析页面组件
 * 
 * 该组件实现B站视频弹幕分析功能，包括：
 * 1. 接收用户输入的B站视频链接
 * 2. 调用后端API进行弹幕获取和分析
 * 3. 展示分析结果，包括视频信息和高能时刻
 */
export default {
  name: 'DanmuAnalysis',
  data() {
    return {
      // 表单数据
      form: {
        videoUrl: '' // 用户输入的B站视频链接
      },
      loading: false, // 加载状态标志
      result: null    // 分析结果数据
    }
  },
  methods: {
    /**
     * 弹幕分析主函数
     * 验证输入并调用后端API进行分析
     */
    analyzeDanmu() {
      // 输入验证
      if (!this.form.videoUrl) {
        this.$message.warning('请输入视频链接');
        return;
      }
      
      this.loading = true;
      
      // 调用后端API
      fetch('/api/danmu', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          url: this.form.videoUrl
        })
      })
      .then(response => {
        if (!response.ok) {
          throw new Error('分析失败');
        }
        return response.json();
      })
      .then(data => {
        this.result = data;
        this.$message.success('分析完成');
      })
      .catch(error => {
        console.error('Error:', error);
        this.$message.error('分析失败：' + error.message);
      })
      .finally(() => {
        this.loading = false;
      });
    },
    /**
     * 格式化视频时长
     * @param {number} seconds - 视频时长（秒）
     * @return {string} 格式化后的时长字符串 (HH:MM:SS)
     */
    formatDuration(seconds) {
      const h = Math.floor(seconds / 3600);
      const m = Math.floor((seconds % 3600) / 60);
      const s = seconds % 60;
      
      return [
        h > 0 ? h : null,
        h > 0 ? String(m).padStart(2, '0') : m,
        String(s).padStart(2, '0')
      ].filter(Boolean).join(':');
    }
  }
}
</script>

<style scoped>
.danmu-analysis {
  max-width: 1000px;
  margin: 0 auto;
  padding: 20px;
}

.result-container {
  margin-top: 20px;
}

.video-info {
  margin-bottom: 20px;
}

.highlights {
  margin-top: 20px;
}
</style>